"""Tests for upload intent endpoint."""

# ruff: noqa: E402,I001

import importlib
import os

from fastapi.testclient import TestClient
from sqlmodel import SQLModel

from app.core.config import settings
from app.core.security import create_access_token
from app.api.schemas.upload import MAX_FILE_SIZE

os.environ["DOKUSUITE_DATABASE_URL"] = "sqlite:///:memory:"
import app.db.session as session_module  # noqa: E402
session_module = importlib.reload(session_module)
import app.db.models as models  # noqa: E402
SQLModel.metadata.clear()
models = importlib.reload(models)
SQLModel.metadata.create_all(session_module.engine)
session = next(session_module.get_session())
session.add(
    models.User(
        email=settings.admin_email,
        password_hash="pw",
        role=models.UserRole.ADMIN,
        customer_id="c1",
    )
)
session.commit()
session.close()

from app.main import create_app  # noqa: E402

client = TestClient(create_app())


def auth_headers():
    token = create_access_token(settings.admin_email, settings.access_token_expires_minutes)[
        "access_token"
    ]
    return {"Authorization": f"Bearer {token}"}


def test_upload_intent_generates_url_and_expiry():
    payload = {"contentType": "image/jpeg", "size": 1}
    r = client.post("/photos/upload-intent", json=payload, headers=auth_headers())
    assert r.status_code == 200
    data = r.json()
    expected_url = f"{settings.s3_endpoint_url}/{settings.s3_bucket}"
    assert data["url"] == expected_url
    assert data["expires_in"] == settings.s3_presign_ttl
    assert data["fields"]["key"] == data["object_key"]


def test_upload_intent_rejects_invalid_type():
    payload = {"contentType": "text/plain", "size": 1}
    r = client.post("/photos/upload-intent", json=payload, headers=auth_headers())
    assert r.status_code == 400


def test_upload_intent_rejects_large_file():
    payload = {"contentType": "image/jpeg", "size": MAX_FILE_SIZE + 1}
    r = client.post("/photos/upload-intent", json=payload, headers=auth_headers())
    assert r.status_code == 400
