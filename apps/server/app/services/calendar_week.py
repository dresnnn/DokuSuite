from __future__ import annotations

from datetime import datetime, timezone
from zoneinfo import ZoneInfo

BERLIN_TZ = ZoneInfo("Europe/Berlin")


def calendar_week_from_taken_at(taken_at: datetime) -> str:
    """Return ISO week string in Europe/Berlin timezone for given datetime."""
    if taken_at.tzinfo is None:
        taken_at = taken_at.replace(tzinfo=timezone.utc)
    local = taken_at.astimezone(BERLIN_TZ)
    year, week, _ = local.isocalendar()
    return f"{year}-W{week:02d}"
