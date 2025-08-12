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


def test_orders_list(monkeypatch):
    client, session_module, models = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        session.add(models.Order(customer_id="c1", name="o1", status="NEW"))
        session.add(models.Order(customer_id="c2", name="o2", status="NEW"))
        session.commit()
    finally:
        session_gen.close()
    r = client.get("/orders", headers=auth_headers())
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1


def test_orders_filter(monkeypatch):
    client, session_module, models = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        session.add(models.Order(customer_id="c1", name="o1", status="NEW"))
        session.add(models.Order(customer_id="c2", name="o2", status="NEW"))
        session.commit()
    finally:
        session_gen.close()
    r = client.get("/orders?customerId=c1", headers=auth_headers())
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["customer_id"] == "c1"


def test_get_order(monkeypatch):
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
    r = client.get(f"/orders/{order_id}", headers=auth_headers())
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == order_id
    assert data["customer_id"] == "c1"


def test_create_order_creates_audit_log(monkeypatch):
    client, session_module, models = make_client(monkeypatch)
    payload = {"customer_id": "c1", "name": "o1", "status": "NEW"}
    r = client.post("/orders", json=payload, headers=auth_headers())
    assert r.status_code == 201
    order_id = r.json()["id"]

    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        logs = session.exec(select(models.AuditLog)).all()
        assert len(logs) == 1
        log = logs[0]
        assert log.action == "create"
        assert log.entity == "order"
        assert log.entity_id == order_id
    finally:
        session_gen.close()


def test_update_order_creates_audit_log(monkeypatch):
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

    payload = {"status": "DONE"}
    r = client.patch(f"/orders/{order_id}", json=payload, headers=auth_headers())
    assert r.status_code == 200

    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        logs = session.exec(select(models.AuditLog)).all()
        assert len(logs) == 1
        log = logs[0]
        assert log.action == "update"
        assert log.entity == "order"
        assert log.entity_id == order_id
    finally:
        session_gen.close()


def test_orders_customer_isolation(monkeypatch):
    client, session_module, models = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        session.add(
            models.User(
                email="admin2@example.com",
                password_hash="pw",
                role=models.UserRole.ADMIN,
                customer_id="c2",
            )
        )
        session.add(models.Order(customer_id="c1", name="o1", status="NEW"))
        other = models.Order(customer_id="c2", name="o2", status="NEW")
        session.add(other)
        session.commit()
        session.refresh(other)
        other_id = other.id
    finally:
        session_gen.close()

    token_c1 = create_access_token(
        settings.admin_email, settings.access_token_expires_minutes
    )["access_token"]
    r = client.get("/orders", headers={"Authorization": f"Bearer {token_c1}"})
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 1
    assert data["items"][0]["customer_id"] == "c1"

    r = client.get(
        f"/orders/{other_id}", headers={"Authorization": f"Bearer {token_c1}"}
    )
    assert r.status_code == 404
