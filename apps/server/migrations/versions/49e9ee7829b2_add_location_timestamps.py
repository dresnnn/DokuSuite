"""add timestamps to location

Revision ID: 49e9ee7829b2
Revises: 2d7af46664d1
Create Date: 2025-08-12 10:15:00.000000

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "49e9ee7829b2"
down_revision = "2d7af46664d1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "location",
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.add_column(
        "location", sa.Column("deleted_at", sa.DateTime(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("location", "deleted_at")
    op.drop_column("location", "updated_at")
