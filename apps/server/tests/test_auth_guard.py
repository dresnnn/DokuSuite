import importlib

from fastapi.testclient import TestClient
from sqlmodel import SQLModel

from app.main import create_app


def make_client(monkeypatch):
    monkeypatch.setenv("DOKUSUITE_DATABASE_URL", "sqlite:///:memory:")
    import app.db.session as session_module
    session_module = importlib.reload(session_module)
    import app.db.models as models
    SQLModel.metadata.clear()
    models = importlib.reload(models)
    SQLModel.metadata.create_all(session_module.engine)
    import app.main as app_main
    app_main = importlib.reload(app_main)
    return TestClient(app_main.create_app()), session_module, models


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


def test_orders_require_admin_role(monkeypatch):
    from app.core.config import settings
    from app.core.security import create_access_token

    client, session_module, models = make_client(monkeypatch)

    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        session.add(models.User(email="user@example.com", password_hash="pw"))
        session.commit()
    finally:
        session_gen.close()

    user_token = create_access_token(
        "user@example.com", settings.access_token_expires_minutes
    )["access_token"]
    r = client.get("/orders", headers={"Authorization": f"Bearer {user_token}"})
    assert r.status_code == 403

    admin_token = create_access_token(
        settings.admin_email, settings.access_token_expires_minutes
    )["access_token"]
    r = client.get("/orders", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200


def test_shares_require_admin_role(monkeypatch):
    from app.core.config import settings
    from app.core.security import create_access_token

    client, session_module, models = make_client(monkeypatch)

    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        session.add(models.User(email="user@example.com", password_hash="pw"))
        order = models.Order(customer_id="c1", name="o1", status="NEW")
        session.add(order)
        session.commit()
        session.refresh(order)
        order_id = order.id
    finally:
        session_gen.close()

    user_token = create_access_token(
        "user@example.com", settings.access_token_expires_minutes
    )["access_token"]
    r = client.post(
        "/shares", json={"order_id": order_id}, headers={"Authorization": f"Bearer {user_token}"}
    )
    assert r.status_code == 403

    admin_token = create_access_token(
        settings.admin_email, settings.access_token_expires_minutes
    )["access_token"]
    r = client.post(
        "/shares", json={"order_id": order_id}, headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert r.status_code == 201

