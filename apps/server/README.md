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

## API
- Health: `GET /healthz` → `{ "status": "ok" }`

OpenAPI‑Spezifikation liegt in `packages/contracts/openapi.yaml` und wird sukzessive implementiert.

