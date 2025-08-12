"""add extra fields to photo

Revision ID: a2c0d5e9ff4b
Revises: 9d4e9c0ad13e
Create Date: 2025-08-12 13:00:00.000000

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "a2c0d5e9ff4b"
down_revision = "9d4e9c0ad13e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "photo",
        sa.Column("mode", sa.String(), nullable=False, server_default="FIXED_SITE"),
    )
    op.add_column("photo", sa.Column("uploader_id", sa.String(), nullable=True))
    op.add_column("photo", sa.Column("device_id", sa.String(), nullable=True))
    op.add_column("photo", sa.Column("site_id", sa.String(), nullable=True))
    op.alter_column("photo", "mode", server_default=None)


def downgrade() -> None:
    op.drop_column("photo", "site_id")
    op.drop_column("photo", "device_id")
    op.drop_column("photo", "uploader_id")
    op.drop_column("photo", "mode")
