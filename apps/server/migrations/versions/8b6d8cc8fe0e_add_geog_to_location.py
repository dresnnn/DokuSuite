"""add geog to location

Revision ID: 8b6d8cc8fe0e
Revises: 49e9ee7829b2
Create Date: 2025-02-15 00:00:00.000000

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from geoalchemy2 import Geography

# revision identifiers, used by Alembic.
revision = "8b6d8cc8fe0e"
down_revision = "49e9ee7829b2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "location",
        sa.Column("geog", Geography(geometry_type="POINT", srid=4326), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("location", "geog")
