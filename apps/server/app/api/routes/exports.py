from fastapi import APIRouter, Depends, status

from ...core.security import get_current_user


router = APIRouter(prefix="/exports", tags=["exports"], dependencies=[Depends(get_current_user)])


@router.post("/zip")
def export_zip():
    return {"status": "not_implemented"}, status.HTTP_501_NOT_IMPLEMENTED


@router.post("/excel")
def export_excel():
    return {"status": "not_implemented"}, status.HTTP_501_NOT_IMPLEMENTED


@router.get("/{export_id}")
def get_export(export_id: str):
    return {"status": "not_implemented"}, status.HTTP_501_NOT_IMPLEMENTED

