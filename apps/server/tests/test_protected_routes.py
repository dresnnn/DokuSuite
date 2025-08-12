from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.security import create_access_token
from app.main import create_app


def client():
    return TestClient(create_app())


def auth_headers():
    token = create_access_token(settings.admin_email, settings.access_token_expires_minutes)[
        "access_token"
    ]
    return {"Authorization": f"Bearer {token}"}


def test_photos_requires_auth():
    r = client().get("/photos")
    assert r.status_code == 401


def test_photos_with_auth_returns_data():
    r = client().get("/photos", headers=auth_headers())
    assert r.status_code == 200
    data = r.json()
    assert {"items", "total", "page", "limit"}.issubset(data.keys())

