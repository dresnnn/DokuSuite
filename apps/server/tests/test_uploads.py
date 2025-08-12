from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.security import create_access_token
from app.main import create_app

client = TestClient(create_app())


def auth_headers():
    token = create_access_token(settings.admin_email, settings.access_token_expires_minutes)[
        "access_token"
    ]
    return {"Authorization": f"Bearer {token}"}


def test_presign_generates_url_and_expiry():
    r = client.post("/uploads/presign", headers=auth_headers())
    assert r.status_code == 200
    data = r.json()
    expected_url = f"{settings.s3_endpoint_url}/{settings.s3_bucket}"
    assert data["url"] == expected_url
    assert data["expires_in"] == settings.s3_presign_ttl
    assert "key" in data["fields"]
