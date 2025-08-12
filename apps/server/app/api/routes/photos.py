from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from app.core.security import get_current_user


router = APIRouter(prefix="/photos", tags=["photos"], dependencies=[Depends(get_current_user)])


@router.post("/upload-intent")
def upload_intent():
    return JSONResponse({"status": "not_implemented"}, status_code=status.HTTP_501_NOT_IMPLEMENTED)


@router.get("")
def list_photos():
    return JSONResponse({"status": "not_implemented"}, status_code=status.HTTP_501_NOT_IMPLEMENTED)


@router.post("")
def ingest_photo():
    return JSONResponse({"status": "not_implemented"}, status_code=status.HTTP_501_NOT_IMPLEMENTED)


@router.get("/{photo_id}")
def get_photo(photo_id: str):
    return JSONResponse({"status": "not_implemented"}, status_code=status.HTTP_501_NOT_IMPLEMENTED)


@router.patch("/{photo_id}")
def update_photo(photo_id: str):
    return JSONResponse({"status": "not_implemented"}, status_code=status.HTTP_501_NOT_IMPLEMENTED)


@router.post("/batch/assign")
def batch_assign():
    return JSONResponse({"status": "not_implemented"}, status_code=status.HTTP_501_NOT_IMPLEMENTED)
