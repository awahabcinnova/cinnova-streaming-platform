from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session_dep
from app.models.comment import Comment
from app.models.user import User
from app.schemas.v1 import V1Comment

router = APIRouter()


class CommentCreateBody(BaseModel):
    video_id: str
    user_id: str
    text: str


@router.get("/", response_model=list[V1Comment])
async def list_comments(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(db_session_dep)) -> list[V1Comment]:
    """Get list of recent comments"""
    rows = (await db.execute(select(Comment).order_by(Comment.created_at.desc()).offset(skip).limit(limit))).scalars().all()
    if not rows:
        return []
    
    user_ids = {c.user_id for c in rows}
    users = (await db.execute(select(User).where(User.id.in_(user_ids)))).scalars().all()
    users_by_id = {u.id: u for u in users}
    
    out: list[V1Comment] = []
    for c in rows:
        u = users_by_id.get(c.user_id)
        ts = c.created_at.isoformat() if isinstance(c.created_at, datetime) else str(c.created_at)
        out.append(
            V1Comment(
                id=str(c.id),
                userId=str(c.user_id),
                username=(u.username if u else "unknown"),
                text=c.text,
                timestamp=ts,
                likes=c.likes_count,
            )
        )
    return out


@router.get("/video/{videoId}", response_model=list[V1Comment])
async def get_comments(videoId: str, db: AsyncSession = Depends(db_session_dep)) -> list[V1Comment]:
    vid = uuid.UUID(videoId)
    rows = (
        (await db.execute(select(Comment).where(Comment.video_id == vid).order_by(Comment.created_at.desc())))
        .scalars()
        .all()
    )
    if not rows:
        return []

    user_ids = {c.user_id for c in rows}
    users = (await db.execute(select(User).where(User.id.in_(user_ids)))).scalars().all()
    users_by_id = {u.id: u for u in users}

    out: list[V1Comment] = []
    for c in rows:
        u = users_by_id.get(c.user_id)
        ts = c.created_at.isoformat() if isinstance(
            c.created_at, datetime) else str(c.created_at)
        out.append(
            V1Comment(
                id=str(c.id),
                userId=str(c.user_id),
                username=(u.username if u else "unknown"),
                text=c.text,
                timestamp=ts,
                likes=c.likes_count,
            )
        )
    return out


@router.post("/create", response_model=V1Comment, status_code=status.HTTP_201_CREATED)
async def create_comment(payload: CommentCreateBody, db: AsyncSession = Depends(db_session_dep)) -> V1Comment:
    vid = uuid.UUID(payload.video_id)
    uid = uuid.UUID(payload.user_id)
    row = Comment(video_id=vid, user_id=uid, text=payload.text)
    db.add(row)
    await db.commit()
    await db.refresh(row)

    user = await db.scalar(select(User).where(User.id == uid))
    ts = row.created_at.isoformat() if isinstance(
        row.created_at, datetime) else str(row.created_at)
    return V1Comment(
        id=str(row.id),
        userId=str(uid),
        username=(user.username if user else "unknown"),
        text=row.text,
        timestamp=ts,
        likes=row.likes_count,
    )
