# ADR 0002 – Hetzner S3-kompatibler Object Storage

Status: accepted
Datum: 2025-08-10

Kontext
- Große Bildmengen, skalierende Kosten, einfache Integration via S3-API.

Entscheidung
- Nutzung von Hetzner Object Storage (S3-kompatibel) für Originale, Thumbnails, Exporte.

Konsequenzen
- Positive: Kosteneffizient, skalierbar, bekannte S3-APIs.
- Negative: Externe Abhängigkeit, CORS/Signaturen korrekt konfigurieren.
- Offene Punkte: Lifecycle-Policies, Replikation/Backups.

