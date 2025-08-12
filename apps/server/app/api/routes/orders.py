from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlmodel import Session, select

from app.api.schemas import OrderCreate, OrderRead, OrderUpdate, Page
from app.core.security import User, get_current_user
from app.db.models import AuditLog, Order
from app.db.session import get_session

router = APIRouter(prefix="/orders", tags=["orders"], dependencies=[Depends(get_current_user)])


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


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    order = Order(**payload.model_dump())
    session.add(order)
    session.commit()
    session.refresh(order)

    log = AuditLog(
        action="create",
        entity="order",
        entity_id=order.id,
        user=user.email,
        payload=payload.model_dump(mode="json"),
    )
    session.add(log)
    session.commit()
    return OrderRead.model_validate(order, from_attributes=True)


@router.patch("/{order_id}", response_model=OrderRead)
def update_order(
    order_id: int,
    payload: OrderUpdate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(order, key, value)
    session.add(order)
    session.commit()
    session.refresh(order)

    log = AuditLog(
        action="update",
        entity="order",
        entity_id=order.id,
        user=user.email,
        payload=data,
    )
    session.add(log)
    session.commit()
    return OrderRead.model_validate(order, from_attributes=True)

