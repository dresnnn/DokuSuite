import importlib
import io
from datetime import datetime

from fastapi.testclient import TestClient
from sqlmodel import SQLModel, select

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
        "site_id": "s1",
        "device_id": "d1",
        "uploader_id": "u1",
        "ad_hoc_spot": {"lat": 52.52, "lon": 13.405},
    }
    r = client.post("/photos", json=payload, headers=auth_headers())
    assert r.status_code == 201
    data = r.json()
    assert data["object_key"] == "k1"
    assert data["status"] == "INGESTED"
    assert data["mode"] == "FIXED_SITE"
    assert data["site_id"] == "s1"
    assert data["device_id"] == "d1"
    assert data["uploader_id"] == "u1"

    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        photo = session.get(models.Photo, data["id"])
        assert photo is not None
        assert photo.object_key == "k1"
        assert photo.is_duplicate is False
        assert photo.calendar_week == "2024-W01"
        assert photo.mode == "FIXED_SITE"
        assert photo.site_id == "s1"
        assert photo.device_id == "d1"
        assert photo.uploader_id == "u1"
    finally:
        session_gen.close()

    assert s3_stub.last_put == b"norm"
    assert called["payload"]["photo_id"] == data["id"]
    assert called["payload"]["object_key"] == "k1"
    assert called["payload"]["mode"] == "FIXED_SITE"
    assert called["payload"]["site_id"] == "s1"
    assert called["payload"]["device_id"] == "d1"
    assert called["payload"]["uploader_id"] == "u1"


def test_photo_ingest_creates_audit_log(monkeypatch):
    client, session_module, models, *_ = make_client(monkeypatch)
    payload = {
        "object_key": "k1",
        "taken_at": "2024-01-01T00:00:00Z",
        "mode": "FIXED_SITE",
        "ad_hoc_spot": {"lat": 52.52, "lon": 13.405},
    }
    r = client.post("/photos", json=payload, headers=auth_headers())
    assert r.status_code == 201
    photo_id = r.json()["id"]

    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        logs = session.exec(select(models.AuditLog)).all()
        assert len(logs) == 1
        log = logs[0]
        assert log.action == "create"
        assert log.entity == "photo"
        assert log.entity_id == photo_id
    finally:
        session_gen.close()


def test_photo_ingest_validation_error(monkeypatch):
    client, *_ = make_client(monkeypatch)
    payload = {
        "object_key": "k1",
        "mode": "FIXED_SITE",
        "ad_hoc_spot": {"lat": 52.52, "lon": 13.405},
    }
    r = client.post("/photos", json=payload, headers=auth_headers())
    assert r.status_code == 422


def test_photo_ingest_duplicate(monkeypatch):
    client, session_module, models, *_ = make_client(monkeypatch)
    payload1 = {
        "object_key": "k1",
        "taken_at": "2024-01-01T00:00:00Z",
        "mode": "FIXED_SITE",
        "ad_hoc_spot": {"lat": 52.52, "lon": 13.405},
    }
    payload2 = {
        "object_key": "k2",
        "taken_at": "2024-01-01T00:00:00Z",
        "mode": "FIXED_SITE",
        "ad_hoc_spot": {"lat": 52.52, "lon": 13.405},
    }
    r1 = client.post("/photos", json=payload1, headers=auth_headers())
    assert r1.status_code == 201
    r2 = client.post("/photos", json=payload2, headers=auth_headers())
    assert r2.status_code == 201

    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        photos = session.exec(select(models.Photo).order_by(models.Photo.id)).all()
        assert len(photos) == 2
        assert photos[0].is_duplicate is False
        assert photos[1].is_duplicate is True
        assert photos[0].hash == photos[1].hash
    finally:
        session_gen.close()


def test_photos_empty_list(monkeypatch):
    client, *_ = make_client(monkeypatch)
    r = client.get("/photos", headers=auth_headers())
    assert r.status_code == 200
    assert r.json() == {"items": [], "total": 0, "page": 1, "limit": 10}


