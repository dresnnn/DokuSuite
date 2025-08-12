"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision = '${up_revision}'
down_revision = ${"None" if down_revision is None else repr(down_revision)}
branch_labels = ${"None" if branch_labels is None else repr(branch_labels)}
depends_on = ${"None" if depends_on is None else repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
