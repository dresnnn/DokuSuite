from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends, status

from app.core.security import get_current_user


router = APIRouter(prefix="/shares", tags=["shares"], dependencies=[Depends(get_current_user)])


@router.post("")
def create_share():
    return JSONResponse({"status": "not_implemented"}, status_code=status.HTTP_501_NOT_IMPLEMENTED)


@router.get("/{share_id}")
def get_share(share_id: str):
    return JSONResponse({"status": "not_implemented"}, status_code=status.HTTP_501_NOT_IMPLEMENTED)


@router.post("/{share_id}/revoke")
def revoke_share(share_id: str):
    return JSONResponse({"status": "not_implemented"}, status_code=status.HTTP_501_NOT_IMPLEMENTED)
