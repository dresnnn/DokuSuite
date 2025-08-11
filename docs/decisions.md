# Beschlüsse / Designentscheidungen (Stand 10.08.2025)

- Matching-Radius: 50 m (konfigurierbar).
- Belegungswoche: Start Montag; Sonntag zählt zur Folgewoche; global konfigurierbar, pro Auftrag überschreibbar.
- Speicher: Hetzner S3-kompatibler Object Storage.
- Karten/Geocoding: Initial Google Maps; Caching & Quotensteuerung.
- Freigaben: Magic Links und Accounts (Passwort, optional 2FA); Wasserzeichen-Policy je Kunde/Share; Agenturkunden i. d. R. ohne.
- Duplikate: Hash-only (keine Distanz-/Zeit-Heuristik im MVP).
- iOS-Verteilung: über JAMF (MDM).
- Agentur-Erkennung: zunächst manuell als Flag je Kunde in DokuSuite.

Diese Liste ergänzt die Detaildokumente in `docs/` und erleichtert die spätere Implementierung sowie Reviews.
