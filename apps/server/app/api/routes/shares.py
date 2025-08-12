import secrets
from datetime import UTC, datetime

import boto3
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session, select

from app.api.schemas import ShareCreate, ShareRead
from app.core.config import settings
from app.core.security import User, require_role
from app.db.models import AuditLog, Order, Photo, Share
from app.db.session import get_session
from app.services.mail import send_mail
from app.services.watermark import apply_watermark

router = APIRouter(prefix="/shares", tags=["shares"])
public_router = APIRouter(prefix="/public/shares", tags=["public-shares"])


def _s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        region_name=settings.s3_region,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
    )


@router.post("", response_model=ShareRead, status_code=status.HTTP_201_CREATED)
def create_share(
    payload: ShareCreate,
    session: Session = Depends(get_session),
    user: User = Depends(require_role("ADMIN")),
):
    order = session.get(Order, payload.order_id)
    if not order or (user.customer_id and order.customer_id != user.customer_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    token = secrets.token_urlsafe(16)
    share = Share(
        order_id=payload.order_id,
        customer_id=order.customer_id,
        url=f"{settings.share_base_url}/{token}",
        expires_at=payload.expires_at,
        download_allowed=payload.download_allowed,
        watermark_policy=payload.watermark_policy,
    )
    session.add(share)
    session.commit()
    session.refresh(share)

    if payload.email:
        send_mail(
            payload.email,
            "Your share link",
            f"Download: {share.url}",
        )

    log = AuditLog(
        action="create",
        entity="share",
        entity_id=share.id,
        user=user.email,
        payload=payload.model_dump(mode="json"),
    )
    session.add(log)
    session.commit()
    return ShareRead.model_validate(share, from_attributes=True)


@router.get("/{share_id}", response_model=ShareRead)
def get_share(
    share_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(require_role("ADMIN")),
):
    share = session.get(Share, share_id)
    if not share or (user.customer_id and share.customer_id != user.customer_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return ShareRead.model_validate(share, from_attributes=True)


@router.post("/{share_id}/revoke", status_code=status.HTTP_204_NO_CONTENT)
def revoke_share(
    share_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(require_role("ADMIN")),
):
    share = session.get(Share, share_id)
    if not share or (user.customer_id and share.customer_id != user.customer_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    session.delete(share)
    session.commit()

    log = AuditLog(
        action="delete",
        entity="share",
        entity_id=share_id,
        user=user.email,
        payload=None,
    )
    session.add(log)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@public_router.get("/{token}/photos/{photo_id}")
def public_photo(
    token: str,
    photo_id: int,
    session: Session = Depends(get_session),
):
    share = session.exec(
        select(Share).where(Share.url == f"{settings.share_base_url}/{token}")
    ).one_or_none()
    if not share:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    now = datetime.now(UTC)
    if share.expires_at and share.expires_at.replace(tzinfo=UTC) < now:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    photo = session.get(Photo, photo_id)
    if not photo or photo.order_id != share.order_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    client = _s3_client()
    key = photo.object_key
    thumb_key = f"{photo.object_key}-thumb"
    if not share.download_allowed:
        obj = client.get_object(Bucket=settings.s3_bucket, Key=photo.object_key)
        wm_bytes = apply_watermark(obj["Body"].read())
        wm_key = f"{photo.object_key}-wm"
        client.put_object(Bucket=settings.s3_bucket, Key=wm_key, Body=wm_bytes)
        key = wm_key
    original_url = client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": key},
        ExpiresIn=settings.s3_presign_ttl,
    )
    thumb_url = client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": thumb_key},
        ExpiresIn=settings.s3_presign_ttl,
    )
    return {"original_url": original_url, "thumbnail_url": thumb_url}
