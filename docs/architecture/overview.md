# Architektur – Überblick

Komponenten (High-Level):
- iOS-App: Aufnahme, Vor-Matching, Offline-Cache, Upload-Queue.
- Web-Tool: Verwaltung, Kundenportal, Filter/Batch, Exporte, Karten.
- Backend-Service (Python): APIs, AuthZ, Matching- und Medienpipeline, Integrationen. Betriebsform: modularer Monolith mit klar getrennten Domänenmodulen.
- Datenbank: relationale Metadaten (z. B. PostgreSQL + PostGIS für Geodaten/Radius/Nearest-Neighbor).
- Objektspeicher: Bilddateien (z. B. Hetzner S3-kompatibel/MinIO), Thumbnails, Exporte.
- Cache/Warteschlange: Redis für Caching, Background-Jobs (z. B. Celery/RQ).
- Externe Dienste: Ninox REST, Geocoding/Maps (Google Maps oder OSM/Photon/Nominatim), Mail/Transaktions-Email.
 - Reverse Proxy: Nginx/Traefik vor Web/Backend; TLS-Termination, Caching für statische Varianten.

Datenfluss (vereinfacht):
1) iOS erstellt Foto (+EXIF), liest Cache der Standorte, schlägt Matching vor; Nutzer bestätigt.
2) Upload via presigned URL direkt in den Objektspeicher; Metadaten an Backend (kurzlebige, signierte URLs; CORS passend konfiguriert).
3) Backend validiert, schreibt Metadaten in DB, stößt Background-Jobs an (Thumbnails, pHash, Reverse Geocoding bei Ad-hoc, Regel-basierte Belegungswoche).
4) Web-Tool konsumiert API, zeigt Galerien/Karten, ermöglicht Korrekturen und Batch-Zuweisungen.
5) Exporte (ZIP/Excel) und freigabefähige Links werden on-demand oder asynchron erzeugt.
6) Synchronisation mit Ninox (Aufträge, Lieferanten, Standorte) über geplante Deltas; Konfliktauflösung klar definiert.

Technologierichtungen (keine Festlegung):
- Backend: Python (z. B. FastAPI), Celery/RQ, PostgreSQL + PostGIS, SQLAlchemy/Pydantic.
- Web-Tool: moderne SPA/SSR (z. B. React + Next.js) oder klassische Server-Rendering-Variante – Fokus auf Usability und Performance.
- iOS: Swift/SwiftUI, CoreLocation, Hintergrund-Tasks, PhotoKit/AVFoundation, AppTransportSecurity, Keychain.

Qualitätsmechaniken:
- Idempotente Upload- und Job-Verarbeitung; deduplizieren per Hash/Heuristik.
- Rollenkonzept und Scopes auf API-Ebene (Backend erzwingt), Row-Level-Access für kunden-/auftragsbezogene Daten.
- Tracing wichtiger Flows (Upload, Matching, Freigabe, Export).
 - Vollständige Audit-Logs inkl. Kunden-Download/Einsicht; optionales Wasserzeichen pro Share.
