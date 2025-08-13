from pydantic import BaseModel


class LocationRead(BaseModel):
    id: int
    name: str
    original_name: str | None = None
    revision: int
    address: str
    active: bool


class LocationUpdate(BaseModel):
    name: str | None = None
    original_name: str | None = None
    address: str | None = None
    active: bool | None = None
