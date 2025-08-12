import importlib
import os

from fastapi.testclient import TestClient
from sqlmodel import SQLModel

from app.core.config import settings
from app.core.security import create_access_token


def client():
    os.environ["DOKUSUITE_DATABASE_URL"] = "sqlite:///:memory:"
    import app.db.session as session_module
    session_module = importlib.reload(session_module)
    import app.db.models as models
    SQLModel.metadata.clear()
    models = importlib.reload(models)
    SQLModel.metadata.create_all(session_module.engine)
    session = next(session_module.get_session())
    session.add(
        models.User(
            email=settings.admin_email,
            password_hash="pw",
            role=models.UserRole.ADMIN,
            customer_id="c1",
        )
    )
    session.commit()
    session.close()
    from app.main import create_app

    return TestClient(create_app())


def auth_headers():
    token = create_access_token(settings.admin_email, settings.access_token_expires_minutes)[
        "access_token"
    ]
    return {"Authorization": f"Bearer {token}"}


def test_photos_requires_auth():
    r = client().get("/photos")
    assert r.status_code == 401


def test_photos_with_auth_returns_data():
    r = client().get("/photos", headers=auth_headers())
    assert r.status_code == 200
    data = r.json()
    assert {"items", "total", "page", "limit"}.issubset(data.keys())

