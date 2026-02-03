"""Add video views table for per-user unique view tracking

Revision ID: 0007_add_video_views
Revises: 0006_add_comment_parent_id
Create Date: 2026-02-03
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "0007_add_video_views"
down_revision = "0006_add_comment_parent_id"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "video_views",
        sa.Column("id", postgresql.UUID(as_uuid=True),
                  primary_key=True, nullable=False),
        sa.Column("video_id", postgresql.UUID(as_uuid=True), sa.ForeignKey(
            "videos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey(
            "users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("video_id", "user_id",
                            name="uq_video_views_video_user"),
    )
    op.create_index("ix_video_views_video_id",
                    "video_views", ["video_id"], unique=False)
    op.create_index("ix_video_views_user_id",
                    "video_views", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_video_views_user_id", table_name="video_views")
    op.drop_index("ix_video_views_video_id", table_name="video_views")
    op.drop_table("video_views")
