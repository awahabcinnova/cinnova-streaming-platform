from __future__ import annotations

from datetime import UTC, datetime

from fastapi import Response

from app.core.config import Settings, get_settings


def normalize_samesite(value: str) -> str:
    v = (value or "").strip().strip('"').strip("'").strip().lower()
    if v in {"lax", "strict", "none"}:
        return v
    return "lax"


def _same_site(settings: Settings) -> str:
    return normalize_samesite(settings.cookie_samesite)


def set_auth_cookies(
    response: Response,
    *,
    access_token: str,
    refresh_token: str,
    session_token: str,
    session_expires_at: datetime,
) -> None:
    settings = get_settings()

    common = {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": _same_site(settings),
        "domain": settings.cookie_domain or None,
        "path": "/",
    }

    response.set_cookie(
        key=settings.cookie_access_name,
        value=access_token,
        max_age=settings.access_token_ttl_seconds,
        **common,
    )

    response.set_cookie(
        key=settings.cookie_refresh_name,
        value=refresh_token,
        max_age=settings.refresh_token_ttl_seconds,
        **common,
    )

    now = datetime.now(UTC)
    if session_expires_at.tzinfo is None:
        session_expires_at = session_expires_at.replace(tzinfo=UTC)
    max_age = int((session_expires_at - now).total_seconds())
    if max_age < 0:
        max_age = 0
    response.set_cookie(
        key=settings.cookie_session_name,
        value=session_token,
        max_age=max_age,
        **common,
    )


def clear_auth_cookies(response: Response) -> None:
    settings = get_settings()
    common = {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": _same_site(settings),
        "domain": settings.cookie_domain or None,
        "path": "/",
    }
    response.delete_cookie(settings.cookie_access_name, **common)
    response.delete_cookie(settings.cookie_refresh_name, **common)
    response.delete_cookie(settings.cookie_session_name, **common)
