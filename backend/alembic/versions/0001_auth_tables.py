"""Create auth tables (users, sessions, refresh_tokens)

Revision ID: 0001_auth_tables
Revises: 
Create Date: 2026-01-29
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "0001_auth_tables"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True),
                  primary_key=True, nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False,
                  server_default=sa.text("true")),
        sa.Column("display_name", sa.String(length=128), nullable=True),
        sa.Column("bio", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_email_lower", "users", [
                    sa.text("lower(email)")], unique=True)

    op.create_table(
        "sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True),
                  primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey(
            "users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("session_token_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.text("now()")),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("session_token_hash",
                            name="uq_sessions_session_token_hash"),
    )
    op.create_index("ix_sessions_user_id", "sessions",
                    ["user_id"], unique=False)
    op.create_index("ix_sessions_expires_at", "sessions",
                    ["expires_at"], unique=False)
    op.create_index("ix_sessions_revoked_at", "sessions",
                    ["revoked_at"], unique=False)

    op.create_table(
        "refresh_tokens",
        sa.Column("jti", sa.String(length=64),
                  primary_key=True, nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey(
            "sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.text("now()")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("replaced_by_jti", sa.String(length=64), nullable=True),
    )
    op.create_index("ix_refresh_tokens_session_id",
                    "refresh_tokens", ["session_id"], unique=False)
    op.create_index("ix_refresh_tokens_expires_at",
                    "refresh_tokens", ["expires_at"], unique=False)
    op.create_index("ix_refresh_tokens_revoked_at",
                    "refresh_tokens", ["revoked_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_refresh_tokens_revoked_at", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_expires_at", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_session_id", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")

    op.drop_index("ix_sessions_revoked_at", table_name="sessions")
    op.drop_index("ix_sessions_expires_at", table_name="sessions")
    op.drop_index("ix_sessions_user_id", table_name="sessions")
    op.drop_table("sessions")

    op.drop_index("ix_users_email_lower", table_name="users")
    op.drop_table("users")
