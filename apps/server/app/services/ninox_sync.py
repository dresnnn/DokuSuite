from __future__ import annotations

import json
import urllib.request
from collections.abc import Iterable
from datetime import datetime
from typing import Any

from sqlmodel import Session, select

from app.db.models import ExtRef, Location, Order


class NinoxSyncService:
    """Synchronise data from Ninox into local tables."""

    def __init__(
        self,
        session: Session,
        base_url: str | None = None,
        token: str | None = None,
    ) -> None:
        self.session = session
        self.base_url = base_url
        self.token = token

    # --- fetching -----------------------------------------------------
    def fetch(self) -> dict[str, list[dict[str, Any]]]:  # pragma: no cover - requires network
        if not self.base_url:
            return {"locations": [], "orders": []}
        req = urllib.request.Request(self.base_url)
        if self.token:
            req.add_header("Authorization", f"Bearer {self.token}")
        with urllib.request.urlopen(req, timeout=10) as resp:  # nosec B310
            return json.load(resp)

    # --- public API ---------------------------------------------------
    def run(self, payload: dict[str, Any] | None = None) -> None:
        data = payload or self.fetch()
        self.sync_locations(data.get("locations", []))
        self.sync_orders(data.get("orders", []))
        self.session.commit()

    # --- syncing helpers ----------------------------------------------
    def sync_locations(self, records: Iterable[dict[str, Any]]) -> None:
        for rec in records:
            self._sync_record(
                rec, "location", Location, ["customer_id", "name", "address", "active"]
            )

    def sync_orders(self, records: Iterable[dict[str, Any]]) -> None:
        for rec in records:
            self._sync_record(rec, "order", Order, ["customer_id", "name", "status"])

    def _sync_record(
        self, rec: dict[str, Any], table: str, model_cls: Any, fields: list[str]
    ) -> None:
        ext = self.session.exec(
            select(ExtRef).where(
                ExtRef.source == "ninox",
                ExtRef.table == table,
                ExtRef.record_id == str(rec["id"]),
            )
        ).first()

        if rec.get("deleted"):
            if ext:
                obj = self.session.get(model_cls, ext.local_id)
                if obj and getattr(obj, "deleted_at", None) is None:
                    obj.deleted_at = datetime.utcnow()
            return

        if ext:
            obj = self.session.get(model_cls, ext.local_id)
            if not obj:
                obj = model_cls(**{f: rec.get(f) for f in fields})
                self.session.add(obj)
                self.session.flush()
                ext.local_id = obj.id
            else:
                for f in fields:
                    if f in rec:
                        setattr(obj, f, rec[f])
        else:
            obj = model_cls(**{f: rec.get(f) for f in fields})
            self.session.add(obj)
            self.session.flush()
            ext = ExtRef(
                source="ninox",
                table=table,
                record_id=str(rec["id"]),
                local_id=obj.id,
            )
            self.session.add(ext)

        ext.etag = rec.get("etag")
        ext.synced_at = datetime.utcnow()
