"""add comment parent_id for threaded comments

Revision ID: 0006_add_comment_parent_id
Revises: 0005_google_oauth
Create Date: 2026-02-02

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "0006_add_comment_parent_id"
down_revision = "0005_google_oauth"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "comments",
        sa.Column("parent_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_comments_parent_id",
        "comments",
        "comments",
        ["parent_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_comments_parent_id", "comments", ["parent_id"])


def downgrade() -> None:
    op.drop_index("ix_comments_parent_id", table_name="comments")
    op.drop_constraint("fk_comments_parent_id", "comments", type_="foreignkey")
    op.drop_column("comments", "parent_id")
