"""Add video reactions and like/dislike counts

Revision ID: 0008_add_video_reactions
Revises: 0007_add_video_views
Create Date: 2026-02-03
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "0008_add_video_reactions"
down_revision = "0007_add_video_views"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("videos", sa.Column("likes_count", sa.Integer(),
                                      nullable=False, server_default="0"))
    op.add_column("videos", sa.Column("dislikes_count", sa.Integer(),
                                      nullable=False, server_default="0"))

    op.create_table(
        "video_reactions",
        sa.Column("id", postgresql.UUID(as_uuid=True),
                  primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey(
            "users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("video_id", postgresql.UUID(as_uuid=True), sa.ForeignKey(
            "videos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reaction_type", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("user_id", "video_id",
                            name="uq_user_video_reaction"),
    )
    op.create_index("ix_video_reactions_video_id",
                    "video_reactions", ["video_id"], unique=False)
    op.create_index("ix_video_reactions_user_id",
                    "video_reactions", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_video_reactions_user_id", table_name="video_reactions")
    op.drop_index("ix_video_reactions_video_id", table_name="video_reactions")
    op.drop_table("video_reactions")

    op.drop_column("videos", "dislikes_count")
    op.drop_column("videos", "likes_count")
