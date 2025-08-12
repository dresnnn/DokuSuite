from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, func
from sqlmodel import Field, SQLModel


class Location(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    address: str
    active: bool = True
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
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


class Order(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    customer_id: str
    name: str
    status: str


class Photo(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    object_key: str
    taken_at: datetime
    status: str = "INGESTED"
    location_id: int | None = Field(default=None, foreign_key="location.id")
    order_id: int | None = Field(default=None, foreign_key="order.id")
    quality_flag: str | None = Field(default=None)
    note: str | None = Field(default=None)
    calendar_week: str | None = Field(default=None)


class Share(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="order.id")
    url: str
    expires_at: datetime | None = None
    download_allowed: bool = True
