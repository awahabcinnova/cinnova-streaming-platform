from __future__ import annotations

import uuid
from datetime import datetime
import os
from fastapi.responses import FileResponse

from fastapi import APIRouter, Depends, File, Form, UploadFile, status, Request
from sqlalchemy import delete, select, update, or_
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func

from app.api.deps import db_session_dep, require_user, get_request_user
from app.api.media import resolve_user_avatar
from app.models.subscription import Subscription
from app.models.user import User
from app.models.video import Video
from app.models.video_view import VideoView
from app.models.video_reaction import VideoReaction
from app.schemas.v1 import V1User, V1Video

router = APIRouter()


def _to_v1_user(user: User, subscribers: int) -> V1User:
    return V1User(id=str(user.id), username=user.username, avatar=resolve_user_avatar(user) or "", subscribers=subscribers)


def _to_v1_video(video: Video, uploader: User, subscribers: int, viewer_reaction: str | None = None) -> V1Video:
    uploaded_at = video.created_at.isoformat() if isinstance(
        video.created_at, datetime) else str(video.created_at)
    return V1Video(
        id=str(video.id),
        title=video.title,
        description=video.description,
        thumbnail=video.thumbnail_url,
        url=video.video_url,
        views=video.views_count,
        likes=video.likes_count,
        dislikes=video.dislikes_count,
        uploadedAt=uploaded_at,
        duration=video.duration,
        uploader=_to_v1_user(uploader, subscribers),
        tags=video.tags or [],
        viewerReaction=viewer_reaction,
    )


@router.get("/", response_model=list[V1Video])
async def list_videos(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(db_session_dep)) -> list[V1Video]:
    rows = (await db.execute(select(Video).order_by(Video.created_at.desc()).offset(skip).limit(limit))).scalars().all()
    if not rows:
        return []

    uploader_ids = {v.uploader_id for v in rows}
    users = (await db.execute(select(User).where(User.id.in_(uploader_ids)))).scalars().all()
    users_by_id = {u.id: u for u in users}

    subs = (await db.execute(select(Subscription.channel_id))).scalars().all()
    counts: dict[uuid.UUID, int] = {}
    for cid in subs:
        counts[cid] = counts.get(cid, 0) + 1

    return [_to_v1_video(v, users_by_id[v.uploader_id], counts.get(v.uploader_id, 0)) for v in rows]


