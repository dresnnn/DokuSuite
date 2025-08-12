"""add ext_ref mapping table

Revision ID: b59cb3e3e16c
Revises: 9d4e9c0ad13e
Create Date: 2025-08-12 12:00:00.000000

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "b59cb3e3e16c"
down_revision = "9d4e9c0ad13e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ext_ref",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("table", sa.String(), nullable=False),
        sa.Column("record_id", sa.String(), nullable=False),
        sa.Column("local_id", sa.Integer(), nullable=False),
        sa.Column("etag", sa.String(), nullable=True),
        sa.Column(
            "synced_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("source", "table", "record_id"),
    )


def downgrade() -> None:
    op.drop_table("ext_ref")
