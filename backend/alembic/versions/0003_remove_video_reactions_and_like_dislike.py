"""Remove video like/dislike functionality

Revision ID: 0003_remove_like_dislike
Revises: b19c8167a84c
Create Date: 2026-01-30
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "0003_remove_like_dislike"
down_revision = "b19c8167a84c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("videos", "likes_count")
    op.drop_column("videos", "dislikes_count")

    op.drop_constraint("uq_user_video", "user_video_reactions", type_="unique")
    op.drop_table("user_video_reactions")


def downgrade() -> None:
    op.add_column(
        "videos",
        sa.Column("likes_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "videos",
        sa.Column("dislikes_count", sa.Integer(), nullable=False, server_default="0"),
    )

    op.create_table(
        "user_video_reactions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("video_id", sa.UUID(), nullable=False),
        sa.Column("reaction_type", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["video_id"], ["videos.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_unique_constraint(
        "uq_user_video", "user_video_reactions", ["user_id", "video_id"]
    )
