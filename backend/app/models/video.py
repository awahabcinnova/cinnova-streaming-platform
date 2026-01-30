from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey

from app.models.base import Base


class Video(Base):
    __tablename__ = "videos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    uploader_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    thumbnail_url: Mapped[str] = mapped_column(
        String(500), nullable=False, default="")
    video_url: Mapped[str] = mapped_column(
        String(500), nullable=False, default="")
    duration: Mapped[str] = mapped_column(
        String(32), nullable=False, default="")

    tags: Mapped[list[str]] = mapped_column(
        ARRAY(String(50)), nullable=False, server_default="{}")

    views_count: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default="0")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(
        timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    uploader = relationship("User")
    comments = relationship(
        "Comment", back_populates="video", cascade="all, delete-orphan")


Index("ix_videos_uploader_id", Video.uploader_id)
Index("ix_videos_created_at", Video.created_at)
