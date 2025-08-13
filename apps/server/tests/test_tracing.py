import pytest
from fastapi import FastAPI

from app.core.config import settings
from app.main import FastAPIInstrumentor, configure_tracing


def test_configure_tracing_otlp(monkeypatch):
    if FastAPIInstrumentor is None:
        pytest.skip("OpenTelemetry not installed")
    app = FastAPI()
    monkeypatch.setattr(settings, "tracing_exporter", "otlp")
    monkeypatch.setattr(settings, "tracing_endpoint", None)
    configure_tracing(app)

