import importlib
from datetime import UTC, datetime

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


def test_locations_require_auth(monkeypatch):
    client, _, _ = make_client(monkeypatch)
    r = client.get("/locations")
    assert r.status_code == 401


def test_locations_empty_list(monkeypatch):
    client, _, _ = make_client(monkeypatch)
    r = client.get("/locations", headers=auth_headers())
    assert r.status_code == 200
    assert r.json() == {"items": [], "total": 0, "page": 1, "limit": 10}


def test_locations_simple_filter(monkeypatch):
    client, session_module, models = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        session.add(models.Location(name="Berlin", address="A", customer_id="c1"))
        session.add(models.Location(name="Hamburg", address="B", customer_id="c1"))
        session.commit()
    finally:
        session_gen.close()
    r = client.get("/locations?q=Ber", headers=auth_headers())
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["name"] == "Berlin"


def test_locations_offline_delta_upserts(monkeypatch):
    client, session_module, models = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        session.add(models.Location(name="Old", address="A", customer_id="c1"))
        session.commit()
        since = datetime.now(UTC)
        session.add(models.Location(name="New", address="B", customer_id="c1"))
        session.commit()
    finally:
        session_gen.close()
    r = client.get(
        "/locations/offline-delta",
        params={"since": since.isoformat()},
        headers=auth_headers(),
    )
    assert r.status_code == 200
    data = r.json()
    assert len(data["upserts"]) == 1
    assert data["upserts"][0]["name"] == "New"
    assert data["tombstones"] == []


def test_locations_customer_isolation(monkeypatch):
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
        session.add(models.Location(name="L1", address="A", customer_id="c1"))
        session.add(models.Location(name="L2", address="B", customer_id="c2"))
        session.commit()
    finally:
        session_gen.close()

    token_c1 = create_access_token(
        settings.admin_email, settings.access_token_expires_minutes
    )["access_token"]
    r = client.get("/locations", headers={"Authorization": f"Bearer {token_c1}"})
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "L1"


def test_locations_offline_delta_tombstones(monkeypatch):
    client, session_module, models = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        loc = models.Location(name="Temp", address="A", customer_id="c1")
        session.add(loc)
        session.commit()
        loc_id = loc.id
        since = datetime.now(UTC)
        loc.deleted_at = datetime.now(UTC)
        session.add(loc)
        session.commit()
    finally:
        session_gen.close()
    r = client.get(
        "/locations/offline-delta",
        params={"since": since.isoformat()},
        headers=auth_headers(),
    )
    assert r.status_code == 200
    data = r.json()
    assert data["upserts"] == []
    assert len(data["tombstones"]) == 1
    assert data["tombstones"][0]["id"] == loc_id


def test_update_location(monkeypatch):
    client, session_module, models = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        loc = models.Location(
            name="Old",
            address="A",
            customer_id="c1",
            original_name="Orig",
        )
        session.add(loc)
        session.commit()
        session.refresh(loc)
        loc_id = loc.id
        rev = loc.revision
    finally:
        session_gen.close()

    payload = {"name": "New", "address": "B"}
    r = client.patch(f"/locations/{loc_id}", json=payload, headers=auth_headers())
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "New"
    assert data["address"] == "B"
    assert data["revision"] == rev + 1

    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        updated = session.get(models.Location, loc_id)
        assert updated.name == "New"
        assert updated.address == "B"
        assert updated.revision == rev + 1
    finally:
        session_gen.close()


def test_update_location_creates_audit_log(monkeypatch):
    client, session_module, models = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        loc = models.Location(name="Old", address="A", customer_id="c1")
        session.add(loc)
        session.commit()
        session.refresh(loc)
        loc_id = loc.id
    finally:
        session_gen.close()

    payload = {"name": "New"}
    r = client.patch(f"/locations/{loc_id}", json=payload, headers=auth_headers())
    assert r.status_code == 200

    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        logs = session.exec(select(models.AuditLog)).all()
        assert len(logs) == 1
        log = logs[0]
        assert log.action == "update"
        assert log.entity == "location"
        assert log.entity_id == loc_id
    finally:
        session_gen.close()
