from datetime import datetime

from pydantic import BaseModel, EmailStr


class ShareCreate(BaseModel):
    order_id: int
    expires_at: datetime | None = None
    download_allowed: bool = True
    email: EmailStr | None = None


class ShareRead(BaseModel):
    id: int
    order_id: int
    url: str
    expires_at: datetime | None = None
    download_allowed: bool
