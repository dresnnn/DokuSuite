from typing import Any

from rq import Connection, Worker

from app.db.session import get_session
from app.services.ninox_sync import NinoxSyncService

from .queue import _redis, queue


def sync_ninox(payload: dict[str, Any] | None = None) -> None:
    """Job to synchronise Ninox data."""
    session_gen = get_session()
    session = next(session_gen)
    try:
        NinoxSyncService(session).run(payload)
    finally:
        session_gen.close()


def run_worker() -> None:
    """Start a worker to process Ninox sync jobs."""
    with Connection(_redis):
        worker = Worker([queue])
        worker.work()


if __name__ == "__main__":
    run_worker()
