# Repository-Strategie & Setup (Kurzfassung v1.0)

**Empfehlung: Monorepo** (Polyrepo erst später, falls externe Teams dazukommen)

**Ordnerstruktur**

```
/README.md
/docs/                      ← Konzept, Akzeptanzkriterien (v1.0)
/apps/
  ios/                      ← Swift/SwiftUI App
  web/                      ← Next.js Kundenportal + Konsole
  server/                   ← FastAPI (modularer Monolith)
/packages/
  contracts/                ← OpenAPI 3.1 + JSON-Schemas
  shared/                   ← Typen/Enums/Utils
  workers/                  ← Job-Spezifikationen (ohne Code)
/infra/
  docker/  db/  monitoring/
/.github/
  ISSUE_TEMPLATE/  workflows/  CODEOWNERS
```

**Branching**: trunk-based (`main` geschützt) + kurze Feature-Branches. Conventional Commits, Tags pro App (z. B. `ios-0.1.0`).

**Policies**: 1 Review + Status Checks, Secret Scanning, Dependabot, Labels (`area:*`, `type:*`, `prio:*`).

**Environments**: `dev` · `staging` · `prod` (eigene DB/S3/Secrets). Hetzner S3 Buckets: `stadtbild-ds-dev|stg|prd` (Beispiel).

**CI/CD (Skeleton)**: Lint/Test für alle; `server` Docker-Build; `web` Static Build; `ios` Unit-Tests. Keine Secrets im Repo.

---

# Codex Prompt Pack (Copy‑&‑Paste‑fertig)

## 1) Contracts / OpenAPI 3.1

**Rolle:** Senior API Designer\
**Aufgabe:** Erstelle eine OpenAPI‑Spezifikation basierend auf `/docs/` (v1.0 Akzeptanzkriterien).\
**Muss enthalten:** Auth (Login/Einladungen/2FA), Photos (List/Filter/Details), Assignments (n\:m, manuell), Locations, Orders/OrderItems (read‑only), Shares (Magic Link + Accounts), Exports (ZIP/Excel/PDF), Health.\
**Beachte:** Europe/Berlin, Wasserzeichen‑Policy, Modi (Fester Standort/Mobil).\
**Output:** `packages/contracts/openapi.yaml` + README.

**Prompt (kurz):**

> Rolle: Senior API Designer. Erzeuge eine OpenAPI 3.1 für „DokuSuite“ gemäß den Akzeptanzkriterien in `/docs/` (v1.0). Modelle: Auth (Passwort, Einladungen, optional TOTP), Photo (Metadaten, Hash, Duplikat‑Flag, Zuordnungen), Location (PostGIS‑taugliche Felder), Order/OrderItem (read‑only), Share (Magic‑Link/Account, Wasserzeichen), Export (ZIP/Excel/PDF), Health. Keine Secrets, sinnvolle Enums, Zeitzone Europe/Berlin. Speichere nach `packages/contracts/openapi.yaml`.

---

## 2) Server (FastAPI) – Skeleton

**Rolle:** Backend Lead\
**Aufgabe:** Grundgerüst gemäß OpenAPI. Module: `auth`, `photos`, `locations`, `orders`, `shares`, `exports`, `admin`.\
**Muss:** SQLAlchemy (Postgres + PostGIS), Alembic, S3‑Client (ohne Keys), Redis‑Stub, Worker‑Stub (RQ/Celery), Healthchecks, Logging, `.env` Config, Dockerfile + Compose‑Skizze.\
**Output:** `apps/server/…`

**Prompt (kurz):**

> Rolle: Backend Lead. Erzeuge ein FastAPI‑Skeleton gemäß `packages/contracts/openapi.yaml` inkl. SQLAlchemy‑Models (PostGIS), Alembic‑Migrations, signierten S3‑Uploads, Redis‑Stub, Worker‑Stub, Healthchecks, strukturiertem Logging und `.env`‑basierter Konfiguration. Dockerfile + Compose‑Skizze unter `/infra/docker`. Keine echten Keys, nur Platzhalter.

---

## 3) Worker – Ingestion/Processing

