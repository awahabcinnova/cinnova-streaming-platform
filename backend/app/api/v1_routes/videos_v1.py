from __future__ import annotations

import uuid
from datetime import datetime
import os
from fastapi.responses import FileResponse

from fastapi import APIRouter, Depends, File, Form, UploadFile, status, Request
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func

from app.api.deps import db_session_dep
from app.models.subscription import Subscription
from app.models.user import User
from app.models.video import Video
from app.schemas.v1 import V1User, V1Video

router = APIRouter()


def _to_v1_user(user: User, subscribers: int) -> V1User:
    return V1User(id=str(user.id), username=user.username, avatar=user.avatar_url or "", subscribers=subscribers)


def _to_v1_video(video: Video, uploader: User, subscribers: int) -> V1Video:
    uploaded_at = video.created_at.isoformat() if isinstance(
        video.created_at, datetime) else str(video.created_at)
    return V1Video(
        id=str(video.id),
        title=video.title,
        description=video.description,
        thumbnail=video.thumbnail_url,
        url=video.video_url,
        views=video.views_count,
        uploadedAt=uploaded_at,
        duration=video.duration,
        uploader=_to_v1_user(uploader, subscribers),
        tags=video.tags or [],
    )


@router.get("/", response_model=list[V1Video])
async def list_videos(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(db_session_dep)) -> list[V1Video]:
    rows = (await db.execute(select(Video).order_by(Video.created_at.desc()).offset(skip).limit(limit))).scalars().all()
    if not rows:
        return []

    # batch load uploaders
    uploader_ids = {v.uploader_id for v in rows}
    users = (await db.execute(select(User).where(User.id.in_(uploader_ids)))).scalars().all()
    users_by_id = {u.id: u for u in users}

    # subscriber counts
    subs = (await db.execute(select(Subscription.channel_id))).scalars().all()
    counts: dict[uuid.UUID, int] = {}
    for cid in subs:
        counts[cid] = counts.get(cid, 0) + 1

    return [_to_v1_video(v, users_by_id[v.uploader_id], counts.get(v.uploader_id, 0)) for v in rows]


@router.get("/{id}", response_model=V1Video)
async def get_video(id: str, request: Request, db: AsyncSession = Depends(db_session_dep)) -> V1Video:
    vid = uuid.UUID(id)
    video = await db.scalar(select(Video).where(Video.id == vid))
    if video is None:
        return V1Video(
            id=id,
            title="Not found",
            description="",
            thumbnail="",
            url="",
            views=0,
            uploadedAt="",
            duration="",
            uploader=V1User(id="", username="", avatar="", subscribers=0),
            tags=[],
        )
    uploader = await db.scalar(select(User).where(User.id == video.uploader_id))
    assert uploader is not None
    subscribers = await db.scalar(select(func.count()).select_from(Subscription).where(Subscription.channel_id == uploader.id))

    return _to_v1_video(video, uploader, int(subscribers or 0))


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=V1Video)
async def create_video(
    db: AsyncSession = Depends(db_session_dep),
    title: str = Form(""),
    description: str = Form(""),
    duration: str = Form(""),
    tags: str = Form(""),
    thumbnail: UploadFile | None = File(default=None),
    video: UploadFile | None = File(default=None),
    request: Request = None,
) -> V1Video:
    uploader = await db.scalar(select(User).order_by(User.created_at.asc()).limit(1))
    if uploader is None:
        raise RuntimeError("No users exist; register first")

    # Save files to disk
    video_url = ""
    thumbnail_url = ""
    media_root = os.path.abspath(os.path.join(
        os.path.dirname(__file__), '../../../media'))
    videos_dir = os.path.join(media_root, 'videos')
    thumbs_dir = os.path.join(media_root, 'thumbnails')
    os.makedirs(videos_dir, exist_ok=True)
    os.makedirs(thumbs_dir, exist_ok=True)

    if video:
        ext = os.path.splitext(video.filename)[1]
        video_filename = f"{uuid.uuid4().hex}{ext}"
        video_path = os.path.join(videos_dir, video_filename)
        with open(video_path, "wb") as f:
            f.write(await video.read())
        video_url = f"/media/videos/{video_filename}"

    if thumbnail:
        ext = os.path.splitext(thumbnail.filename)[1]
        thumb_filename = f"{uuid.uuid4().hex}{ext}"
        thumb_path = os.path.join(thumbs_dir, thumb_filename)
        with open(thumb_path, "wb") as f:
            f.write(await thumbnail.read())
        thumbnail_url = f"/media/thumbnails/{thumb_filename}"

    tag_list = [t.strip()
                for t in tags.split(",") if t.strip()] if tags else []

    row = Video(
        uploader_id=uploader.id,
        title=title or "Untitled",
        description=description or "",
        thumbnail_url=thumbnail_url,
        video_url=video_url,
        duration=duration or "",
        tags=tag_list,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return _to_v1_video(row, uploader, subscribers=0)


@router.put("/{id}", response_model=V1Video)
async def update_video(id: str, data: dict, db: AsyncSession = Depends(db_session_dep)) -> V1Video:
    vid = uuid.UUID(id)
    video = await db.scalar(select(Video).where(Video.id == vid))
    if video is None:
        raise RuntimeError("Video not found")

    for field in ["title", "description", "thumbnail", "url", "duration", "tags"]:
        if field in data:
            if field == "thumbnail":
                video.thumbnail_url = str(data[field] or "")
            elif field == "url":
                video.video_url = str(data[field] or "")
            elif field == "tags":
                video.tags = data[field] or []
            else:
                setattr(video, field, data[field])

    await db.commit()
    uploader = await db.scalar(select(User).where(User.id == video.uploader_id))
    assert uploader is not None
    return _to_v1_video(video, uploader, subscribers=0)


@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_video(id: str, db: AsyncSession = Depends(db_session_dep)) -> dict:
    vid = uuid.UUID(id)
    await db.execute(delete(Video).where(Video.id == vid))
    await db.commit()
    return {"ok": True}


@router.post("/{id}/views", status_code=status.HTTP_200_OK)
async def track_view(id: str, db: AsyncSession = Depends(db_session_dep)) -> dict:
    vid = uuid.UUID(id)
    await db.execute(update(Video).where(Video.id == vid).values(views_count=Video.views_count + 1))
    await db.commit()
    return {"ok": True}
