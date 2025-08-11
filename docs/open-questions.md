# Offene Fragen & Annahmen

Offene Fragen:
- Karten/Geocoding: Google Maps vs. OSM/alternativ – Anforderungen, Kostenmodell, Nutzungsbedingungen?
- Auth: Eigenes Auth vs. extern (Auth0/Cognito) – Kunden-Login-Anforderungen, 2FA, SSO?
- Storage: Cloud (S3) vs. On-Prem/MinIO – Bandbreite, Kosten, Backupstrategie?
- Exportformate: Muss EXIF/GPS in Exporten enthalten sein? Optionale Entfernung?
- Aufbewahrungsfristen: vertraglich/gesetzlich – unterschiedliche Fristen je Kunde/Auftrag?
- Subunternehmer-Onboarding: Nutzerverwaltung über Einladungslinks ausreichend? Vertrags-/DSGVO-Prozesse?
- iOS-Gerätemanagement: MDM im Einsatz? App-Verteilung (TestFlight/Enterprise)?

Annahmen (bis geklärt):
- iOS ist verbindliche Plattform für Erfassung.
- PostgreSQL als relationale DB, S3-kompatibler Objektspeicher.
- Python-Backend (FastAPI) auf Ubuntu 22.04, Containerbetrieb.
- Presigned Uploads mit serverseitiger Validierung.

