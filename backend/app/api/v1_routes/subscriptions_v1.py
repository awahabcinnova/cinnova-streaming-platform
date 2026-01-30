from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Form, status
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session_dep
from app.models.subscription import Subscription

router = APIRouter()


class SubscribeBody(BaseModel):
    channel_id: str
    subscriber_id: str


@router.post("/subscribe", status_code=status.HTTP_200_OK)
async def subscribe(payload: SubscribeBody, db: AsyncSession = Depends(db_session_dep)) -> dict:
    channel_id = uuid.UUID(payload.channel_id)
    subscriber_id = uuid.UUID(payload.subscriber_id)
    existing = await db.scalar(
        select(Subscription).where(Subscription.channel_id ==
                                   channel_id, Subscription.subscriber_id == subscriber_id)
    )
    if existing is None:
        db.add(Subscription(channel_id=channel_id, subscriber_id=subscriber_id))
        await db.commit()
    return {"ok": True}


@router.delete("/", status_code=status.HTTP_200_OK)
async def unsubscribe(
    db: AsyncSession = Depends(db_session_dep),
    channel_id: str = Form(...),
    subscriber_id: str = Form(...),
) -> dict:
    cid = uuid.UUID(channel_id)
    sid = uuid.UUID(subscriber_id)
    await db.execute(delete(Subscription).where(Subscription.channel_id == cid, Subscription.subscriber_id == sid))
    await db.commit()
    return {"ok": True}


@router.get("/channel/{channelId}", status_code=status.HTTP_200_OK)
async def get_subscribers(channelId: str, db: AsyncSession = Depends(db_session_dep)) -> dict:
    cid = uuid.UUID(channelId)
    subs = (await db.execute(select(Subscription).where(Subscription.channel_id == cid))).scalars().all()
    return {"count": len(subs), "subscribers": [str(s.subscriber_id) for s in subs]}
