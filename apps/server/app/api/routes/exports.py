from fastapi import APIRouter, Depends, HTTPException, status
from rq.exceptions import NoSuchJobError
from rq.job import Job

from workers.ingestion.queue import (
    _redis,
    enqueue_export_excel,
    enqueue_export_zip,
)

from app.core.security import get_current_user

router = APIRouter(prefix="/exports", tags=["exports"], dependencies=[Depends(get_current_user)])


@router.post("/zip")
def export_zip():
    job = enqueue_export_zip()
    return {"export_id": job.id}


@router.post("/excel")
def export_excel():
    job = enqueue_export_excel()
    return {"export_id": job.id}


@router.get("/{export_id}")
def get_export(export_id: str):
    try:
        job = Job.fetch(export_id, connection=_redis)
    except NoSuchJobError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Export not found")
    return {"status": job.get_status()}
