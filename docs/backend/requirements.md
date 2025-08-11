# Backend/Service – Anforderungen

Scope:
- Einheitliche API-Schicht für iOS und Web.
- Datenhaltung und -indizierung (DB) sowie Medienablage (Objektspeicher).
- Integrationen: Ninox (Standorte, Aufträge, Lieferanten), Geocoding, Mail.

APIs (High-Level):
- Auth & Nutzer: Login/Token, Rollen, Einladungen.
- Fotos: Anlegen (Metadaten), Presigned Upload, Status, Suche/Filter, Bulk-Aktionen.
- Standorte: Lesen/Suchen (inkl. Offline-Deltas für iOS), Korrekturen, Historie.
- Aufträge: Lesen/Schreiben, Zuweisung von Fotos, Exporte.
- Exporte: ZIP/Excel erzeugen, asynchron, Ergebnis-Download.

Pipelines/JOBS:
- Medienverarbeitung: Thumbnails, pHash, EXIF/Orientierung, Validierungen.
- Matching: Fixed-Site-Abgleich, Reverse Geocoding (Ad-hoc), Belegungsfenster-Regeln.
- Sync: Ninox-Deltas (idempotent), Konfliktauflösung, Audit-Log.
 - Duplikate: Hash-only-Strategie für Erkennung/Markierung (keine Distanz-/Zeit-Heuristik im MVP).

- Python (z. B. FastAPI), PostgreSQL + PostGIS, Redis, Celery/RQ, S3-kompatibler Storage (Hetzner/MinIO/S3).
- Migrations/Schema-Versionierung, seeding für Dev.
- Observability: strukturierte Logs, Metriken, Traces; Korrelation über Request-/Upload-IDs.

Sicherheit:
- RBAC/ABAC, Scopes/Claims; Mandanten-/Kunden-Trennung.
- Signierte, kurzlebige Upload-URLs; serverseitige Validierung (Dateityp/Größe).
- Vollständiges Audit-Log relevanter Aktionen und Datenänderungen.
 - Row-Level-Access (kunden-/auftragsbezogen), Magic Links + Accounts (Passwort, optional 2FA), Wasserzeichen-Policy je Share/Kunde.
MVP-Einschränkung:
- Keine automatische Zuordnung von Fotos zu Aufträgen; Batch-/manuelle Zuweisung im Web-Tool. Automatisierung optional in späteren Phasen.
