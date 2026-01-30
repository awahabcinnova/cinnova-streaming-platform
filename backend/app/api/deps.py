from __future__ import annotations

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AuthRequired
from app.db.database import get_db_session
from app.models.user import User


def get_request_user(request: Request) -> User | None:
    return getattr(request.state, "user", None)


async def require_user(request: Request) -> User:
    user = get_request_user(request)
    if user is None:
        raise AuthRequired()
    return user


async def db_session_dep(session: AsyncSession = Depends(get_db_session)) -> AsyncSession:
    return session
