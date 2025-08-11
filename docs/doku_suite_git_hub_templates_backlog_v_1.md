# DokuSuite – GitHub Templates & Backlog (v1.0)

Diese Seite enthält **copy‑&‑paste‑fertige** Vorlagen für `.github/` sowie ein **Start‑Backlog** (20+ Issues) auf Basis der v1.0‑Akzeptanzkriterien. Alles bewusst kompakt gehalten.

---

## 1) Labels (empfohlen)

`area:ios`, `area:web`, `area:server`, `area:infra`, `area:contracts`, `area:sync`, `area:auth`, `area:export`, `area:maps`, `area:ux`\
`type:bug`, `type:feat`, `type:chore`, `type:docs`, `type:test`\
`prio:P1`, `prio:P2`, `prio:P3`\
`status:blocked`, `status:needs-info`, `status:design-review`, `status:ready`, `status:in-progress`, `status:qa`, `status:done`

---

## 2) CODEOWNERS (Vorschlag)

> Datei: `CODEOWNERS` (Repo‑Root). Team‑Handles bitte an eure Org anpassen.

```
# Global Default
*                                    @stadtbild/maintainers

# Apps
/apps/ios/                           @stadtbild/ios @stadtbild/maintainers
/apps/web/                           @stadtbild/web @stadtbild/maintainers
/apps/server/                        @stadtbild/backend @stadtbild/maintainers

# Packages
/packages/contracts/                 @stadtbild/backend @stadtbild/web
/packages/shared/                    @stadtbild/backend @stadtbild/web @stadtbild/ios
/packages/workers/                   @stadtbild/backend

# Infra & CI
/infra/                              @stadtbild/ops
/.github/                            @stadtbild/ops @stadtbild/maintainers
/docs/                               @stadtbild/maintainers
```

---

## 3) Issue‑Vorlagen (Markdown)

> Dateien unter `.github/ISSUE_TEMPLATE/`

### a) `bug_report.md`

```
---
name: "🐞 Bug Report"
about: Fehler melden
labels: [type:bug]
---

## Zusammenfassung
_Beschreibe den Fehler kurz._

## Umgebung
- App/Modul: (iOS/Web/Server)
- Version/Commit:
- Umgebung: (dev/staging/prod)

## Reproduktion
1. …
2. …
3. …

## Erwartet
…

## Tatsächlich
…

## Artefakte
- Screenshots/Video: …
- Logs/IDs (falls möglich, ohne Secrets): …

## Schweregrad
- [ ] P1 (Blocker)  [ ] P2  [ ] P3
```

### b) `feature_request.md`

```
---
name: "✨ Feature Request"
about: Neuer Funktionswunsch
labels: [type:feat]
---

## User Story
Als … möchte ich …, damit …

## Kontext & Nutzen
…

## Scope
- In: …
- Out (Nicht‑Ziele): …

## Acceptance Criteria (Gherkin)
- GIVEN … WHEN … THEN …
- …

## Metriken/Erfolg
…

## Abhängigkeiten
…
```

### c) `uat_case.md` (Abnahmefall)

```
---
name: "✅ UAT Case"
about: Abnahmeszenario (Gherkin)
labels: [type:test]
---

## Szenario
GIVEN …
WHEN …
THEN …

## Vorbedingungen
…

## Testdaten
…

## Erwartete Artefakte
- UI‑Screenshot / Export / Log‑Eintrag …
```

### d) `task.md` (Aufgabe/Chore)

```
---
name: "🧰 Task"
about: Technische Aufgabe / Chore
labels: [type:chore]
---

## Beschreibung
…

## Definition of Done
- [ ] …
- [ ] …

## Checklist
- [ ] Tests (falls sinnvoll)
- [ ] Doku/README aktualisiert
- [ ] Telemetrie/Log ergänzt (falls sinnvoll)
```

---

## 4) Pull Request Template

> Datei: `.github/PULL_REQUEST_TEMPLATE.md`

```
## Zweck
Kurzbeschreibung der Änderung.

## Art der Änderung
- [ ] Bugfix
- [ ] Feature
- [ ] Chore/Refactor
- [ ] Docs

## Linked Issues
Fixes #…  Closes #…  Relates #…

## Änderungen im Detail
- …

## Tests
- [ ] Unit‑Tests
- [ ] Manuelle Tests / UAT Fall: …

## Breaking Changes
- [ ] Ja (Migrations/Dokumentation angepasst)
- [ ] Nein

## Security & Datenschutz
- [ ] Keine Secrets/Schlüssel im Code
- [ ] PII geprüft (nur notwendige Felder)
- [ ] Migrations enthalten Rollback

## Screenshots/Artefakte
…
```

---

## 5) Start‑Backlog (20+ Issues)

> Priorisierung: **P1** = muss fürs MVP, **P2** = nice to have in Pilot. Labels jeweils ergänzen (`area:*`, `type:*`).

### A) Contracts & Grundgerüst

1. **OpenAPI 3.1 Grundschema anlegen** (P1, area\:contracts, type\:feat)\
   AC: `packages/contracts/openapi.yaml` existiert; Kernmodelle (Auth, Photo, Location, Order/Item, Share, Export) skizziert; README enthält Build‑Hinweise.
