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

    import app.api.routes.exports as exports_module

    calls: dict[str, bool] = {}

    class JobStub:
        def __init__(self, id: str):
            self.id = id

    def fake_zip():
        calls["zip"] = True
        return JobStub("zip-id")

    def fake_excel():
        calls["excel"] = True
        return JobStub("excel-id")

    monkeypatch.setattr(exports_module, "enqueue_export_zip", lambda: fake_zip())
    monkeypatch.setattr(exports_module, "enqueue_export_excel", lambda: fake_excel())

    import app.main as app_main
    app_main = importlib.reload(app_main)
    client = TestClient(app_main.create_app())
    return client, exports_module, calls


def auth_headers():
    token = create_access_token(settings.admin_email, settings.access_token_expires_minutes)[
        "access_token"
    ]
    return {"Authorization": f"Bearer {token}"}


def test_export_zip_job(monkeypatch):
    client, _exports, calls = make_client(monkeypatch)
    r = client.post("/exports/zip", headers=auth_headers())
    assert r.status_code == 200
    assert r.json()["export_id"] == "zip-id"
    assert calls["zip"]


def test_export_excel_job(monkeypatch):
    client, _exports, calls = make_client(monkeypatch)
    r = client.post("/exports/excel", headers=auth_headers())
    assert r.status_code == 200
    assert r.json()["export_id"] == "excel-id"
    assert calls["excel"]


def test_get_export_status(monkeypatch):
    client, exports_module, _ = make_client(monkeypatch)

    class JobStub:
        def get_status(self):
            return "finished"

        @property
        def result(self):  # pragma: no cover - simple attribute access
            return {"result_key": "exports/test.zip"}

    class S3Stub:
        def generate_presigned_url(self, method, Params, ExpiresIn):  # pragma: no cover - stub
            return "http://example.com/download"

    monkeypatch.setattr(
        exports_module.Job,
        "fetch",
        classmethod(lambda cls, job_id, connection=None: JobStub()),
    )
    monkeypatch.setattr(exports_module, "_s3_client", lambda: S3Stub())

    r = client.get("/exports/any", headers=auth_headers())
    assert r.status_code == 200
    assert r.json() == {
        "status": "finished",
        "result_key": "exports/test.zip",
        "result_url": "http://example.com/download",
    }


def test_export_zip_uploads_to_s3(monkeypatch):
    from workers.ingestion import jobs

    class S3Stub:
        def __init__(self):
            self.args: dict | None = None

        def put_object(self, Bucket, Key, Body):
            self.args = {"Bucket": Bucket, "Key": Key, "Body": Body}

    stub = S3Stub()
    monkeypatch.setattr(jobs, "_s3_client", lambda: stub)
    result = jobs.export_zip()
    assert stub.args is not None
    assert stub.args["Key"].endswith(".zip")
    assert stub.args["Body"]
    assert result["result_key"] == stub.args["Key"]


def test_export_excel_uploads_to_s3(monkeypatch):
    from workers.ingestion import jobs

    class S3Stub:
        def __init__(self):
            self.args: dict | None = None

        def put_object(self, Bucket, Key, Body):
            self.args = {"Bucket": Bucket, "Key": Key, "Body": Body}

    stub = S3Stub()
    monkeypatch.setattr(jobs, "_s3_client", lambda: stub)
    result = jobs.export_excel()
    assert stub.args is not None
    assert stub.args["Key"].endswith(".xlsx")
    assert stub.args["Body"]
    assert result["result_key"] == stub.args["Key"]
