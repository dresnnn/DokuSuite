from __future__ import annotations

from typing import Any

from app.db.session import get_session
from app.services.ninox_sync import NinoxSyncService


def sync_ninox(payload: dict[str, Any] | None = None) -> None:
    """Job to synchronise Ninox data."""
    session_gen = get_session()
    session = next(session_gen)
    try:
        NinoxSyncService(session).run(payload)
    finally:
        session_gen.close()
