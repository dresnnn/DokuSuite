from __future__ import annotations

import os
from collections.abc import Generator

from sqlalchemy.pool import StaticPool
from sqlmodel import Session, create_engine

DATABASE_URL = os.getenv("DOKUSUITE_DATABASE_URL", "sqlite:///:memory:")

connect_args: dict[str, bool] = {}
engine_kwargs: dict = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    if DATABASE_URL == "sqlite:///:memory:":
        engine_kwargs["poolclass"] = StaticPool

engine = create_engine(DATABASE_URL, connect_args=connect_args, **engine_kwargs)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
