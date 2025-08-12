from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlmodel import Session, select

from app.api.schemas import OrderRead, Page
from app.core.security import get_current_user
from app.db.models import Order
from app.db.session import get_session

router = APIRouter(
    prefix="/orders", tags=["orders"], dependencies=[Depends(get_current_user)]
)


@router.get("", response_model=Page[OrderRead])
def list_orders(
    customerId: str | None = None,
    page: int = 1,
    limit: int = 10,
    session: Session = Depends(get_session),
):
    query = select(Order)
    if customerId:
        query = query.where(Order.customer_id == customerId)

    total = session.exec(select(func.count()).select_from(query.subquery())).one()
    results = session.exec(query.offset((page - 1) * limit).limit(limit)).all()
    items = [OrderRead.model_validate(r, from_attributes=True) for r in results]
    return Page(items=items, total=total, page=page, limit=limit)


@router.get("/{order_id}", response_model=OrderRead)
def get_order(order_id: int, session: Session = Depends(get_session)):
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return OrderRead.model_validate(order, from_attributes=True)