def test_photo_ingest_location_match(monkeypatch):
    client, session_module, models, *_ = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        loc = models.Location(name="Site", address="Addr", geog="POINT(13.405 52.52)")
        session.add(loc)
        session.commit()
        session.refresh(loc)
    finally:
        session_gen.close()

    payload = {
        "object_key": "k3",
        "taken_at": "2024-01-01T00:00:00Z",
        "mode": "FIXED_SITE",
        "ad_hoc_spot": {"lat": 52.5203, "lon": 13.4053},
    }
    r = client.post("/photos", json=payload, headers=auth_headers())
    assert r.status_code == 201
    data = r.json()
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        photo = session.get(models.Photo, data["id"])
        assert photo.location_id == loc.id
    finally:
        session_gen.close()


def test_photo_ingest_location_no_match(monkeypatch):
    client, session_module, models, *_ = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        loc = models.Location(name="Site", address="Addr", geog="POINT(13.405 52.52)")
        session.add(loc)
        session.commit()
    finally:
        session_gen.close()

    payload = {
        "object_key": "k4",
        "taken_at": "2024-01-01T00:00:00Z",
        "mode": "FIXED_SITE",
        "ad_hoc_spot": {"lat": 52.53, "lon": 13.42},
    }
    r = client.post("/photos", json=payload, headers=auth_headers())
    assert r.status_code == 201
    data = r.json()
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        photo = session.get(models.Photo, data["id"])
        assert photo.location_id is None
    finally:
        session_gen.close()


def test_photos_filter(monkeypatch):
    client, session_module, models, *_ = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        session.add(
            models.Photo(
                object_key="k1",
                taken_at=datetime(2024, 1, 1),
                order_id=1,
                status="INGESTED",
                hash="h1",
                mode="FIXED_SITE",
                uploader_id="u1",
            )
        )
        session.add(
            models.Photo(
                object_key="k2",
                taken_at=datetime(2024, 1, 2),
                order_id=2,
                status="PROCESSED",
                hash="h2",
                mode="MOBILE",
                uploader_id="u2",
            )
        )
        session.commit()
    finally:
        session_gen.close()

    r = client.get(
        "/photos?orderId=1&status=INGESTED&mode=FIXED_SITE&uploaderId=u1",
        headers=auth_headers(),
    )
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["object_key"] == "k1"
    assert data["items"][0]["mode"] == "FIXED_SITE"
    assert data["items"][0]["uploader_id"] == "u1"


def test_get_photo(monkeypatch):
    client, session_module, models, *_ = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        photo = models.Photo(
            object_key="k1",
            taken_at=datetime(2024, 1, 1),
            status="INGESTED",
            hash="h1",
            mode="FIXED_SITE",
        )
        session.add(photo)
        session.commit()
        session.refresh(photo)
        photo_id = photo.id
    finally:
        session_gen.close()

    r = client.get(f"/photos/{photo_id}", headers=auth_headers())
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == photo_id
    assert data["object_key"] == "k1"


def test_update_photo(monkeypatch):
    client, session_module, models, *_ = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        photo = models.Photo(
            object_key="k1",
            taken_at=datetime(2024, 1, 1),
            status="INGESTED",
            hash="h1",
            mode="FIXED_SITE",
        )
        session.add(photo)
        session.commit()
        session.refresh(photo)
        photo_id = photo.id
    finally:
        session_gen.close()

    payload = {"quality_flag": "bad", "note": "blurry"}
    r = client.patch(f"/photos/{photo_id}", json=payload, headers=auth_headers())
    assert r.status_code == 200

    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        updated = session.get(models.Photo, photo_id)
        assert updated.quality_flag == "bad"
        assert updated.note == "blurry"
    finally:
        session_gen.close()


