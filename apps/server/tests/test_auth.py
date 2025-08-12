import importlib
import os

from fastapi.testclient import TestClient


def make_client():
    # Ensure settings pick up env values by reloading the app module
    import app.main as app_main

    importlib.reload(app_main)
    return TestClient(app_main.create_app())


def test_login_success(monkeypatch):
    monkeypatch.setenv("DOKUSUITE_ADMIN_EMAIL", "admin@example.com")
    # Use plain 'admin' to match default fallback
    monkeypatch.setenv("DOKUSUITE_ADMIN_PASSWORD_HASH", "admin")

    client = make_client()
    r = client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "admin"},
    )
    assert r.status_code == 200
    body = r.json()
    assert "access_token" in body and body["token_type"] == "Bearer" and body["expires_in"] > 0


def test_login_failure(monkeypatch):
    monkeypatch.setenv("DOKUSUITE_ADMIN_EMAIL", "admin@example.com")
    monkeypatch.setenv("DOKUSUITE_ADMIN_PASSWORD_HASH", "admin")
    client = make_client()
    r = client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "wrong"},
    )
    assert r.status_code == 401

