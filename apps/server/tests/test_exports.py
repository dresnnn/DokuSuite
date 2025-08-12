import importlib

from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.security import create_access_token


def make_client(monkeypatch):
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

    monkeypatch.setattr(
        exports_module.Job,
        "fetch",
        classmethod(lambda cls, job_id, connection=None: JobStub()),
    )

    r = client.get("/exports/any", headers=auth_headers())
    assert r.status_code == 200
    assert r.json() == {"status": "finished"}


def test_export_zip_uploads_to_s3(monkeypatch):
    from workers.ingestion import jobs

    class S3Stub:
        def __init__(self):
            self.args: dict | None = None

        def put_object(self, Bucket, Key, Body):
            self.args = {"Bucket": Bucket, "Key": Key, "Body": Body}

    stub = S3Stub()
    monkeypatch.setattr(jobs, "_s3_client", lambda: stub)
    key = jobs.export_zip()
    assert stub.args is not None
    assert stub.args["Key"].endswith(".zip")
    assert stub.args["Body"]
    assert key == stub.args["Key"]


def test_export_excel_uploads_to_s3(monkeypatch):
    from workers.ingestion import jobs

    class S3Stub:
        def __init__(self):
            self.args: dict | None = None

        def put_object(self, Bucket, Key, Body):
            self.args = {"Bucket": Bucket, "Key": Key, "Body": Body}

    stub = S3Stub()
    monkeypatch.setattr(jobs, "_s3_client", lambda: stub)
    key = jobs.export_excel()
    assert stub.args is not None
    assert stub.args["Key"].endswith(".xlsx")
    assert stub.args["Body"]
    assert key == stub.args["Key"]
