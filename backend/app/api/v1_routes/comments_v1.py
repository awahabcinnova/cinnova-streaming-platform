from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session_dep, require_user
from app.core.errors import Forbidden
from app.models.comment import Comment
from app.models.user import User
from app.schemas.v1 import V1Comment

router = APIRouter()


class CommentCreateBody(BaseModel):
    video_id: str
    text: str
    parent_id: str | None = None


class CommentUpdateBody(BaseModel):
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
                parentId=str(c.parent_id) if c.parent_id else None,
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
                parentId=str(c.parent_id) if c.parent_id else None,
            )
        )
    return out


@router.post("/create", response_model=V1Comment, status_code=status.HTTP_201_CREATED)
async def create_comment(
    payload: CommentCreateBody,
    db: AsyncSession = Depends(db_session_dep),
    current_user: User = Depends(require_user),
) -> V1Comment:
    vid = uuid.UUID(payload.video_id)
    parent_id = uuid.UUID(payload.parent_id) if payload.parent_id else None
    row = Comment(video_id=vid, user_id=current_user.id, text=payload.text, parent_id=parent_id)
    db.add(row)
    await db.commit()
    await db.refresh(row)

    ts = row.created_at.isoformat() if isinstance(
        row.created_at, datetime) else str(row.created_at)
    return V1Comment(
        id=str(row.id),
        userId=str(current_user.id),
        username=current_user.username,
        text=row.text,
        timestamp=ts,
        likes=row.likes_count,
        parentId=str(row.parent_id) if row.parent_id else None,
    )


@router.patch("/{commentId}", response_model=V1Comment, status_code=status.HTTP_200_OK)
async def update_comment(
    commentId: str,
    payload: CommentUpdateBody,
    db: AsyncSession = Depends(db_session_dep),
    current_user: User = Depends(require_user),
) -> V1Comment:
    cid = uuid.UUID(commentId)
    row = await db.scalar(select(Comment).where(Comment.id == cid))
    if row is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    if row.user_id != current_user.id:
        raise Forbidden()
    row.text = payload.text
    await db.commit()
    await db.refresh(row)
    ts = row.created_at.isoformat() if isinstance(
        row.created_at, datetime) else str(row.created_at)
    return V1Comment(
        id=str(row.id),
        userId=str(row.user_id),
        username=current_user.username,
        text=row.text,
        timestamp=ts,
        likes=row.likes_count,
        parentId=str(row.parent_id) if row.parent_id else None,
    )


@router.delete("/{commentId}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    commentId: str,
    db: AsyncSession = Depends(db_session_dep),
    current_user: User = Depends(require_user),
):
    cid = uuid.UUID(commentId)
    row = await db.scalar(select(Comment).where(Comment.id == cid))
    if row is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    if row.user_id != current_user.id:
        raise Forbidden()
    await db.delete(row)
    await db.commit()
    return None
