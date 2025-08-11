# DokuSuite

Planung und Repository-Struktur für die neue DokuSuite (OOH-Dokumentationsplattform). Aktuell keine Implementierung – Fokus auf Anforderungen, Architektur, Prozesse und Repo-Setup.

Wichtige Einstiege
- Projektvision und Anforderungen: `docs/` (siehe `docs/README.md`)
- Entscheidungen (ADR): `docs/adr/` (Index folgt unten)
- Betrieb & GitHub-Setup: `docs/ops/`
- Backlog/Issues: GitHub Issues (Labels: `area:*`, `prio:*`, `status:*`)

Status
- v1.0 Unterlagen importiert (siehe `docs/`), Tag `v1.0` markiert den Importstand.
- Struktur und Automationen angelegt (Issue-/PR-Templates, Label-Sync, Backlog-Seeding, P1-Polish).
- Noch kein Code – Implementierung folgt in nächsten Schritten.

Ordner
- `apps/` – Platzhalter für iOS, Web, Server
- `packages/` – Contracts (OpenAPI), Shared, Workers (Specs)
- `infra/` – Infrastrukturdokumentation
- `docs/` – Spezifikation, Architektur, Sicherheit, Roadmap

Nützliche Actions
- Sync labels: `.github/workflows/labels.yml`
- Seed backlog (P1/P2): `.github/workflows/seed-backlog.yml` (Input `path` verwenden)
- Polish P1 issues: `.github/workflows/polish-issues.yml`
