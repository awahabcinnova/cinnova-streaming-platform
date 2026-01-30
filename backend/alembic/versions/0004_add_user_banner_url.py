"""Add users.banner_url

Revision ID: 0004_add_banner_url
Revises: 0003_remove_like_dislike
Create Date: 2026-01-30
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "0004_add_banner_url"
down_revision = "0003_remove_like_dislike"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("banner_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "banner_url")
