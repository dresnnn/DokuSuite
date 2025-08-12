import importlib
import pathlib
import sys

sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))

from sqlmodel import SQLModel, select

from app.services.ninox_sync import NinoxSyncService


def setup_db(monkeypatch):
    monkeypatch.setenv("DOKUSUITE_DATABASE_URL", "sqlite:///:memory:")
    import app.db.session as session_module
    session_module = importlib.reload(session_module)
    import app.db.models as models
    SQLModel.metadata.clear()
    models = importlib.reload(models)
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
