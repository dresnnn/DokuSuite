from pydantic import BaseModel


class OrderCreate(BaseModel):
    customer_id: str
    name: str
    status: str


class OrderRead(BaseModel):
    id: int
    customer_id: str
    name: str
    status: str


class OrderUpdate(BaseModel):
    customer_id: str | None = None
    name: str | None = None
    status: str | None = None
