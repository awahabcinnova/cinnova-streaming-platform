"""Add v1 tables (videos, comments, subscriptions) and user profile fields

Revision ID: 0002_v1_tables
Revises: 0001_auth_tables
Create Date: 2026-01-29
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "0002_v1_tables"
down_revision = "0001_auth_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # users: add username + avatar_url
    op.add_column("users", sa.Column(
        "username", sa.String(length=64), nullable=True))
    op.add_column("users", sa.Column(
        "avatar_url", sa.String(length=500), nullable=True))

    # Backfill username from email local-part (best-effort).
    op.execute(
        "UPDATE users SET username = split_part(email, '@', 1) WHERE username IS NULL")
    op.execute(
        "UPDATE users SET username = regexp_replace(lower(username), '[^a-z0-9_]+', '', 'g') WHERE username IS NOT NULL")
    op.execute(
        "UPDATE users SET username = 'user' || left(md5(id::text), 8) WHERE username = '' OR username IS NULL")

    op.alter_column("users", "username", existing_type=sa.String(
        length=64), nullable=False)
    op.create_index("ix_users_username_lower", "users", [
                    sa.text("lower(username)")], unique=True)

    # videos
    op.create_table(
        "videos",
        sa.Column("id", postgresql.UUID(as_uuid=True),
                  primary_key=True, nullable=False),
        sa.Column("uploader_id", postgresql.UUID(as_uuid=True), sa.ForeignKey(
            "users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("thumbnail_url", sa.String(length=500),
                  nullable=False, server_default=""),
        sa.Column("video_url", sa.String(length=500),
                  nullable=False, server_default=""),
        sa.Column("duration", sa.String(length=32),
                  nullable=False, server_default=""),
        sa.Column("tags", postgresql.ARRAY(sa.String(length=50)),
                  nullable=False, server_default="{}"),
        sa.Column("views_count", sa.Integer(),
                  nullable=False, server_default="0"),
        sa.Column("likes_count", sa.Integer(),
                  nullable=False, server_default="0"),
        sa.Column("dislikes_count", sa.Integer(),
                  nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_videos_uploader_id", "videos",
                    ["uploader_id"], unique=False)
    op.create_index("ix_videos_created_at", "videos",
                    ["created_at"], unique=False)

    # comments
    op.create_table(
        "comments",
        sa.Column("id", postgresql.UUID(as_uuid=True),
                  primary_key=True, nullable=False),
        sa.Column("video_id", postgresql.UUID(as_uuid=True), sa.ForeignKey(
            "videos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey(
            "users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("likes_count", sa.Integer(),
                  nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_comments_user_id", "comments",
                    ["user_id"], unique=False)
    op.create_index("ix_comments_video_id_created_at", "comments", [
                    "video_id", "created_at"], unique=False)

    # subscriptions
    op.create_table(
        "subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True),
                  primary_key=True, nullable=False),
        sa.Column("channel_id", postgresql.UUID(as_uuid=True), sa.ForeignKey(
            "users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subscriber_id", postgresql.UUID(as_uuid=True), sa.ForeignKey(
            "users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("channel_id", "subscriber_id",
                            name="uq_subscriptions_channel_subscriber"),
    )
    op.create_index("ix_subscriptions_channel_id",
                    "subscriptions", ["channel_id"], unique=False)
    op.create_index("ix_subscriptions_subscriber_id",
                    "subscriptions", ["subscriber_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_subscriptions_subscriber_id", table_name="subscriptions")
    op.drop_index("ix_subscriptions_channel_id", table_name="subscriptions")
    op.drop_table("subscriptions")

    op.drop_index("ix_comments_video_id_created_at", table_name="comments")
    op.drop_index("ix_comments_user_id", table_name="comments")
    op.drop_table("comments")

    op.drop_index("ix_videos_created_at", table_name="videos")
    op.drop_index("ix_videos_uploader_id", table_name="videos")
    op.drop_table("videos")

    op.drop_index("ix_users_username_lower", table_name="users")
    op.drop_column("users", "avatar_url")
    op.drop_column("users", "username")
