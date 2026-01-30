from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    username: str
    avatar_url: str | None = None
    display_name: str | None = None
    bio: str | None = None
    is_active: bool
    created_at: datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str | None = Field(default=None, max_length=128)
    username: str = Field(min_length=3, max_length=64)


class UserUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=128)
    bio: str | None = Field(default=None, max_length=500)
