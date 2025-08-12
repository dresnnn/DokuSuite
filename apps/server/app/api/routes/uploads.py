import uuid

import boto3
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.security import get_current_user

router = APIRouter(
    prefix="/uploads",
    tags=["uploads"],
    dependencies=[Depends(get_current_user)],
)


def _s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        region_name=settings.s3_region,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
    )


@router.post("/presign")
def presign_upload():
    client = _s3_client()
    key = str(uuid.uuid4())
    presigned = client.generate_presigned_post(
        Bucket=settings.s3_bucket,
        Key=key,
        ExpiresIn=settings.s3_presign_ttl,
    )
    data = {
        "url": presigned["url"],
        "fields": presigned["fields"],
        "expires_in": settings.s3_presign_ttl,
    }
    return JSONResponse(data, headers={"Access-Control-Allow-Origin": settings.s3_cors_origin})
