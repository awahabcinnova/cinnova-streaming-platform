from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class V1User(BaseModel):
    id: str
    username: str
    avatar: str = ""
    banner: str = ""
    subscribers: int = 0


class V1Video(BaseModel):
    id: str
    title: str
    description: str
    thumbnail: str
    url: str
    views: int
    uploadedAt: str
    duration: str
    uploader: V1User
    tags: list[str] = Field(default_factory=list)


class V1Comment(BaseModel):
    id: str
    userId: str
    username: str
    text: str
    timestamp: str
    likes: int = 0
    parentId: str | None = None


class V1Livestream(BaseModel):
    id: str
    title: str
    status: str = "OFFLINE"
    createdAt: str
