from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
import os

from app.api.deps import db_session_dep, require_user
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.v1 import V1User

router = APIRouter()


@router.get("/", response_model=list[V1User])
async def list_users(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(db_session_dep)) -> list[V1User]:
    """Get list of users"""
    users = (await db.execute(select(User).offset(skip).limit(limit))).scalars().all()
    if not users:
        return []

    result = []
    for user in users:
        subs = await db.scalar(select(func.count()).select_from(Subscription).where(Subscription.channel_id == user.id))
        result.append(V1User(id=str(user.id), username=user.username,
                      avatar=user.avatar_url or "", banner=getattr(user, "banner_url", "") or "", subscribers=int(subs or 0)))

    return result


@router.get("/{id}", response_model=V1User)
async def get_user(id: str, db: AsyncSession = Depends(db_session_dep)) -> V1User:
    uid = uuid.UUID(id)
    user = await db.scalar(select(User).where(User.id == uid))
    if user is None:
        return V1User(id=id, username="unknown", avatar="", banner="", subscribers=0)
    subs = await db.scalar(select(func.count()).select_from(Subscription).where(Subscription.channel_id == user.id))
    return V1User(id=str(user.id), username=user.username, avatar=user.avatar_url or "", banner=getattr(user, "banner_url", "") or "", subscribers=int(subs or 0))


@router.post("/me/avatar", status_code=200)
async def upload_avatar(
    db: AsyncSession = Depends(db_session_dep),
    avatar: UploadFile = File(...),
    current_user: User = Depends(require_user),
):
    # Save avatar to media/avatars
    ext = os.path.splitext(avatar.filename)[1]
    filename = f"{current_user.id}{ext}"
    avatar_dir = os.path.abspath(os.path.join(
        os.path.dirname(__file__), '../../../media/avatars'))
    os.makedirs(avatar_dir, exist_ok=True)
    avatar_path = os.path.join(avatar_dir, filename)
    with open(avatar_path, "wb") as f:
        f.write(await avatar.read())
    # Update user avatar_url
    current_user.avatar_url = f"/media/avatars/{filename}"
    await db.commit()
    return {"avatar": current_user.avatar_url}


@router.delete("/me/avatar", status_code=204)
async def delete_avatar(
    db: AsyncSession = Depends(db_session_dep),
    current_user: User = Depends(require_user),
):
    # Remove avatar file
    if current_user.avatar_url:
        avatar_path = os.path.abspath(os.path.join(os.path.dirname(
            __file__), f"../../../{current_user.avatar_url.lstrip('/')}"))
        if os.path.exists(avatar_path):
            os.remove(avatar_path)
        current_user.avatar_url = ""
        await db.commit()
    return {}


@router.post("/me/banner", status_code=200)
async def upload_banner(
    db: AsyncSession = Depends(db_session_dep),
    banner: UploadFile = File(...),
    current_user: User = Depends(require_user),
):
    # Save banner to media/banners
    ext = os.path.splitext(banner.filename)[1]
    filename = f"{current_user.id}{ext}"
    banner_dir = os.path.abspath(os.path.join(
        os.path.dirname(__file__), '../../../media/banners'))
    os.makedirs(banner_dir, exist_ok=True)
    banner_path = os.path.join(banner_dir, filename)
    with open(banner_path, "wb") as f:
        f.write(await banner.read())
    # Update user banner_url
    current_user.banner_url = f"/media/banners/{filename}"
    await db.commit()
    return {"banner": current_user.banner_url}


@router.delete("/me/banner", status_code=204)
async def delete_banner(
    db: AsyncSession = Depends(db_session_dep),
    current_user: User = Depends(require_user),
):
    # Remove banner file
    if getattr(current_user, 'banner_url', None):
        banner_path = os.path.abspath(os.path.join(os.path.dirname(
            __file__), f"../../../{current_user.banner_url.lstrip('/')}"))
        if os.path.exists(banner_path):
            os.remove(banner_path)
        current_user.banner_url = None
        await db.commit()
    return {}
