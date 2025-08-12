import boto3
from fastapi import APIRouter, Depends, HTTPException, status
from rq.exceptions import NoSuchJobError
from rq.job import Job
from workers.ingestion.queue import (
    _redis,
    enqueue_export_excel,
    enqueue_export_zip,
)

from app.core.config import settings
from app.core.security import get_current_user

router = APIRouter(prefix="/exports", tags=["exports"], dependencies=[Depends(get_current_user)])


def _s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        region_name=settings.s3_region,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
    )


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
    except NoSuchJobError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Export not found"
        ) from err
    status_ = job.get_status()
    result: dict[str, str] = {"status": status_}
    if status_ == "finished":
        key = (
            job.result.get("result_key")
            if isinstance(job.result, dict)
            else job.result
        )
        if key:
            client = _s3_client()
            url = client.generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.s3_bucket, "Key": key},
                ExpiresIn=settings.s3_presign_ttl,
            )
            result["result_key"] = key
            result["result_url"] = url
    return result
