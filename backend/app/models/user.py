from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Index, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(
        String(320), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="true")

    display_name: Mapped[str | None] = mapped_column(
        String(128), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)
    username: Mapped[str] = mapped_column(
        String(64), nullable=False, unique=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    banner_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    google_sub: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    google_email: Mapped[str | None] = mapped_column(String(320), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    sessions = relationship(
        "Session", back_populates="user", cascade="all, delete-orphan")


Index("ix_users_email_lower", func.lower(User.email), unique=True)
Index("ix_users_username_lower", func.lower(User.username), unique=True)
