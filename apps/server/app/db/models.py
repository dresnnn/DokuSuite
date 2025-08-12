from __future__ import annotations

from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel


class Location(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    address: str
    active: bool = True

    photos: list[Photo] = Relationship(back_populates="location")


class Order(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    customer_id: str
    name: str
    status: str

    photos: list[Photo] = Relationship(back_populates="order")
    shares: list[Share] = Relationship(back_populates="order")


class Photo(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    object_key: str
    taken_at: datetime
    status: str = "INGESTED"
    location_id: int | None = Field(default=None, foreign_key="location.id")
    order_id: int | None = Field(default=None, foreign_key="order.id")

    location: Location | None = Relationship(back_populates="photos")
    order: Order | None = Relationship(back_populates="photos")


class Share(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="order.id")
    url: str
    expires_at: datetime | None = None
    download_allowed: bool = True

    order: Order = Relationship(back_populates="shares")
