from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from workers.ingestion.queue import enqueue_ingest
from workers.ninox.queue import enqueue_ninox_sync

from app.core.security import get_current_user


class IngestionJob(BaseModel):
    model_config = ConfigDict(extra="allow")


class NinoxSyncJob(BaseModel):
    model_config = ConfigDict(extra="allow")


router = APIRouter(dependencies=[Depends(get_current_user)])


@router.post("/ingest")
def create_ingest_job(payload: IngestionJob):
    job = enqueue_ingest(payload.model_dump())
    return {"job_id": job.id}


@router.post("/sync/ninox")
def create_ninox_sync_job(payload: NinoxSyncJob | None = None):
    job = enqueue_ninox_sync(payload.model_dump() if payload else None)
    return {"job_id": job.id}