**Rolle:** Systems Engineer\
**Aufgabe:** Gerüst für Hashing (SHA‑256), EXIF/Orientation, Thumbnails, PostGIS‑Matching (50 m), Reverse‑Geocoding‑Interface (Mock), Belegungswoche.\
**Muss:** Idempotente Jobs, Dead‑Letter‑Queue, Metriken‑Hooks, `is_duplicate` nach Hash, Tests.\
**Output:** `packages/workers/`

**Prompt (kurz):**

> Rolle: Systems Engineer. Lege ein Worker‑Package an für Bild‑Ingestion (Hashing SHA‑256, EXIF‑Normalize, Thumbs), Matching (KNN/Radius 50 m), Reverse‑Geocoding‑Interface (Mock), Belegungswochen‑Berechnung. Idempotenz + DLQ + Metrics Hooks. Unit‑Tests. Keine externen API‑Keys.

---

## 4) iOS‑App (SwiftUI) – Skeleton

**Rolle:** Senior iOS Engineer\
**Aufgabe:** Zwei Modi (Fester Standort/Mobil), Capture‑Flow, „Standort aktualisieren“, Upload‑Queue (URLSession background), Login (E‑Mail/Passwort, TOTP‑Stub), Status‑Screens.\
**Muss:** Genauigkeitsanzeige, Kandidatenliste (Mock aus `contracts`), AppStorage/CoreData‑light, JAMF‑Konfig‑Platzhalter.\
**Output:** `apps/ios/…`

**Prompt (kurz):**

> Rolle: Senior iOS Engineer. Baue ein SwiftUI‑Skeleton mit Capture‑Flow, Standort‑Refresh, Kandidatenliste, Offline‑Upload‑Queue, Login (Passwort/TOTP‑Stub), Status‑Screens. Nutze Typen aus `packages/contracts`. Keine echten Keys; Ziel iOS 16+.

---

## 5) Web (Next.js/TS) – Konsole & Kundenportal

**Rolle:** Full‑Stack Lead\
**Aufgabe:** Routen für Konsole (Galerie/Tabelle/Karte) und Kundenportal (Share). OpenAPI‑Client nutzen.\
**Muss:** Virtuelles Scrolling, Bulk‑Selection, Filter‑UI, Google‑Maps‑Placeholder, Auth‑Flows (Account + Magic‑Link‑Stub), Wasserzeichen‑Umschalter (Mock).\
**Output:** `apps/web/…`

**Prompt (kurz):**

> Rolle: Full‑Stack Lead. Erzeuge ein Next.js‑TS Skeleton mit Galerie/Tabelle/Karte (virtuelles Scrolling), Filter‑UI, Bulk‑Selection, Auth (Account + Magic‑Link‑Stub), Wasserzeichen‑Umschalter, Google‑Maps‑Placeholder. Typen via OpenAPI‑Client.

---

## 6) CI/CD (GitHub Actions) – Skeleton

**Rolle:** DevOps\
**Aufgabe:** Workflows für Lint/Test/Build; Release‑Tagging. `server` → Docker Image; `web` → Static Build; `ios` → Unit‑Tests.\
**Muss:** Matrix‑Build (dev/stg), Caching, keine Secrets im Klartext, Status Checks als Pflicht.\
**Output:** `.github/workflows/*.yml`

**Prompt (kurz):**

> Rolle: DevOps. Lege Workflows an: Lint/Test/Build (alle), Docker‑Build für `server`, Static Build für `web`, `ios`‑Unit‑Tests. Nutze Environments `dev`/`stg`; Status Checks required; keine Secrets im Klartext.

---

# Sofort‑Checkliste (ohne Code)

1. GitHub‑Repo `stadtbild-dokusuite` anlegen; Struktur wie oben.
2. `docs/` mit v1.0 aus der Haupt‑Canvas füllen; `v1.0` taggen.
3. `.github/`: Issue-/PR‑Templates, Labels, Branchschutz & CODEOWNERS.
4. Environments/Secrets (dev/stg/prod) anlegen – **leer lassen**.
5. Hetzner S3 Buckets & Subdomain reservieren (keine Keys im Repo).
6. Project Board anlegen; Backlog aus Akzeptanzkriterien importieren.

