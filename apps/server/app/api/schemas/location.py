from pydantic import BaseModel


class LocationRead(BaseModel):
    id: int
    name: str
    address: str
    active: bool