@router.get("/search", response_model=list[V1Video])
async def search_videos(q: str = "", skip: int = 0, limit: int = 50, db: AsyncSession = Depends(db_session_dep)) -> list[V1Video]:
    query = (q or "").strip()
    if not query:
        return []

    pattern = f"%{query}%"
    rows = (
        await db.execute(
            select(Video)
            .join(User, User.id == Video.uploader_id)
            .where(
                or_(
                    Video.title.ilike(pattern),
                    Video.description.ilike(pattern),
                    User.username.ilike(pattern),
                    func.array_to_string(Video.tags, " ").ilike(pattern),
                )
            )
            .order_by(Video.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
    ).scalars().all()
    if not rows:
        return []

    uploader_ids = {v.uploader_id for v in rows}
    users = (await db.execute(select(User).where(User.id.in_(uploader_ids)))).scalars().all()
    users_by_id = {u.id: u for u in users}

    subs = (await db.execute(select(Subscription.channel_id).where(Subscription.channel_id.in_(uploader_ids)))).scalars().all()
    counts: dict[uuid.UUID, int] = {}
    for cid in subs:
        counts[cid] = counts.get(cid, 0) + 1

    return [_to_v1_video(v, users_by_id[v.uploader_id], counts.get(v.uploader_id, 0)) for v in rows]


@router.get("/user/{user_id}", response_model=list[V1Video])
async def list_videos_by_user(user_id: str, db: AsyncSession = Depends(db_session_dep)) -> list[V1Video]:
    uid = uuid.UUID(user_id)
    rows = (await db.execute(select(Video).where(Video.uploader_id == uid).order_by(Video.created_at.desc()))).scalars().all()
    if not rows:
        return []

    uploader = await db.scalar(select(User).where(User.id == uid))
    if uploader is None:
        return []

    subscribers = await db.scalar(select(func.count()).select_from(Subscription).where(Subscription.channel_id == uid))
    return [_to_v1_video(v, uploader, int(subscribers or 0)) for v in rows]


@router.get("/liked", response_model=list[V1Video])
async def list_liked_videos(
    db: AsyncSession = Depends(db_session_dep),
    current_user: User = Depends(require_user),
) -> list[V1Video]:
    rows = (
        await db.execute(
            select(Video, User)
            .join(VideoReaction, VideoReaction.video_id == Video.id)
            .join(User, User.id == Video.uploader_id)
            .where(VideoReaction.user_id == current_user.id, VideoReaction.reaction_type == 1)
            .order_by(VideoReaction.updated_at.desc())
        )
    ).all()
    if not rows:
        return []

    uploader_ids = {u.id for _, u in rows}
    subs = (await db.execute(select(Subscription.channel_id).where(Subscription.channel_id.in_(uploader_ids)))).scalars().all()
    counts: dict[uuid.UUID, int] = {}
    for cid in subs:
        counts[cid] = counts.get(cid, 0) + 1

    videos: list[V1Video] = []
    for v, u in rows:
        likes, dislikes = await _reaction_counts(db, v.id)
        videos.append(
            _to_v1_video(v, u, counts.get(u.id, 0), "like").model_copy(
                update={"likes": likes, "dislikes": dislikes}
            )
        )
    return videos


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
            likes=0,
            dislikes=0,
            uploadedAt="",
            duration="",
            uploader=V1User(id="", username="", avatar="", subscribers=0),
            tags=[],
            viewerReaction=None,
        )
    uploader = await db.scalar(select(User).where(User.id == video.uploader_id))
    assert uploader is not None
    subscribers = await db.scalar(select(func.count()).select_from(Subscription).where(Subscription.channel_id == uploader.id))

    viewer_reaction: str | None = None
    current_user = get_request_user(request)
    if current_user is not None:
        reaction = await db.scalar(
            select(VideoReaction).where(VideoReaction.video_id == vid, VideoReaction.user_id == current_user.id)
        )
        if reaction is not None:
            viewer_reaction = "like" if reaction.reaction_type == 1 else "dislike"

    likes, dislikes = await _reaction_counts(db, vid)
    return _to_v1_video(
        video,
        uploader,
        int(subscribers or 0),
        viewer_reaction,
    ).model_copy(update={"likes": likes, "dislikes": dislikes})


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
async def track_view(
    id: str,
    db: AsyncSession = Depends(db_session_dep),
    current_user: User = Depends(require_user),
) -> dict:
    vid = uuid.UUID(id)
    exists = await db.scalar(select(Video.id).where(Video.id == vid))
    if exists is None:
        return {"ok": False, "viewed": False}
    insert_stmt = (
        insert(VideoView)
        .values(video_id=vid, user_id=current_user.id)
        .on_conflict_do_nothing()
        .returning(VideoView.id)
    )
    result = await db.execute(insert_stmt)
    inserted_id = result.scalar()
    if inserted_id is not None:
        await db.execute(update(Video).where(Video.id == vid).values(views_count=Video.views_count + 1))
    await db.commit()
    return {"ok": True, "viewed": inserted_id is not None}


async def _get_video_or_none(db: AsyncSession, vid: uuid.UUID) -> Video | None:
    return await db.scalar(select(Video).where(Video.id == vid))


async def _get_reaction(db: AsyncSession, vid: uuid.UUID, uid: uuid.UUID) -> VideoReaction | None:
    return await db.scalar(select(VideoReaction).where(VideoReaction.video_id == vid, VideoReaction.user_id == uid))


async def _reaction_counts(db: AsyncSession, vid: uuid.UUID) -> tuple[int, int]:
    likes = await db.scalar(
        select(func.count()).select_from(VideoReaction).where(
            VideoReaction.video_id == vid, VideoReaction.reaction_type == 1
        )
    )
    dislikes = await db.scalar(
        select(func.count()).select_from(VideoReaction).where(
            VideoReaction.video_id == vid, VideoReaction.reaction_type == -1
        )
    )
    return int(likes or 0), int(dislikes or 0)


@router.post("/{id}/like", status_code=status.HTTP_200_OK)
async def like_video(
    id: str,
    db: AsyncSession = Depends(db_session_dep),
    current_user: User = Depends(require_user),
) -> dict:
    vid = uuid.UUID(id)
    video = await _get_video_or_none(db, vid)
    if video is None:
        return {"ok": False, "reaction": None}

    existing = await _get_reaction(db, vid, current_user.id)
    if existing is None:
        insert_stmt = (
            insert(VideoReaction)
            .values(user_id=current_user.id, video_id=vid, reaction_type=1)
            .on_conflict_do_nothing()
            .returning(VideoReaction.id)
        )
        result = await db.execute(insert_stmt)
        inserted_id = result.scalar()
        if inserted_id is not None:
            await db.commit()
            likes, dislikes = await _reaction_counts(db, vid)
            await db.execute(update(Video).where(Video.id == vid).values(likes_count=likes, dislikes_count=dislikes))
            await db.commit()
            return {"ok": True, "reaction": "like", "likes": likes, "dislikes": dislikes}
        current = await _get_reaction(db, vid, current_user.id)
        likes, dislikes = await _reaction_counts(db, vid)
        await db.execute(update(Video).where(Video.id == vid).values(likes_count=likes, dislikes_count=dislikes))
        await db.commit()
        return {
            "ok": True,
            "reaction": "like" if current and current.reaction_type == 1 else "dislike" if current else None,
            "likes": likes,
            "dislikes": dislikes,
        }

    if existing.reaction_type == 1:
        result = await db.execute(
            delete(VideoReaction).where(VideoReaction.id == existing.id, VideoReaction.reaction_type == 1)
        )
        if result.rowcount:
            likes, dislikes = await _reaction_counts(db, vid)
            await db.execute(update(Video).where(Video.id == vid).values(likes_count=likes, dislikes_count=dislikes))
        else:
            likes, dislikes = await _reaction_counts(db, vid)
        await db.commit()
        return {"ok": True, "reaction": None, "likes": likes, "dislikes": dislikes}

    result = await db.execute(
        update(VideoReaction)
        .where(VideoReaction.id == existing.id, VideoReaction.reaction_type == -1)
        .values(reaction_type=1)
    )
    if result.rowcount:
        likes, dislikes = await _reaction_counts(db, vid)
        await db.execute(update(Video).where(Video.id == vid).values(likes_count=likes, dislikes_count=dislikes))
        await db.commit()
        return {"ok": True, "reaction": "like", "likes": likes, "dislikes": dislikes}
    likes, dislikes = await _reaction_counts(db, vid)
    await db.execute(update(Video).where(Video.id == vid).values(likes_count=likes, dislikes_count=dislikes))
    await db.commit()
    return {"ok": True, "reaction": "like", "likes": likes, "dislikes": dislikes}


@router.post("/{id}/dislike", status_code=status.HTTP_200_OK)
async def dislike_video(
    id: str,
    db: AsyncSession = Depends(db_session_dep),
    current_user: User = Depends(require_user),
) -> dict:
    vid = uuid.UUID(id)
    video = await _get_video_or_none(db, vid)
    if video is None:
        return {"ok": False, "reaction": None}

    existing = await _get_reaction(db, vid, current_user.id)
    if existing is None:
        insert_stmt = (
            insert(VideoReaction)
            .values(user_id=current_user.id, video_id=vid, reaction_type=-1)
            .on_conflict_do_nothing()
            .returning(VideoReaction.id)
        )
        result = await db.execute(insert_stmt)
        inserted_id = result.scalar()
        if inserted_id is not None:
            await db.commit()
            likes, dislikes = await _reaction_counts(db, vid)
            await db.execute(update(Video).where(Video.id == vid).values(likes_count=likes, dislikes_count=dislikes))
            await db.commit()
            return {"ok": True, "reaction": "dislike", "likes": likes, "dislikes": dislikes}
        current = await _get_reaction(db, vid, current_user.id)
        likes, dislikes = await _reaction_counts(db, vid)
        await db.execute(update(Video).where(Video.id == vid).values(likes_count=likes, dislikes_count=dislikes))
        await db.commit()
        return {
            "ok": True,
            "reaction": "like" if current and current.reaction_type == 1 else "dislike" if current else None,
            "likes": likes,
            "dislikes": dislikes,
        }

    if existing.reaction_type == -1:
        result = await db.execute(
            delete(VideoReaction).where(VideoReaction.id == existing.id, VideoReaction.reaction_type == -1)
        )
        if result.rowcount:
            likes, dislikes = await _reaction_counts(db, vid)
            await db.execute(update(Video).where(Video.id == vid).values(likes_count=likes, dislikes_count=dislikes))
        else:
            likes, dislikes = await _reaction_counts(db, vid)
        await db.commit()
        return {"ok": True, "reaction": None, "likes": likes, "dislikes": dislikes}

    result = await db.execute(
        update(VideoReaction)
        .where(VideoReaction.id == existing.id, VideoReaction.reaction_type == 1)
        .values(reaction_type=-1)
    )
    if result.rowcount:
        likes, dislikes = await _reaction_counts(db, vid)
        await db.execute(update(Video).where(Video.id == vid).values(likes_count=likes, dislikes_count=dislikes))
        await db.commit()
        return {"ok": True, "reaction": "dislike", "likes": likes, "dislikes": dislikes}
    likes, dislikes = await _reaction_counts(db, vid)
    await db.execute(update(Video).where(Video.id == vid).values(likes_count=likes, dislikes_count=dislikes))
    await db.commit()
    return {"ok": True, "reaction": "dislike", "likes": likes, "dislikes": dislikes}
