import importlib
import pathlib
import sys

sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from sqlmodel import SQLModel, select

from app.core.config import settings
from app.core.security import create_access_token
from app.services.ninox_sync import NinoxSyncService


def setup_db(monkeypatch):
    monkeypatch.setenv("DOKUSUITE_DATABASE_URL", "sqlite:///:memory:")
    import app.db.session as session_module
    session_module = importlib.reload(session_module)
    import app.db.models as models
    SQLModel.metadata.drop_all(session_module.engine)
    SQLModel.metadata.create_all(session_module.engine)
    session_gen = session_module.get_session()
    session = next(session_gen)
    return session, session_gen, models


def test_ninox_upsert(monkeypatch):
    session, session_gen, models = setup_db(monkeypatch)
    try:
        service = NinoxSyncService(session)
        service.run(
            {"locations": [{"id": "1", "customer_id": "c1", "name": "A", "address": "B"}]}
        )
        loc = session.exec(select(models.Location)).one()
        assert loc.name == "A"
        service.run(
            {"locations": [{"id": "1", "customer_id": "c1", "name": "C", "address": "B"}]}
        )
        loc = session.exec(select(models.Location)).one()
        assert loc.name == "C"
        ext = session.exec(select(models.ExtRef)).one()
        assert ext.record_id == "1"
        assert ext.local_id == loc.id
    finally:
        session_gen.close()


def test_ninox_tombstone(monkeypatch):
    session, session_gen, models = setup_db(monkeypatch)
    try:
        service = NinoxSyncService(session)
        service.run(
            {"locations": [{"id": "1", "customer_id": "c1", "name": "A", "address": "B"}]}
        )
        service.run({"locations": [{"id": "1", "customer_id": "c1", "deleted": True}]})
        loc = session.exec(select(models.Location)).one()
        assert loc.deleted_at is not None
    finally:
        session_gen.close()


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

    import app.api.routes.ingestion as ingestion_module

    calls: dict[str, dict | None] = {}

    class JobStub:
        def __init__(self, id: str):
            self.id = id

    def fake_enqueue(payload: dict | None) -> JobStub:
        calls["ninox"] = payload
        return JobStub("ninox-id")

    monkeypatch.setattr(ingestion_module, "enqueue_ninox_sync", fake_enqueue)

    import app.main as app_main
    app_main = importlib.reload(app_main)
    client = TestClient(app_main.create_app())
    return client, calls


def auth_headers():
    token = create_access_token(settings.admin_email, settings.access_token_expires_minutes)[
        "access_token"
    ]
    return {"Authorization": f"Bearer {token}"}


def test_ninox_sync_job_enqueued(monkeypatch):
    client, calls = make_client(monkeypatch)
    r = client.post("/sync/ninox", headers=auth_headers(), json={"foo": "bar"})
    assert r.status_code == 200
    assert r.json()["job_id"] == "ninox-id"
    assert calls["ninox"] == {"foo": "bar"}
