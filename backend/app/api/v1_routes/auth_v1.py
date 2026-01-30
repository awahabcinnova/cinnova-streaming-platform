from __future__ import annotations

import re
import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, Form, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session_dep
from app.core.config import get_settings
from app.core.cookies import clear_auth_cookies, set_auth_cookies
from app.core.errors import AuthInvalid
from app.core.security import TokenError, decode_jwt, sha256_hex
from app.models.session import Session
from app.models.user import User
from app.schemas.v1 import V1User
from app.services.auth_service import AuthService

router = APIRouter()


def _username_from_email(email: str) -> str:
    # Simple deterministic username seed; collisions handled by suffixing.
    base = re.sub(r"[^a-zA-Z0-9_]+", "", email.split("@", 1)[0])[:20] or "user"
    return base.lower()


def _to_v1_user(user: User, subscribers: int = 0) -> V1User:
    return V1User(
        id=str(user.id),
        username=user.username,
        avatar=user.avatar_url or "",
        banner=getattr(user, "banner_url", "") or "",
        subscribers=subscribers,
    )


@router.get("/google/login")
async def google_login() -> RedirectResponse:
    settings = get_settings()
    if not settings.google_client_id or not settings.google_redirect_uri:
        raise AuthInvalid("Google OAuth is not configured")

    state = secrets.token_urlsafe(32)

    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)

    resp = RedirectResponse(url=url, status_code=status.HTTP_302_FOUND)
    resp.set_cookie(
        key="google_oauth_state",
        value=state,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite.lower(),
        path="/",
    )
    return resp


@router.get("/google/callback")
async def google_callback(
    request: Request,
    response: Response,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: AsyncSession = Depends(db_session_dep),
) -> RedirectResponse:
    settings = get_settings()
    frontend_redirect = settings.frontend_base_url.rstrip("/") + "/#/"

    if error:
        return RedirectResponse(url=frontend_redirect + "login?error=google", status_code=status.HTTP_302_FOUND)

    if not code or not state:
        return RedirectResponse(url=frontend_redirect + "login?error=google", status_code=status.HTTP_302_FOUND)

    expected_state = request.cookies.get("google_oauth_state")
    if not expected_state or expected_state != state:
        return RedirectResponse(url=frontend_redirect + "login?error=google_state", status_code=status.HTTP_302_FOUND)

    if not settings.google_client_id or not settings.google_client_secret or not settings.google_redirect_uri:
        raise AuthInvalid("Google OAuth is not configured")

    async with httpx.AsyncClient(timeout=10) as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if token_resp.status_code != 200:
            return RedirectResponse(url=frontend_redirect + "login?error=google_token", status_code=status.HTTP_302_FOUND)
        token_data = token_resp.json()

        access_token = token_data.get("access_token")
        if not access_token:
            return RedirectResponse(url=frontend_redirect + "login?error=google_token", status_code=status.HTTP_302_FOUND)

        userinfo_resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_resp.status_code != 200:
            return RedirectResponse(url=frontend_redirect + "login?error=google_userinfo", status_code=status.HTTP_302_FOUND)

        info = userinfo_resp.json()

    google_sub = info.get("sub")
    email = info.get("email")
    picture = info.get("picture")

    if not google_sub or not email:
        return RedirectResponse(url=frontend_redirect + "login?error=google_profile", status_code=status.HTTP_302_FOUND)

    user = await db.scalar(select(User).where(User.google_sub == google_sub))
    if user is None:
        user = await db.scalar(select(User).where(User.email == email))
        if user is None:
            # Create user with a random password hash; user can still login via Google.
            random_password = secrets.token_urlsafe(24)
            user = await AuthService.register_user(db, email=email, password=random_password, display_name=None)
            user.username = _username_from_email(email)
        user.google_sub = google_sub
        user.google_email = email
        if picture and not user.avatar_url:
            user.avatar_url = picture
        await db.flush()

    session, session_token, access, refresh = await AuthService.create_login_session(db, user=user)
    await db.commit()

    redirect_resp = RedirectResponse(url=frontend_redirect, status_code=status.HTTP_302_FOUND)
    set_auth_cookies(
        redirect_resp,
        access_token=access,
        refresh_token=refresh,
        session_token=session_token,
        session_expires_at=session.expires_at,
    )
    redirect_resp.delete_cookie("google_oauth_state", path="/")
    return redirect_resp


