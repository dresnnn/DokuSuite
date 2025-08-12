"""add timestamps to photo

Revision ID: b2d96ab19384
Revises: a2c0d5e9ff4b
Create Date: 2025-08-12 14:00:00.000000

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "b2d96ab19384"
down_revision = "a2c0d5e9ff4b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "photo",
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.add_column("photo", sa.Column("deleted_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("photo", "deleted_at")
    op.drop_column("photo", "updated_at")
