from fastapi import APIRouter, Depends, status

from ...core.security import get_current_user


router = APIRouter(prefix="/locations", tags=["locations"], dependencies=[Depends(get_current_user)])


@router.get("")
def list_locations():
    return {"status": "not_implemented"}, status.HTTP_501_NOT_IMPLEMENTED


@router.get("/offline-delta")
def offline_delta():
    return {"status": "not_implemented"}, status.HTTP_501_NOT_IMPLEMENTED

