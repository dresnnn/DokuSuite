from fastapi.testclient import TestClient

from app.main import create_app


def test_me_requires_auth(monkeypatch):
    # use default admin/env; only check missing token behaviour
    app = create_app()
    client = TestClient(app)
    r = client.get("/auth/me")
    assert r.status_code == 401


def test_me_with_valid_token(monkeypatch):
    from app.core.config import settings
    from app.core.security import create_access_token

    token = create_access_token(settings.admin_email, settings.access_token_expires_minutes)[
        "access_token"
    ]
    app = create_app()
    client = TestClient(app)
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    body = r.json()
    assert body.get("email") == settings.admin_email

