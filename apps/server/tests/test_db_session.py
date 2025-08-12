import importlib

from sqlmodel import Field, SQLModel


def test_session_roundtrip(monkeypatch):
    monkeypatch.setenv("DOKUSUITE_DATABASE_URL", "sqlite:///:memory:")
    import app.db.session as session_module
    session_module = importlib.reload(session_module)

    class Location(SQLModel, table=True):
        id: int | None = Field(default=None, primary_key=True)
        name: str

    SQLModel.metadata.create_all(session_module.engine)

    session_gen = session_module.get_session()
    session = next(session_gen)
    try:
        loc = Location(name="Test")
        session.add(loc)
        session.commit()
        session.refresh(loc)

        found = session.get(Location, loc.id)
        assert found is not None
        assert found.name == "Test"
    finally:
        session_gen.close()
