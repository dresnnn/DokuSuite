import importlib

from fastapi.testclient import TestClient
from sqlmodel import SQLModel, select

from app.core.config import settings
from app.core.security import create_access_token


def make_client(monkeypatch):
    monkeypatch.setenv("DOKUSUITE_DATABASE_URL", "sqlite:///:memory:")
    import app.db.session as session_module
    session_module = importlib.reload(session_module)
    import app.db.models as models
    SQLModel.metadata.drop_all(session_module.engine)
    SQLModel.metadata.create_all(session_module.engine)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        session.add(
            models.User(
                email=settings.admin_email,
                password_hash="pw",
                role=models.UserRole.ADMIN,
                customer_id="c1",
            )
        )
        session.commit()
    finally:
        session_gen.close()
    import app.main as app_main
    app_main = importlib.reload(app_main)
    return TestClient(app_main.create_app()), session_module, models


def auth_headers():
    token = create_access_token(settings.admin_email, settings.access_token_expires_minutes)[
        "access_token"
    ]
    return {"Authorization": f"Bearer {token}"}


def test_register(monkeypatch):
    client, session_module, models = make_client(monkeypatch)
    r = client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "secret"},
    )
    assert r.status_code == 201
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        user = session.exec(
            select(models.User).where(models.User.email == "user@example.com")
        ).first()
        assert user is not None
        assert user.email == "user@example.com"
        assert user.password_hash != "secret"
    finally:
        session_gen.close()


def test_login_success(monkeypatch):
    client, _, _ = make_client(monkeypatch)
    client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "secret"},
    )
    r = client.post(
        "/auth/login",
        json={"email": "user@example.com", "password": "secret"},
    )
    assert r.status_code == 200
    body = r.json()
    assert "access_token" in body and body["token_type"] == "Bearer" and body["expires_in"] > 0


def test_login_failure(monkeypatch):
    client, _, _ = make_client(monkeypatch)
    client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "secret"},
    )
    r = client.post(
        "/auth/login",
        json={"email": "user@example.com", "password": "wrong"},
    )
    assert r.status_code == 401


def test_invite_user(monkeypatch):
    client, session_module, models = make_client(monkeypatch)
    sent: dict = {}

    def fake_send_mail(to, subject, body):
        sent["to"] = to
        sent["subject"] = subject
        sent["body"] = body

    monkeypatch.setattr("app.api.routes.auth.send_mail", fake_send_mail)

    r = client.post("/auth/invite", json={"email": "invitee@example.com"}, headers=auth_headers())
    assert r.status_code == 201
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        invitation = session.exec(select(models.Invitation)).first()
        assert invitation is not None
        assert invitation.email == "invitee@example.com"
        assert "invite" in sent.get("subject", "")
    finally:
        session_gen.close()


def test_accept_invite(monkeypatch):
    client, session_module, models = make_client(monkeypatch)
    monkeypatch.setattr("app.api.routes.auth.send_mail", lambda *_, **__: None)
    client.post("/auth/invite", json={"email": "invitee@example.com"}, headers=auth_headers())
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        invitation = session.exec(select(models.Invitation)).first()
        token = invitation.token
    finally:
        session_gen.close()
    r = client.post("/auth/accept", json={"token": token, "password": "secret"})
    assert r.status_code == 200
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        user = session.exec(
            select(models.User).where(models.User.email == "invitee@example.com")
        ).first()
        assert user is not None
        assert user.password_hash != "secret"
        assert (
            session.exec(select(models.Invitation).where(models.Invitation.token == token)).first()
            is None
        )
    finally:
        session_gen.close()


def test_accept_invite_invalid_token(monkeypatch):
    client, _, _ = make_client(monkeypatch)
    r = client.post(
        "/auth/accept",
        json={"token": "bad", "password": "secret"},
    )
    assert r.status_code == 404
