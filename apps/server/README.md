# DokuSuite Server (FastAPI)

Minimaler Start für den Backend‑Service inkl. Health‑Endpoint.

## Quickstart
- Python 3.11+ installieren
- Installation (dev):
  - `pip install -e .[dev]`
- Starten (lokal):
  - `uvicorn app.main:app --reload --port 8000`
- Testen:
  - `pytest`
- Lint:
  - `ruff check .`

## Logging & Monitoring
- Logs werden im JSON‑Format ausgegeben.
- Jeder Request erhält eine `X-Request-ID` und wird mit Dauer sowie Statuscode geloggt.
- Prometheus‑Metrics unter `GET /metrics`, inkl. Request‑Counter und Gauge für laufende Requests.

## Migrationen
- Neue Revision erzeugen:
  - `alembic revision --autogenerate -m "message"`
- Migration ausführen:
  - `alembic upgrade head`

## API
- Health: `GET /healthz` → `{ "status": "ok" }`

OpenAPI‑Spezifikation liegt in `packages/contracts/openapi.yaml` und wird sukzessive implementiert.

