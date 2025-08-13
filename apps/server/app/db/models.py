from __future__ import annotations

import os
from datetime import UTC, datetime
from enum import Enum

from sqlalchemy import JSON, Column, DateTime, Integer, String, UniqueConstraint, func
from sqlmodel import Field, SQLModel

try:  # geospatial support for PostGIS
    from geoalchemy2 import Geography
except Exception:  # pragma: no cover - fallback when geoalchemy2 missing
    Geography = None

DATABASE_URL = os.getenv("DOKUSUITE_DATABASE_URL", "sqlite:///:memory:")

if Geography is not None and not DATABASE_URL.startswith("sqlite"):
    _geog_column = Column(Geography(geometry_type="POINT", srid=4326), nullable=True)
else:  # SQLite fallback used in tests
    _geog_column = Column(String, nullable=True)


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    USER = "USER"


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(sa_column=Column(String, nullable=False, unique=True))
    password_hash: str = Field(sa_column=Column(String, nullable=False))
    role: UserRole = Field(
        default=UserRole.USER,
        sa_column=Column(String, nullable=False),
    )
    customer_id: str | None = Field(default=None)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(
            DateTime(timezone=True), nullable=False, server_default=func.now()
        ),
    )


class Location(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    original_name: str | None = None
    revision: int = Field(default=1, sa_column=Column(Integer, nullable=False))
    address: str
    customer_id: str
    geog: str | None = Field(default=None, sa_column=_geog_column)
    active: bool = True
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
            onupdate=func.now(),
        ),
    )
    deleted_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    model_config = {"arbitrary_types_allowed": True}


class Order(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    customer_id: str
    name: str
    status: str


class ExtRef(SQLModel, table=True):
    __tablename__ = "ext_ref"

    id: int | None = Field(default=None, primary_key=True)
    source: str
    table: str
    record_id: str
    local_id: int
    etag: str | None = None
    synced_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
            onupdate=func.now(),
        ),
    )

    __table_args__ = (
        UniqueConstraint("source", "table", "record_id"),
    )


class Photo(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    object_key: str
    taken_at: datetime
    status: str = "INGESTED"
    mode: str
    customer_id: str
    uploader_id: str | None = None
    device_id: str | None = None
    site_id: str | None = None
    location_id: int | None = Field(default=None, foreign_key="location.id")
    order_id: int | None = Field(default=None, foreign_key="order.id")
    quality_flag: str | None = Field(default=None)
    note: str | None = Field(default=None)
    calendar_week: str | None = Field(default=None)
    hash: str
    phash: str | None = Field(default=None)
    is_duplicate: bool = Field(default=False)
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
            onupdate=func.now(),
        ),
    )
    deleted_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )


class Share(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="order.id")
    customer_id: str
    url: str
    expires_at: datetime | None = None
    download_allowed: bool = True
    watermark_policy: str | None = None


class AuditLog(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    action: str
    entity: str
    entity_id: int
    user: str
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
        ),
    )
    payload: dict | None = Field(default=None, sa_column=Column(JSON))


class Invitation(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(sa_column=Column(String, nullable=False))
    token: str = Field(sa_column=Column(String, nullable=False, unique=True))
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(
            DateTime(timezone=True), nullable=False, server_default=func.now()
        ),
    )
