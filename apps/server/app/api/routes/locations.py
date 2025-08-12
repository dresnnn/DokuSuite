from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from app.core.security import get_current_user
from app.db.session import get_session

router = APIRouter(
    prefix="/locations",
    tags=["locations"],
    dependencies=[Depends(get_current_user), Depends(get_session)],
)


@router.get("")
def list_locations():
    return JSONResponse({"status": "not_implemented"}, status_code=status.HTTP_501_NOT_IMPLEMENTED)


@router.get("/offline-delta")
def offline_delta():
    return JSONResponse({"status": "not_implemented"}, status_code=status.HTTP_501_NOT_IMPLEMENTED)
