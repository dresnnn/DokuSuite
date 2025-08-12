from fastapi import APIRouter, Depends, status

from ...core.security import get_current_user


router = APIRouter(prefix="/shares", tags=["shares"], dependencies=[Depends(get_current_user)])


@router.post("")
def create_share():
    return {"status": "not_implemented"}, status.HTTP_501_NOT_IMPLEMENTED


@router.get("/{share_id}")
def get_share(share_id: str):
    return {"status": "not_implemented"}, status.HTTP_501_NOT_IMPLEMENTED


@router.post("/{share_id}/revoke")
def revoke_share(share_id: str):
    return {"status": "not_implemented"}, status.HTTP_501_NOT_IMPLEMENTED

