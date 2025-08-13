# Web-Tool – Anforderungen

Hauptnutzergruppen:

- Verwaltung/Team: Prüfung, Korrektur, Zuordnung, Exporte, Freigaben.
- Kunden: Einsicht in freigegebene Aufträge, Download, Karten/Excel.
- Plakatierer (optional): Eigene Uploads sichten, Status einsehen.

Kernfunktionen:

- Galerie mit schneller Filterung (Plakatierer, Woche, Standort, Modus, Qualität, Auftrag, Kunde, Zeitraum, Status) sowie spezifischen Parametern `from`, `to`, `orderId`, `status`, `siteId`.
- Kartenansicht mit Leaflet, lädt `/photos?bbox=` abhängig vom Kartenausschnitt,
  clustert Marker und erlaubt Standortkorrektur per Drag-and-Drop
  (`PATCH /photos/{id}` aktualisiert die Koordinaten).
- Bulk-Operationen: Multi-Select, Zuweisen (`POST /photos/batch/assign`), Ausblenden (`POST /photos/batch/hide`), Curate-Flag (`POST /photos/batch/curate`), Re-Matching (`POST /photos/batch/rematch`), Export ausgewählter Fotos als ZIP/Excel/PDF (`POST /exports/zip`, `POST /exports/excel`, `POST /exports/pdf`).
- Mehrfachauswahl im Grid/Table mit Auftragszuweisung via `POST /photos/batch/assign`; weitere Batch-Aktionen über `POST /photos/batch/hide`, `POST /photos/batch/curate` und `POST /photos/batch/rematch`.
- Kundenfreigaben: Links (ablaufbar), Kunden-Login, ZIP-, Excel- und PDF-Export (`POST /exports/zip`, `POST /exports/excel`, `POST /exports/pdf`), Karten-Sharing.
- Freigabeverwaltung: bestehende Shares paginiert listen (`page`/`limit`), neue Links mit Ablaufdatum (`expires_at`) und Wasserzeichen-Policy (`watermark_policy`) erzeugen, Widerruf über `POST /shares/{id}/revoke`; die generierte URL wird nach Erstellung angezeigt.
- Export-Workflow: Export-Jobs der aktuellen Sitzung lokal verfolgen, ZIP-, Excel- und PDF-Exporte der ausgewählten Fotos anstoßen (`POST /exports/zip`, `POST /exports/excel`, `POST /exports/pdf`), Status via Polling aktualisieren (`GET /exports/{id}`) und Download-Link bei abgeschlossenen Jobs (`status=done`).
- Nutzer-/Rollenverwaltung; Einladungslinks, Passwort-Reset, 2FA (später).
- Auftragsverwaltung: Aufträge listen, nach Kunde und Status filtern, neue Aufträge anlegen sowie Details ansehen und den Status bearbeiten (`GET /orders/{id}`, `PATCH /orders/{id}`).
- Standortpflege: Standorte suchen (`q`, `near`, `radius_m`), paginiert listen und Name, Adresse oder Aktivstatus bearbeiten (`PATCH /locations/{id}`).
- Foto-Detailseite zur Bearbeitung von Metadaten (`quality_flag`, `note`, ...)
  über `PATCH /photos/{id}`.
- Foto-Upload: Browser fordert über `POST /photos/upload-intent` eine signierte URL an und lädt die Datei direkt hoch.
- Authentifizierung via Token: Browser speichert das Token und sendet es bei jeder API-Anfrage als `Authorization: Bearer <token>`.
- `AuthContext` verwaltet Loginstatus und Token im Frontend.
- `AuthGuard` schützt Seiten und leitet nicht authentifizierte Nutzer auf `/login`.
- Admin-Seiten (`Users`, `Shares`, `Locations`) sind nur für Nutzer mit `role === 'ADMIN'` zugänglich und leiten sonst auf `/photos` weiter.
- Logout löscht das Token und navigiert zu `/login`.
- Registrierung neuer Nutzer über Formular (`POST /auth/register`), leitet nach erfolgreicher Registrierung zu `/login`.
- Navigationsleiste mit Links zu `Photos`, `Users`, `Orders`, `Shares` und `Exports`.
- Branding/Wasserzeichen-Policy je Kunde/Share (Agenturkunden i. d. R. ohne Wasserzeichen).

## Kunden-Flow

- Kunde öffnet einen Freigabe-Link `/public/{token}`.
- Die Galerie lädt die Fotos inklusive URLs direkt über `/public/shares/{token}/photos`; keine Einzelrequests pro Bild.
- Der Kunde kann einzelne Fotos auswählen und ZIP- (`POST /exports/zip`) oder Excel-Exporte (`POST /exports/excel`) starten; der Status wird über Polling von `/exports/{id}` aktualisiert.
- Der Kunde kann zusätzlich einen PDF-Report (`POST /exports/pdf`) auslösen und eine Kartenansicht aufrufen, die Fotos abhängig vom Kartenausschnitt über `/public/shares/{token}/photos?bbox` lädt.

## Invite-Flow

- Ein Administrator lädt einen Nutzer über `POST /auth/invite` ein.
- Der Nutzer erhält einen Link `/accept/{token}`.
- Auf der Accept-Seite setzt der Nutzer ein neues Passwort; das Frontend sendet `POST /auth/accept` mit Token und Passwort.
- Nach erfolgreichem Setzen des Passworts kann sich der Nutzer über `/login` anmelden.

## Invite-Flow

- Ein Administrator lädt einen Nutzer über `POST /auth/invite` ein.
- Der Nutzer erhält einen Link `/accept/{token}`.
- Auf der Accept-Seite setzt der Nutzer ein neues Passwort; das Frontend sendet `POST /auth/accept` mit Token und Passwort.
- Nach erfolgreichem Setzen des Passworts kann sich der Nutzer über `/login` anmelden.

## Password-Reset-Flow

- Nutzer fordert über `/forgot-password` einen Reset an (`POST /auth/reset-request`).
- Er erhält einen Link `/reset/{token}` per E-Mail.
- Auf der Reset-Seite setzt der Nutzer ein neues Passwort; das Frontend sendet `POST /auth/reset` mit Token und Passwort.
- Nach erfolgreichem Reset kann sich der Nutzer mit dem neuen Passwort anmelden.

UX/Leistung:

- Flüssige Interaktionen bei großen Datenmengen (Server-seitige Filter/Pagination, Streaming/Infinite Scroll).
- Tastaturkürzel, Batch-Workflows, Undo.
  - Navigation mit Pfeiltasten (\u2190/\u2192) und Auswahl aller Fotos per `A`.
  - Letzte Batch-Zuweisung l\u00e4sst sich mit `Ctrl+Z` r\u00fcckg\u00e4ngig machen.
