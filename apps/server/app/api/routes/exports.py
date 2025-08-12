from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends, status

from app.core.security import get_current_user


router = APIRouter(prefix="/exports", tags=["exports"], dependencies=[Depends(get_current_user)])


@router.post("/zip")
def export_zip():
    return JSONResponse({"status": "not_implemented"}, status_code=status.HTTP_501_NOT_IMPLEMENTED)


@router.post("/excel")
def export_excel():
    return JSONResponse({"status": "not_implemented"}, status_code=status.HTTP_501_NOT_IMPLEMENTED)


@router.get("/{export_id}")
def get_export(export_id: str):
    return JSONResponse({"status": "not_implemented"}, status_code=status.HTTP_501_NOT_IMPLEMENTED)
