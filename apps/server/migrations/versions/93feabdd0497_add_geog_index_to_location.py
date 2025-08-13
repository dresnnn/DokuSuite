"""add geog index to location

Revision ID: 93feabdd0497
Revises: d25f9e4c3a1b
Create Date: 2025-08-13 12:15:00.000000

"""
from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "93feabdd0497"
down_revision = "d25f9e4c3a1b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_location_geog", "location", ["geog"], postgresql_using="gist"
    )


def downgrade() -> None:
    op.drop_index("ix_location_geog", table_name="location")
