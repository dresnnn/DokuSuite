import uuid

import boto3
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlmodel import Session
from workers.ingestion.queue import enqueue_ingest

from app.api.schemas import PhotoIngest, PhotoRead, UploadIntent, UploadIntentRequest
from app.core.config import settings
from app.core.security import get_current_user
from app.db.models import Photo
from app.db.session import get_session
from app.services.exif import normalize_orientation

router = APIRouter(prefix="/photos", tags=["photos"], dependencies=[Depends(get_current_user)])


def _s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        region_name=settings.s3_region,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
    )


@router.post("/upload-intent", response_model=UploadIntent)
def upload_intent(payload: UploadIntentRequest) -> JSONResponse:
    client = _s3_client()
    key = str(uuid.uuid4())
    presigned = client.generate_presigned_post(
        Bucket=settings.s3_bucket,
        Key=key,
        ExpiresIn=settings.s3_presign_ttl,
    )
    data = UploadIntent(
        object_key=key,
        url=presigned["url"],
        fields=presigned["fields"],
        expires_in=settings.s3_presign_ttl,
    )
    return JSONResponse(
        data.model_dump(),
        headers={"Access-Control-Allow-Origin": settings.s3_cors_origin},
    )


@router.get("")
def list_photos():
    return JSONResponse({"status": "not_implemented"}, status_code=status.HTTP_501_NOT_IMPLEMENTED)


@router.post("", response_model=PhotoRead, status_code=status.HTTP_201_CREATED)
def ingest_photo(payload: PhotoIngest, session: Session = Depends(get_session)):
    client = _s3_client()
    obj = client.get_object(Bucket=settings.s3_bucket, Key=payload.object_key)
    data = obj["Body"].read()
    normalized = normalize_orientation(data)
    client.put_object(Bucket=settings.s3_bucket, Key=payload.object_key, Body=normalized)

    photo = Photo(object_key=payload.object_key, taken_at=payload.taken_at)
    session.add(photo)
    session.commit()
    session.refresh(photo)

    enqueue_ingest({"photo_id": photo.id, **payload.model_dump()})
    return PhotoRead.model_validate(photo, from_attributes=True)


@router.get("/{photo_id}")
def get_photo(photo_id: str):
    return JSONResponse({"status": "not_implemented"}, status_code=status.HTTP_501_NOT_IMPLEMENTED)


@router.patch("/{photo_id}")
def update_photo(photo_id: str):
    return JSONResponse({"status": "not_implemented"}, status_code=status.HTTP_501_NOT_IMPLEMENTED)


@router.post("/batch/assign")
def batch_assign():
    return JSONResponse({"status": "not_implemented"}, status_code=status.HTTP_501_NOT_IMPLEMENTED)
