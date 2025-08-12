import importlib
from datetime import UTC, datetime, timedelta

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


def test_create_share_with_email(monkeypatch):
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

    sent: dict = {}

    def fake_send_mail(to, subject, body):
        sent["to"] = to
        sent["subject"] = subject
        sent["body"] = body

    monkeypatch.setattr("app.api.routes.shares.send_mail", fake_send_mail)

    payload = {"order_id": order_id, "email": "user@example.com"}
    r = client.post("/shares", json=payload, headers=auth_headers())
    assert r.status_code == 201
    assert sent.get("to") == "user@example.com"


def test_share_audit_logs(monkeypatch):
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

    r = client.post("/shares", json={"order_id": order_id}, headers=auth_headers())
    assert r.status_code == 201
    share_id = r.json()["id"]

    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        logs = session.exec(select(models.AuditLog)).all()
        assert len(logs) == 1
        log = logs[0]
        assert log.action == "create" and log.entity == "share" and log.entity_id == share_id
    finally:
        session_gen.close()

    r = client.post(f"/shares/{share_id}/revoke", headers=auth_headers())
    assert r.status_code == 204

    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        logs = session.exec(select(models.AuditLog).order_by(models.AuditLog.id)).all()
        assert len(logs) == 2
        log = logs[1]
        assert log.action == "delete" and log.entity_id == share_id
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
        share = models.Share(order_id=order_id, customer_id="c1", url="u1")
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
        share = models.Share(order_id=order.id, customer_id="c1", url="u1")
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


def test_shares_customer_isolation(monkeypatch):
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
        order1 = models.Order(customer_id="c1", name="o1", status="NEW")
        order2 = models.Order(customer_id="c2", name="o2", status="NEW")
        session.add(order1)
        session.add(order2)
        session.commit()
        session.refresh(order2)
        share2 = models.Share(order_id=order2.id, customer_id="c2", url="u2")
        session.add(share2)
        session.commit()
        session.refresh(share2)
        share2_id = share2.id
    finally:
        session_gen.close()

    token_c1 = create_access_token(
        settings.admin_email, settings.access_token_expires_minutes
    )["access_token"]
    r = client.get(
        f"/shares/{share2_id}", headers={"Authorization": f"Bearer {token_c1}"}
    )
    assert r.status_code == 404


class _FakeS3:
    def __init__(self):
        self.objects: dict[str, bytes] = {"k1": b"img"}

    def generate_presigned_url(self, method, Params, ExpiresIn):  # pragma: no cover - stub
        return f"http://example.com/{Params['Key']}"

    def get_object(self, Bucket, Key):  # pragma: no cover - stub
        from io import BytesIO

        return {"Body": BytesIO(self.objects.get(Key, b""))}

    def put_object(self, Bucket, Key, Body):  # pragma: no cover - stub
        self.objects[Key] = Body


def test_public_share_photo(monkeypatch):
    client, session_module, models = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        order = models.Order(customer_id="c1", name="o1", status="NEW")
        session.add(order)
        session.commit()
        session.refresh(order)
        photo = models.Photo(
            object_key="k1",
            taken_at=datetime.now(UTC),
            mode="m",
            customer_id="c1",
            order_id=order.id,
            hash="h",
        )
        session.add(photo)
        session.commit()
        session.refresh(photo)
        photo_id = photo.id
        share = models.Share(
            order_id=order.id,
            customer_id="c1",
            url=f"{settings.share_base_url}/tok1",
        )
        session.add(share)
        session.commit()
    finally:
        session_gen.close()
    monkeypatch.setattr("app.api.routes.shares._s3_client", lambda: _FakeS3())
    r = client.get(f"/public/shares/tok1/photos/{photo_id}")
    assert r.status_code == 200
    data = r.json()
    assert data["original_url"].endswith("k1")


def test_public_share_expired(monkeypatch):
    client, session_module, models = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        order = models.Order(customer_id="c1", name="o1", status="NEW")
        session.add(order)
        session.commit()
        session.refresh(order)
        photo = models.Photo(
            object_key="k1",
            taken_at=datetime.now(UTC),
            mode="m",
            customer_id="c1",
            order_id=order.id,
            hash="h",
        )
        session.add(photo)
        session.commit()
        session.refresh(photo)
        photo_id = photo.id
        share = models.Share(
            order_id=order.id,
            customer_id="c1",
            url=f"{settings.share_base_url}/tok1",
            expires_at=datetime.now(UTC).replace(tzinfo=None) - timedelta(seconds=1),
        )
        session.add(share)
        session.commit()
    finally:
        session_gen.close()
    monkeypatch.setattr("app.api.routes.shares._s3_client", lambda: _FakeS3())
    r = client.get(f"/public/shares/tok1/photos/{photo_id}")
    assert r.status_code == 404


def test_public_share_watermark(monkeypatch):
    client, session_module, models = make_client(monkeypatch)
    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        order = models.Order(customer_id="c1", name="o1", status="NEW")
        session.add(order)
        session.commit()
        session.refresh(order)
        photo = models.Photo(
            object_key="k1",
            taken_at=datetime.now(UTC),
            mode="m",
            customer_id="c1",
            order_id=order.id,
            hash="h",
        )
        session.add(photo)
        session.commit()
        session.refresh(photo)
        photo_id = photo.id
        share = models.Share(
            order_id=order.id,
            customer_id="c1",
            url=f"{settings.share_base_url}/tok1",
            download_allowed=False,
        )
        session.add(share)
        session.commit()
    finally:
        session_gen.close()

    fake_s3 = _FakeS3()
    monkeypatch.setattr("app.api.routes.shares._s3_client", lambda: fake_s3)
    called = {}

    def fake_watermark(data):
        called["ok"] = True
        return b"wm"

    monkeypatch.setattr("app.api.routes.shares.apply_watermark", fake_watermark)

    r = client.get(f"/public/shares/tok1/photos/{photo_id}")
    assert r.status_code == 200
    assert called.get("ok")
    assert fake_s3.objects.get("k1-wm") == b"wm"
