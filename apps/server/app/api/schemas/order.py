from pydantic import BaseModel


class OrderRead(BaseModel):
    id: int
    customer_id: str
    name: str
    status: str
