from __future__ import annotations

import hashlib
import io
import uuid
import zipfile
from typing import Any

import boto3
from openpyxl import Workbook
from PIL import Image

from app.core.config import settings
from app.db.models import Photo
from app.db.session import get_session


def _s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        region_name=settings.s3_region,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
    )


def ingest(payload: dict[str, Any]) -> None:
    """Ingest a photo by generating a thumbnail and persisting the hash."""
    client = _s3_client()
    key = payload["object_key"]
    obj = client.get_object(Bucket=settings.s3_bucket, Key=key)
    data = obj["Body"].read()

    # Create thumbnail
    with Image.open(io.BytesIO(data)) as img:
        img.thumbnail((256, 256))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
    thumb_key = f"thumbnails/{key}.jpg"
    client.put_object(Bucket=settings.s3_bucket, Key=thumb_key, Body=buf.getvalue())

    # Compute hash
    digest = hashlib.sha256(data).hexdigest()

    # Persist hash to database
    session_gen = get_session()
    session = next(session_gen)
    try:
        photo = session.get(Photo, payload.get("photo_id"))
        if photo:
            photo.hash = digest
            session.add(photo)
            session.commit()
    finally:
        session_gen.close()


def export_zip(payload: dict[str, Any] | None = None) -> str:
    """Generate a ZIP archive and upload it to S3."""
    client = _s3_client()
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as zf:
        zf.writestr("export.txt", "export")
    buffer.seek(0)
    key = f"exports/{uuid.uuid4()}.zip"
    client.put_object(Bucket=settings.s3_bucket, Key=key, Body=buffer.getvalue())
    return key


def export_excel(payload: dict[str, Any] | None = None) -> str:
    """Generate an Excel file and upload it to S3."""
    client = _s3_client()
    wb = Workbook()
    ws = wb.active
    ws.append(["id", "value"])
    if payload and payload.get("rows"):
        for row in payload["rows"]:
            ws.append(row)
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    key = f"exports/{uuid.uuid4()}.xlsx"
    client.put_object(Bucket=settings.s3_bucket, Key=key, Body=buf.getvalue())
    return key

