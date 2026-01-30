from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class RefreshToken(Base):
    """
    Stores refresh JWT "jti" for rotation and revocation (server-side).

    Cookie stores the refresh JWT; DB stores its `jti` so we can revoke/rotate and detect reuse.
    """

    __tablename__ = "refresh_tokens"

    jti: Mapped[str] = mapped_column(String(64), primary_key=True)
    session_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(
        "sessions.id", ondelete="CASCADE"), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False)

    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True)
    replaced_by_jti: Mapped[str | None] = mapped_column(
        String(64), nullable=True)

    session = relationship("Session", back_populates="refresh_tokens")


Index("ix_refresh_tokens_session_id", RefreshToken.session_id)
Index("ix_refresh_tokens_expires_at", RefreshToken.expires_at)
Index("ix_refresh_tokens_revoked_at", RefreshToken.revoked_at)
