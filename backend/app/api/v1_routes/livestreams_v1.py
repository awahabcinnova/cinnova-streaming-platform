from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session_dep
from app.schemas.v1 import V1Livestream

router = APIRouter()


# Minimal placeholder storage in-memory can be added later; for now return empty list.


@router.get("/", response_model=list[V1Livestream])
async def list_livestreams(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(db_session_dep)) -> list[V1Livestream]:
    return []


@router.get("/{id}", response_model=V1Livestream)
async def get_livestream(id: str, db: AsyncSession = Depends(db_session_dep)) -> V1Livestream:
    # Placeholder for now
    return V1Livestream(id=id, title="Livestream", status="OFFLINE", createdAt="")


@router.post("/", response_model=V1Livestream, status_code=status.HTTP_201_CREATED)
async def create_livestream(data: dict, db: AsyncSession = Depends(db_session_dep)) -> V1Livestream:
    # Placeholder for now; next iteration can persist to DB.
    lid = str(uuid.uuid4())
    return V1Livestream(id=lid, title=str(data.get("title") or "Livestream"), status="LIVE", createdAt=datetime.utcnow().isoformat())