def test_update_photo_creates_audit_log(monkeypatch):
    client, session_module, models, *_ = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        photo = models.Photo(
            object_key="k1",
            taken_at=datetime(2024, 1, 1),
            status="INGESTED",
            hash="h1",
            mode="FIXED_SITE",
        )
        session.add(photo)
        session.commit()
        session.refresh(photo)
        photo_id = photo.id
    finally:
        session_gen.close()

    payload = {"quality_flag": "bad"}
    r = client.patch(f"/photos/{photo_id}", json=payload, headers=auth_headers())
    assert r.status_code == 200

    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        logs = session.exec(select(models.AuditLog)).all()
        assert len(logs) == 1
        log = logs[0]
        assert log.action == "update"
        assert log.entity == "photo"
        assert log.entity_id == photo_id
    finally:
        session_gen.close()


def test_batch_assign_default_calendar_week(monkeypatch):
    client, session_module, models, *_ = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        p1 = models.Photo(
            object_key="k1",
            taken_at=datetime(2024, 1, 1),
            status="INGESTED",
            hash="h1",
            mode="FIXED_SITE",
        )
        p2 = models.Photo(
            object_key="k2",
            taken_at=datetime(2024, 1, 2),
            status="INGESTED",
            hash="h2",
            mode="FIXED_SITE",
        )
        session.add(p1)
        session.add(p2)
        session.commit()
        session.refresh(p1)
        session.refresh(p2)
        ids = [p1.id, p2.id]
    finally:
        session_gen.close()

    payload = {"photo_ids": ids, "order_id": 1}
    r = client.post("/photos/batch/assign", json=payload, headers=auth_headers())
    assert r.status_code == 200

    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        p1 = session.get(models.Photo, ids[0])
        p2 = session.get(models.Photo, ids[1])
        assert p1.order_id == 1 and p2.order_id == 1
        assert p1.calendar_week == "2024-W01" and p2.calendar_week == "2024-W01"
    finally:
        session_gen.close()


def test_batch_assign_override_calendar_week(monkeypatch):
    client, session_module, models, *_ = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        p1 = models.Photo(
            object_key="k1",
            taken_at=datetime(2024, 1, 1),
            calendar_week="2024-W01",
            status="INGESTED",
            hash="h1",
            mode="FIXED_SITE",
        )
        p2 = models.Photo(
            object_key="k2",
            taken_at=datetime(2024, 1, 2),
            calendar_week="2024-W01",
            status="INGESTED",
            hash="h2",
            mode="FIXED_SITE",
        )
        session.add(p1)
        session.add(p2)
        session.commit()
        session.refresh(p1)
        session.refresh(p2)
        ids = [p1.id, p2.id]
    finally:
        session_gen.close()

    payload = {"photo_ids": ids, "order_id": 1, "calendar_week": "2024-W02"}
    r = client.post("/photos/batch/assign", json=payload, headers=auth_headers())
    assert r.status_code == 200

    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        p1 = session.get(models.Photo, ids[0])
        p2 = session.get(models.Photo, ids[1])
        assert p1.order_id == 1 and p2.order_id == 1
        assert p1.calendar_week == "2024-W02" and p2.calendar_week == "2024-W02"
    finally:
        session_gen.close()


def test_batch_assign_validation_error(monkeypatch):
    client, *_ = make_client(monkeypatch)
    r = client.post(
        "/photos/batch/assign",
        json={"photo_ids": [1]},
        headers=auth_headers(),
    )
    assert r.status_code == 422


def test_photo_ingest_geocoding_cache_miss(monkeypatch):
    client, session_module, models, *_ = make_client(monkeypatch)
    import app.api.routes.photos as photos_module

    class StubGeocoder:
        def __init__(self):
            self.calls = 0
            self.cache: dict[str, str] = {}

        def reverse_geocode(self, lat, lon):
            key = f"{lat},{lon}"
            if key in self.cache:
                return self.cache[key]
            self.calls += 1
            addr = "Stub Address"
            self.cache[key] = addr
            return addr

    stub = StubGeocoder()
    monkeypatch.setattr(photos_module, "_geocoder", stub)
    payload = {
        "object_key": "k5",
        "taken_at": "2024-01-01T00:00:00Z",
        "mode": "FIXED_SITE",
        "ad_hoc_spot": {"lat": 1.0, "lon": 2.0},
    }
    r = client.post("/photos", json=payload, headers=auth_headers())
    assert r.status_code == 201
    assert stub.calls == 1
    data = r.json()
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        photo = session.get(models.Photo, data["id"])
        assert photo.note == "Stub Address"
    finally:
        session_gen.close()


