from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from sqlalchemy import select

from app.core.config import get_settings
from app.core.security import TokenError, decode_jwt, sha256_hex
from app.db.database import AsyncSessionLocal
from app.models.session import Session
from app.models.user import User


def _now() -> datetime:
    return datetime.now(UTC)


class AuthContextMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next) -> Response:
        settings = get_settings()
        request.state.user = None
        request.state.user_id = None
        request.state.session_id = None

        access = request.cookies.get(settings.cookie_access_name)
        session_token = request.cookies.get(settings.cookie_session_name)
        if not access or not session_token:
            return await call_next(request)

        try:
            claims = decode_jwt(access)
        except TokenError:
            return await call_next(request)

        if claims.get("typ") != "access":
            return await call_next(request)

        sub = claims.get("sub")
        sid = claims.get("sid")
        if not sub or not sid:
            return await call_next(request)

        try:
            user_id = uuid.UUID(str(sub))
            session_id = uuid.UUID(str(sid))
        except ValueError:
            return await call_next(request)

        async with AsyncSessionLocal() as db:
            now = _now()
            token_hash = sha256_hex(session_token)

            session = await db.scalar(
                select(Session).where(
                    Session.id == session_id,
                    Session.session_token_hash == token_hash,
                    Session.revoked_at.is_(None),
                    Session.expires_at > now,
                )
            )
            if session is None:
                return await call_next(request)

            user = await db.scalar(select(User).where(User.id == user_id, User.is_active.is_(True)))
            if user is None:
                return await call_next(request)

            session.last_seen_at = now
            await db.commit()

            request.state.user = user
            request.state.user_id = user.id
            request.state.session_id = session_id

        return await call_next(request)
