from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class Mode(str, Enum):
    FIXED_SITE = "FIXED_SITE"
    MOBILE = "MOBILE"


class GeoPoint(BaseModel):
    lat: float
    lon: float
    accuracy_m: float | None = None
    heading_deg: float | None = None


class PhotoIngest(BaseModel):
    object_key: str
    taken_at: datetime
    mode: Mode
    site_id: str | None = None
    ad_hoc_spot: GeoPoint
    device_id: str | None = None
    uploader_id: str | None = None
    quality_flag: str | None = None
    note: str | None = None


class PhotoRead(BaseModel):
    id: int
    object_key: str
    taken_at: datetime
    status: str


class PhotoUpdate(BaseModel):
    quality_flag: str | None = None
    note: str | None = None


class BatchAssignRequest(BaseModel):
    photo_ids: list[int]
    order_id: int
    calendar_week: str | None = None