def test_photo_ingest_geocoding_cache_hit(monkeypatch):
    client, *_ = make_client(monkeypatch)
    import app.api.routes.photos as photos_module

    class StubGeocoder:
        def __init__(self):
            self.calls = 0
            self.cache: dict[str, str] = {}

        def reverse_geocode(self, lat, lon):
            key = f"{lat},{lon}"
            if key in self.cache:
                return self.cache[key]
            self.calls += 1
            addr = "Stub Address"
            self.cache[key] = addr
            return addr

    stub = StubGeocoder()
    monkeypatch.setattr(photos_module, "_geocoder", stub)
    payload1 = {
        "object_key": "k6",
        "taken_at": "2024-01-01T00:00:00Z",
        "mode": "FIXED_SITE",
        "ad_hoc_spot": {"lat": 1.0, "lon": 2.0},
    }
    payload2 = {**payload1, "object_key": "k7"}
    r1 = client.post("/photos", json=payload1, headers=auth_headers())
    assert r1.status_code == 201
    r2 = client.post("/photos", json=payload2, headers=auth_headers())
    assert r2.status_code == 201
    assert stub.calls == 1


def test_delete_photo(monkeypatch):
    client, session_module, models, *_ = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        photo = models.Photo(
            object_key="k1",
            taken_at=datetime(2024, 1, 1),
            status="INGESTED",
            hash="h1",
            mode="FIXED_SITE",
        )
        session.add(photo)
        session.commit()
        session.refresh(photo)
        photo_id = photo.id
    finally:
        session_gen.close()

    r = client.delete(f"/photos/{photo_id}", headers=auth_headers())
    assert r.status_code == 200

    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        deleted = session.get(models.Photo, photo_id)
        assert deleted.deleted_at is not None
        logs = session.exec(select(models.AuditLog)).all()
        assert len(logs) == 1
        log = logs[0]
        assert log.action == "delete"
        assert log.entity == "photo"
        assert log.entity_id == photo_id
    finally:
        session_gen.close()


def test_photos_offline_delta_upserts(monkeypatch):
    client, session_module, models, *_ = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        session.add(
            models.Photo(
                object_key="old",
                taken_at=datetime(2024, 1, 1),
                status="INGESTED",
                hash="h1",
                mode="FIXED_SITE",
            )
        )
        session.commit()
        since = datetime.utcnow()
        session.add(
            models.Photo(
                object_key="new",
                taken_at=datetime(2024, 1, 2),
                status="INGESTED",
                hash="h2",
                mode="FIXED_SITE",
            )
        )
        session.commit()
    finally:
        session_gen.close()
    r = client.get(
        f"/photos/offline-delta?since={since.isoformat()}", headers=auth_headers()
    )
    assert r.status_code == 200
    data = r.json()
    assert len(data["upserts"]) == 1
    assert data["upserts"][0]["object_key"] == "new"
    assert data["tombstones"] == []


def test_photos_offline_delta_tombstones(monkeypatch):
    client, session_module, models, *_ = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        photo = models.Photo(
            object_key="temp",
            taken_at=datetime(2024, 1, 1),
            status="INGESTED",
            hash="h1",
            mode="FIXED_SITE",
        )
        session.add(photo)
        session.commit()
        session.refresh(photo)
        photo_id = photo.id
        since = datetime.utcnow()
        photo.deleted_at = datetime.utcnow()
        session.add(photo)
        session.commit()
    finally:
        session_gen.close()
    r = client.get(
        f"/photos/offline-delta?since={since.isoformat()}", headers=auth_headers()
    )
    assert r.status_code == 200
    data = r.json()
    assert data["upserts"] == []
    assert len(data["tombstones"]) == 1
    assert data["tombstones"][0]["id"] == photo_id
