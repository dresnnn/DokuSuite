import uuid
from datetime import datetime
import hashlib

import boto3
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy import func
from sqlmodel import Session, select
from workers.ingestion.queue import enqueue_ingest

from app.api.schemas import (
    BatchAssignRequest,
    Page,
    PhotoIngest,
    PhotoRead,
    PhotoUpdate,
    UploadIntent,
    UploadIntentRequest,
)
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


@router.get("", response_model=Page[PhotoRead])
def list_photos(
    page: int = 1,
    limit: int = 10,
    from_: datetime | None = Query(None, alias="from"),
    to: datetime | None = None,
    mode: str | None = None,
    siteId: int | None = None,
    orderId: int | None = None,
    uploaderId: str | None = None,
    status: str | None = None,
    session: Session = Depends(get_session),
):
    query = select(Photo)
    if from_:
        query = query.where(Photo.taken_at >= from_)
    if to:
        query = query.where(Photo.taken_at <= to)
    if siteId is not None:
        query = query.where(Photo.location_id == siteId)
    if orderId is not None:
        query = query.where(Photo.order_id == orderId)
    if status:
        query = query.where(Photo.status == status)
    # mode and uploaderId are accepted but not stored in the current model

    total = session.exec(select(func.count()).select_from(query.subquery())).one()
    results = session.exec(query.offset((page - 1) * limit).limit(limit)).all()
    items = [PhotoRead.model_validate(r, from_attributes=True) for r in results]
    return Page(items=items, total=total, page=page, limit=limit)


@router.post("", response_model=PhotoRead, status_code=status.HTTP_201_CREATED)
def ingest_photo(payload: PhotoIngest, session: Session = Depends(get_session)):
    client = _s3_client()
    obj = client.get_object(Bucket=settings.s3_bucket, Key=payload.object_key)
    data = obj["Body"].read()
    normalized = normalize_orientation(data)
    client.put_object(Bucket=settings.s3_bucket, Key=payload.object_key, Body=normalized)

    photo_hash = hashlib.sha256(normalized).hexdigest()
    is_dup = (
        session.exec(select(Photo).where(Photo.hash == photo_hash)).first() is not None
    )
    photo = Photo(
        object_key=payload.object_key,
        taken_at=payload.taken_at,
        hash=photo_hash,
        is_duplicate=is_dup,
    )
    session.add(photo)
    session.commit()
    session.refresh(photo)

    enqueue_ingest({"photo_id": photo.id, **payload.model_dump()})
    return PhotoRead.model_validate(photo, from_attributes=True)


@router.get("/{photo_id}", response_model=PhotoRead)
def get_photo(photo_id: int, session: Session = Depends(get_session)):
    photo = session.get(Photo, photo_id)
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return PhotoRead.model_validate(photo, from_attributes=True)


@router.patch("/{photo_id}", response_model=PhotoRead)
def update_photo(
    photo_id: int,
    payload: PhotoUpdate,
    session: Session = Depends(get_session),
):
    photo = session.get(Photo, photo_id)
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(photo, key, value)
    session.add(photo)
    session.commit()
    session.refresh(photo)
    return PhotoRead.model_validate(photo, from_attributes=True)


@router.post("/batch/assign")
def batch_assign(
    payload: BatchAssignRequest, session: Session = Depends(get_session)
):
    photos = session.exec(
        select(Photo).where(Photo.id.in_(payload.photo_ids))
    ).all()
    if len(photos) != len(payload.photo_ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    for photo in photos:
        photo.order_id = payload.order_id
        if payload.calendar_week is not None:
            photo.calendar_week = payload.calendar_week
    session.commit()
    return {"assigned": len(photos)}