2. **Enums & Fehlercodes definieren** (P1)\
   AC: Einheitliche Fehlerobjekte; Enums für Modus, Wasserzeichen‑Policy, Status.

### B) Backend / Server

3. **FastAPI Skeleton erzeugen** (P1, area\:server)\
   AC: Startbarer Server, Liveness/Readiness, `.env`‑Config, strukturierte Logs.
4. **DB‑Schema & Alembic‑Migrations (Postgres + PostGIS)** (P1, area\:server)\
   AC: Tabellen laut Datenmodell; GIST‑Index auf `location.geog`.
5. **S3 Pre‑Signed Uploads** (P1, area\:server, area\:infra)\
   AC: Endpoint generiert PUT‑URLs; TTL konfigurierbar; CORS‑Header.
6. **Ingestion‑Worker Grundgerüst** (P1, area\:server)\
   AC: Job anlegen/abholen; DLQ; Idempotenz via Hash.
7. **EXIF‑Read & Orientation‑Normalize** (P1)\
   AC: Thumbnails korrekt; Hoch/Quer im Web richtig dargestellt.
8. **Hashing & Duplikate (Server)** (P1)\
   AC: SHA‑256; Duplikatflag setzt; kein Doppel‑Record.
9. **Matching (PostGIS, 50 m)** (P1)\
   AC: Kandidatenliste + Auto‑Vorschlag bei eindeutiger Lage.
10. **Belegungswoche (Europe/Berlin)** (P1)\
    AC: Sonntag → Folgewoche; Override möglich.
11. **Reverse Geocoding Interface + Cache** (P1)\
    AC: Google‑Client als Adapter; Redis‑Cache; Quota‑Schutz.
12. **Audit‑Log Basis** (P1)\
    AC: Änderungen an Foto/Zuordnung/Share protokolliert.

### C) iOS‑App

13. **SwiftUI Skeleton + Login** (P1, area\:ios)\
    AC: Login‑Flow (Passwort), Session im Keychain, Logout.
14. **Capture‑Flow + Standort‑Refresh** (P1)\
    AC: Genauigkeitsanzeige; Moduswahl (Fester Standort/Mobil).
15. **Kandidatenliste (Cache‑Daten)** (P1)\
    AC: Top‑3 Standorte im 50 m Radius, manuell wählbar.
16. **Upload‑Queue (Background Sessions)** (P1)\
    AC: Offline‑Warteschlange; Retry; Statusanzeige.

### D) Web – Konsole & Kundenportal

17. **Next.js Skeleton + Auth‑Flows (Stub)** (P1, area\:web)\
    AC: Loginseite, Magic‑Link‑Stub, geschützte Routen.
18. **Galerie/Tabelle mit virtu. Scrolling** (P1)\
    AC: 10k Elemente performant; gemeinsame Filterleiste.
19. **Bulk‑Selection & Batch‑Zuordnung** (P1)\
    AC: 1.000 Fotos wählen → Auftrag(en) zuordnen; Audit‑Eintrag.
20. **Kunden‑Shares (Magic Link + Wasserzeichen‑Policy)** (P1)\
    AC: Share erstellen, Ablauf festlegen, Branding/Wasserzeichen.
21. **Exporte (Excel/ZIP)** (P1)\
    AC: Spalten wie definiert; ZIP‑Struktur `/Auftrag/YYYY‑WW/…`.
22. **Kartenansicht (Google Maps Placeholder)** (P1)\
    AC: Cluster; Klick → Filter übernimmt; Deep‑Link zu Google Maps.

### E) Ninox‑Sync

23. **Ninox Pull‑Client (Read‑only)** (P1, area\:sync)\
    AC: Tabellen E, MB, Q, NB, K, L, M, P, R, PB, Z, VC, WC; X/HC/IC ignorieren.
24. \*\*Idempotente Upserts + \*\*\`\` (P1)\
    AC: Keine Duplikate bei Wiederholungen; Quarantäne bei Referenzbruch.

### F) Infra / Sicherheit / CI

25. **GitHub Actions Lint/Test/Build (Skeleton)** (P1, area\:infra)\
    AC: Workflows je App; Status Checks required.
26. **Hetzner S3 Buckets & CORS‑Policy** (P1)\
    AC: dev/stg/prd Buckets; CORS passend zu Uploads; keine Keys im Repo.
27. **Branchschutz & CODEOWNERS aktivieren** (P1)\
    AC: 1 Review, Status Checks, Secret Scanning.
28. **Monitoring‑Skizze** (P2)\
    AC: Basis‑Metriken definiert (Uploads/min, Jobdauer), Dashboard‑Entwurf.

---

## 6) Hinweise zum Import ins Repo

- Lege die vier Issue‑Vorlagen und den PR‑Template wie oben an.
- CODEOWNERS mit echten Team‑Handles ersetzen (oder einzelne Nutzer @andre-bogatz etc.).
- Labels einmalig im Repo erstellen (Settings → Labels) und Farben wählen.
- Backlog‑Issues kannst du 1:1 anlegen; Priorität/Labels setzen; Meilenstein „MVP v1.0“ erstellen.

