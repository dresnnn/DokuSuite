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

    calls: dict[str, dict] = {}

    class JobStub:
        def __init__(self, id: str):
            self.id = id

    def fake_ingest(payload: dict) -> JobStub:
        calls["ingest"] = payload
        return JobStub("ingest-id")

    monkeypatch.setattr(ingestion_module, "enqueue_ingest", fake_ingest)

    import app.main as app_main
    app_main = importlib.reload(app_main)
    client = TestClient(app_main.create_app())
    return client, calls


def auth_headers():
    token = create_access_token(settings.admin_email, settings.access_token_expires_minutes)[
        "access_token"
    ]
    return {"Authorization": f"Bearer {token}"}


def test_ingest_requires_auth(monkeypatch):
    client, _ = make_client(monkeypatch)
    r = client.post("/ingest", json={"foo": "bar"})
    assert r.status_code == 401


def test_ingest_job(monkeypatch):
    client, calls = make_client(monkeypatch)
    r = client.post("/ingest", headers=auth_headers(), json={"foo": "bar"})
    assert r.status_code == 200
    assert r.json()["job_id"] == "ingest-id"
    assert calls["ingest"] == {"foo": "bar"}
