import importlib

from fastapi.testclient import TestClient
from sqlmodel import SQLModel

from app.core.config import settings
from app.core.security import create_access_token


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


def auth_headers():
    token = create_access_token(settings.admin_email, settings.access_token_expires_minutes)[
        "access_token"
    ]
    return {"Authorization": f"Bearer {token}"}


def test_create_share(monkeypatch):
    client, session_module, models = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        order = models.Order(customer_id="c1", name="o1", status="NEW")
        session.add(order)
        session.commit()
        session.refresh(order)
        order_id = order.id
    finally:
        session_gen.close()

    payload = {"order_id": order_id}
    r = client.post("/shares", json=payload, headers=auth_headers())
    assert r.status_code == 201
    data = r.json()
    assert data["order_id"] == order_id
    assert data["url"]

    share_id = data["id"]
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        share = session.get(models.Share, share_id)
        assert share is not None
        assert share.order_id == order_id
    finally:
        session_gen.close()


def test_get_share(monkeypatch):
    client, session_module, models = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        order = models.Order(customer_id="c1", name="o1", status="NEW")
        session.add(order)
        session.commit()
        session.refresh(order)
        order_id = order.id
        share = models.Share(order_id=order_id, url="u1")
        session.add(share)
        session.commit()
        session.refresh(share)
        share_id = share.id
    finally:
        session_gen.close()

    r = client.get(f"/shares/{share_id}", headers=auth_headers())
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == share_id
    assert data["order_id"] == order_id


def test_revoke_share(monkeypatch):
    client, session_module, models = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        order = models.Order(customer_id="c1", name="o1", status="NEW")
        session.add(order)
        session.commit()
        session.refresh(order)
        share = models.Share(order_id=order.id, url="u1")
        session.add(share)
        session.commit()
        session.refresh(share)
        share_id = share.id
    finally:
        session_gen.close()

    r = client.post(f"/shares/{share_id}/revoke", headers=auth_headers())
    assert r.status_code == 204

    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        assert session.get(models.Share, share_id) is None
    finally:
        session_gen.close()

    r = client.get(f"/shares/{share_id}", headers=auth_headers())
    assert r.status_code == 404
