"""Pydantic models for share operations."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from .pagination import Page


class ShareCreate(BaseModel):
    """Request model for creating a share."""

    order_id: int
    expires_at: datetime | None = None
    download_allowed: bool = True
    watermark_policy: str | None = None
    email: EmailStr | None = None


class ShareRead(BaseModel):
    """Response model for share data."""

    id: int
    order_id: int
    url: str
    expires_at: datetime | None = None
    download_allowed: bool
    watermark_policy: str | None = None

    model_config = ConfigDict(from_attributes=True)


class SharePage(Page[ShareRead]):
    """Paginated share response."""

    pass

