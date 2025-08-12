from fastapi import APIRouter
from workers.ingestion.queue import enqueue_ingest

router = APIRouter()


@router.post("/ingest")
def create_ingest_job(payload: dict):
    job = enqueue_ingest(payload)
    return {"job_id": job.id}
