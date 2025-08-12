from fastapi import APIRouter, Depends, status

from ...core.security import get_current_user


router = APIRouter(prefix="/orders", tags=["orders"], dependencies=[Depends(get_current_user)])


@router.get("")
def list_orders():
    return {"status": "not_implemented"}, status.HTTP_501_NOT_IMPLEMENTED


@router.get("/{order_id}")
def get_order(order_id: str):
    return {"status": "not_implemented"}, status.HTTP_501_NOT_IMPLEMENTED

