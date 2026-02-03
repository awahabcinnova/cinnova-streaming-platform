from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import AuthInvalid, Conflict
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    new_session_token,
    sha256_hex,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.session import Session
from app.models.user import User


def _now() -> datetime:
    return datetime.now(UTC)


class AuthService:
    @staticmethod
    async def register_user(db: AsyncSession, *, email: str, password: str, display_name: str | None) -> User:
        existing = await db.scalar(select(User).where(User.email == email))
        if existing is not None:
            raise Conflict("Email already registered")

        user = User(
            email=email,
            password_hash=hash_password(password),
            display_name=display_name,
            username=f"user_{uuid.uuid4().hex[:10]}",
        )
        db.add(user)
        await db.flush()
        return user

    @staticmethod
    async def authenticate_user(db: AsyncSession, *, email: str, password: str) -> User:
        user = await db.scalar(select(User).where(User.email == email))
        if user is None or not user.is_active:
            raise AuthInvalid("Invalid email or password")
        if not verify_password(password, user.password_hash):
            raise AuthInvalid("Invalid email or password")
        return user

    @staticmethod
    async def create_login_session(db: AsyncSession, *, user: User) -> tuple[Session, str, str, str]:
     
        settings = get_settings()

        session_token = new_session_token()
        session = Session(
            user_id=user.id,
            session_token_hash=sha256_hex(session_token),
            expires_at=_now() + timedelta(seconds=settings.session_ttl_seconds),
            revoked_at=None,
        )
        db.add(session)
        await db.flush()

        access = create_access_token(user_id=user.id, session_id=session.id)
        refresh, jti, refresh_expires_at = create_refresh_token(
            user_id=user.id, session_id=session.id)

        db.add(RefreshToken(jti=jti, session_id=session.id,
               expires_at=refresh_expires_at))
        await db.flush()

        return session, session_token, access, refresh

    @staticmethod
    async def revoke_session_by_token(db: AsyncSession, *, session_token: str) -> None:
        token_hash = sha256_hex(session_token)
        session = await db.scalar(select(Session).where(Session.session_token_hash == token_hash))
        if session is None:
            return
        await AuthService.revoke_session(db, session_id=session.id)

    @staticmethod
    async def revoke_session(db: AsyncSession, *, session_id: uuid.UUID) -> None:
        now = _now()
        await db.execute(
            update(Session)
            .where(Session.id == session_id, Session.revoked_at.is_(None))
            .values(revoked_at=now)
        )
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.session_id == session_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=now)
        )

    @staticmethod
    async def rotate_refresh(
        db: AsyncSession,
        *,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
        presented_jti: str,
    ) -> tuple[str, str]:

        now = _now()
        token_row = await db.scalar(select(RefreshToken).where(RefreshToken.jti == presented_jti))
        if token_row is None or token_row.session_id != session_id:
            raise AuthInvalid("Refresh token is invalid")

        if token_row.revoked_at is not None:
            await AuthService.revoke_session(db, session_id=session_id)
            raise AuthInvalid("Refresh token reuse detected")

        if token_row.expires_at <= now:
            raise AuthInvalid("Refresh token is expired")

        new_refresh, new_jti, new_refresh_expires_at = create_refresh_token(
            user_id=user_id, session_id=session_id)
        db.add(RefreshToken(jti=new_jti, session_id=session_id,
               expires_at=new_refresh_expires_at))

        token_row.revoked_at = now
        token_row.replaced_by_jti = new_jti

        new_access = create_access_token(
            user_id=user_id, session_id=session_id)
        return new_access, new_refresh
