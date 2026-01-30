"""Add Google OAuth fields to users

Revision ID: 0005_google_oauth
Revises: 0004_add_banner_url
Create Date: 2026-01-30
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "0005_google_oauth"
down_revision = "0004_add_banner_url"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("google_sub", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("google_email", sa.String(length=320), nullable=True))
    op.create_index("ix_users_google_sub", "users", ["google_sub"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_google_sub", table_name="users")
    op.drop_column("users", "google_email")
    op.drop_column("users", "google_sub")
