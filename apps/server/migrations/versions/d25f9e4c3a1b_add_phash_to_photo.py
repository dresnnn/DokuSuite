"""add phash to photo

Revision ID: d25f9e4c3a1b
Revises: 1c5d2f04f7a7
Create Date: 2025-08-13 07:44:47.000000

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "d25f9e4c3a1b"
down_revision = "1c5d2f04f7a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("photo", sa.Column("phash", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("photo", "phash")