@router.post("/login", status_code=status.HTTP_200_OK)
async def login(
    response: Response,
    db: AsyncSession = Depends(db_session_dep),
    username: str = Form(...),
    password: str = Form(...),
) -> dict:
    # Frontend sends `username` but uses email value.
    user = await AuthService.authenticate_user(db, email=username, password=password)
    session, session_token, access, refresh = await AuthService.create_login_session(db, user=user)
    await db.commit()
    set_auth_cookies(
        response,
        access_token=access,
        refresh_token=refresh,
        session_token=session_token,
        session_expires_at=session.expires_at,
    )
    # Frontend expects JSON body, but tokens must never be returned. Return user only.
    return _to_v1_user(user).model_dump()


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    response: Response,
    db: AsyncSession = Depends(db_session_dep),
    email: str = Form(...),
    password: str = Form(...),
    first_name: str = Form(""),
    last_name: str = Form(""),
) -> dict:
    # v1 UI wants form fields. We map to our user model.
    display_name = (first_name + " " + last_name).strip() or None

    # Create a unique username
    base = _username_from_email(email)
    username_candidate = base
    for i in range(0, 1000):
        try_name = username_candidate if i == 0 else f"{base}{i}"
        existing = await db.scalar(select(User).where(User.username == try_name))
        if existing is None:
            username_candidate = try_name
            break

    user = await AuthService.register_user(db, email=email, password=password, display_name=display_name)
    user.username = username_candidate
    user.avatar_url = ""

    session, session_token, access, refresh = await AuthService.create_login_session(db, user=user)
    await db.commit()

    set_auth_cookies(
        response,
        access_token=access,
        refresh_token=refresh,
        session_token=session_token,
        session_expires_at=session.expires_at,
    )
    return _to_v1_user(user).model_dump()


@router.get("/users/me", status_code=status.HTTP_200_OK)
async def users_me(request: Request) -> dict:
    # Frontend currently calls this with Bearer token, but we use cookie auth.
    user = getattr(request.state, "user", None)
    if user is None:
        raise AuthInvalid("Not authenticated")
    return _to_v1_user(user).model_dump()


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, response: Response, db: AsyncSession = Depends(db_session_dep)) -> None:
    from app.core.config import get_settings

    settings = get_settings()
    session_token = request.cookies.get(settings.cookie_session_name)
    clear_auth_cookies(response)

    if session_token:
        await AuthService.revoke_session_by_token(db, session_token=session_token)
        await db.commit()
    return None


@router.post("/refresh", status_code=status.HTTP_204_NO_CONTENT)
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(db_session_dep)) -> None:
    """
    Cookie-only refresh with rotation:
    - validates refresh JWT cookie
    - checks server-side session token cookie + DB session
    - rotates refresh token and mints new access token
    """
    from datetime import UTC, datetime
    import uuid
    from app.core.config import get_settings

    def _now():
        return datetime.now(UTC)

    settings = get_settings()
    refresh_token = request.cookies.get(settings.cookie_refresh_name)
    session_token = request.cookies.get(settings.cookie_session_name)
    if not refresh_token or not session_token:
        raise AuthInvalid("Missing refresh/session cookie")

    try:
        claims = decode_jwt(refresh_token)
    except TokenError as e:
        raise AuthInvalid("Invalid refresh token") from e

    if claims.get("typ") != "refresh":
        raise AuthInvalid("Invalid refresh token")

    sub = claims.get("sub")
    sid = claims.get("sid")
    jti = claims.get("jti")
    if not sub or not sid or not jti:
        raise AuthInvalid("Invalid refresh token")

    try:
        user_id = uuid.UUID(str(sub))
        session_id = uuid.UUID(str(sid))
    except ValueError as e:
        raise AuthInvalid("Invalid refresh token") from e

    session = await db.scalar(
        select(Session).where(
            Session.id == session_id,
            Session.session_token_hash == sha256_hex(session_token),
            Session.revoked_at.is_(None),
            Session.expires_at > _now(),
        )
    )
    if session is None:
        raise AuthInvalid("Session is expired or revoked")

    new_access, new_refresh = await AuthService.rotate_refresh(
        db, session_id=session_id, user_id=user_id, presented_jti=str(jti)
    )
    await db.commit()

    set_auth_cookies(
        response,
        access_token=new_access,
        refresh_token=new_refresh,
        session_token=session_token,
        session_expires_at=session.expires_at,
    )
    return None
