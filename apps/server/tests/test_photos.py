import importlib
import io

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

    import app.api.routes.photos as photos_module

    class S3Stub:
        def __init__(self):
            self.last_put: bytes | None = None

        def get_object(self, Bucket, Key):
            return {"Body": io.BytesIO(b"raw")}

        def put_object(self, Bucket, Key, Body):
            self.last_put = Body

    s3_stub = S3Stub()
    monkeypatch.setattr(photos_module, "_s3_client", lambda: s3_stub)
    monkeypatch.setattr(photos_module, "normalize_orientation", lambda b: b"norm")
    called: dict = {}

    def fake_enqueue(payload):
        called["payload"] = payload

    monkeypatch.setattr(photos_module, "enqueue_ingest", fake_enqueue)

    import app.main as app_main
    app_main = importlib.reload(app_main)
    return TestClient(app_main.create_app()), session_module, models, s3_stub, called


def auth_headers():
    token = create_access_token(settings.admin_email, settings.access_token_expires_minutes)[
        "access_token"
    ]
    return {"Authorization": f"Bearer {token}"}


def test_photo_ingest_happy_path(monkeypatch):
    client, session_module, models, s3_stub, called = make_client(monkeypatch)
    payload = {
        "object_key": "k1",
        "taken_at": "2024-01-01T00:00:00Z",
        "mode": "FIXED_SITE",
    }
    r = client.post("/photos", json=payload, headers=auth_headers())
    assert r.status_code == 201
    data = r.json()
    assert data["object_key"] == "k1"
    assert data["status"] == "INGESTED"

    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        photo = session.get(models.Photo, data["id"])
        assert photo is not None
        assert photo.object_key == "k1"
    finally:
        session_gen.close()

    assert s3_stub.last_put == b"norm"
    assert called["payload"]["photo_id"] == data["id"]
    assert called["payload"]["object_key"] == "k1"


def test_photo_ingest_validation_error(monkeypatch):
    client, *_ = make_client(monkeypatch)
    payload = {
        "object_key": "k1",
        "mode": "FIXED_SITE",
    }
    r = client.post("/photos", json=payload, headers=auth_headers())
    assert r.status_code == 422
