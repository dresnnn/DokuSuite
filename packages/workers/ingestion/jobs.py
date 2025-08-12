from typing import Any


def ingest(payload: dict[str, Any]) -> None:
    """Placeholder ingestion job."""
    print(f"Ingesting payload: {payload}")


def export_zip(payload: dict[str, Any] | None = None) -> None:
    """Placeholder job for generating ZIP exports."""
    print(f"Exporting ZIP with payload: {payload}")


def export_excel(payload: dict[str, Any] | None = None) -> None:
    """Placeholder job for generating Excel exports."""
    print(f"Exporting Excel with payload: {payload}")
