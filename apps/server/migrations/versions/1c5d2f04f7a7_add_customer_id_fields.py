"""add customer_id fields

Revision ID: 1c5d2f04f7a7
Revises: c4e14335c43d
Create Date: 2025-08-12 16:00:00.000000

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "1c5d2f04f7a7"
down_revision = "c4e14335c43d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("photo", sa.Column("customer_id", sa.String(), nullable=False, server_default=""))
    op.alter_column("photo", "customer_id", server_default=None)

    op.add_column("share", sa.Column("customer_id", sa.String(), nullable=False, server_default=""))
    op.alter_column("share", "customer_id", server_default=None)

    op.add_column(
        "location",
        sa.Column("customer_id", sa.String(), nullable=False, server_default=""),
    )
    op.alter_column("location", "customer_id", server_default=None)

    op.add_column("user", sa.Column("customer_id", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("user", "customer_id")
    op.drop_column("location", "customer_id")
    op.drop_column("share", "customer_id")
    op.drop_column("photo", "customer_id")
