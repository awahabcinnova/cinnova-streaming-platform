from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash password with argon2."""
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash."""
    try:
        return pwd_context.verify(password, password_hash)
    except ValueError:
        return False


def _now() -> datetime:
    return datetime.now(UTC)


def new_session_token() -> str:
    # 32 bytes URL-safe => ~43 chars, good entropy.
    return secrets.token_urlsafe(32)


def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _encode_jwt(payload: dict, expires_in_seconds: int) -> str:
    settings = get_settings()
    exp = _now() + timedelta(seconds=expires_in_seconds)
    to_encode = dict(payload)
    to_encode.update({"exp": exp})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(*, user_id: uuid.UUID, session_id: uuid.UUID) -> str:
    return _encode_jwt(
        {
            "typ": "access",
            "sub": str(user_id),
            "sid": str(session_id),
            "jti": secrets.token_hex(16),
            "iat": int(_now().timestamp()),
        },
        expires_in_seconds=get_settings().access_token_ttl_seconds,
    )


def create_refresh_token(*, user_id: uuid.UUID, session_id: uuid.UUID) -> tuple[str, str, datetime]:
    """
    Returns: (jwt_token, jti, expires_at)
    """
    settings = get_settings()
    jti = secrets.token_hex(32)
    expires_at = _now() + timedelta(seconds=settings.refresh_token_ttl_seconds)
    token = _encode_jwt(
        {
            "typ": "refresh",
            "sub": str(user_id),
            "sid": str(session_id),
            "jti": jti,
            "iat": int(_now().timestamp()),
        },
        expires_in_seconds=settings.refresh_token_ttl_seconds,
    )
    return token, jti, expires_at


class TokenError(Exception):
    pass


def decode_jwt(token: str) -> dict:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError as e:
        raise TokenError("Invalid token") from e
