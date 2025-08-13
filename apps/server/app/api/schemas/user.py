from pydantic import BaseModel

from app.db.models import UserRole


class UserRead(BaseModel):
    id: int
    email: str
    role: UserRole


class UserUpdate(BaseModel):
    role: UserRole | None = None
