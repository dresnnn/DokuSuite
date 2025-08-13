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
- Bulk-Operationen: Multi-Select, Zuweisen, Ausblenden, Curate-Flag, Re-Matching, Export.
- Mehrfachauswahl im Grid/Table mit Auftragszuweisung via `POST /photos/batch/assign`.
- Kundenfreigaben: Links (ablaufbar), Kunden-Login, ZIP- und Excel-Export, PDF-Report, Karten-Sharing.
- Freigabeverwaltung: bestehende Shares paginiert listen (`page`/`limit`), neue Links mit Ablaufdatum (`expires_at`) und Wasserzeichen-Policy (`watermark_policy`) erzeugen, Widerruf über `POST /shares/{id}/revoke`; die generierte URL wird nach Erstellung angezeigt.
- Export-Workflow: Export-Jobs der aktuellen Sitzung lokal verfolgen, ZIP- und Excel-Exporte anstoßen (`POST /exports/zip`, `POST /exports/excel`), Status via Polling aktualisieren (`GET /exports/{id}`) und Download-Link bei abgeschlossenen Jobs (`status=done`).
- Nutzer-/Rollenverwaltung; Einladungslinks, Passwort-Reset, 2FA (später).
- Auftragsverwaltung: Aufträge listen, nach Kunde und Status filtern sowie neue Aufträge anlegen.
- Standortpflege: Standorte suchen (`q`, `near`, `radius_m`), paginiert listen und Name, Adresse oder Aktivstatus bearbeiten (`PATCH /locations/{id}`).
- Foto-Detailseite zur Bearbeitung von Metadaten (`quality_flag`, `note`, ...)
    über `PATCH /photos/{id}`.
- Authentifizierung via Token: Browser speichert das Token und sendet es bei jeder API-Anfrage als `Authorization: Bearer <token>`.
- `AuthContext` verwaltet Loginstatus und Token im Frontend.
- `AuthGuard` schützt Seiten und leitet nicht authentifizierte Nutzer auf `/login`.
- Logout löscht das Token und navigiert zu `/login`.
 - Navigationsleiste mit Links zu `Photos`, `Users`, `Orders`, `Shares` und `Exports`.
- Branding/Wasserzeichen-Policy je Kunde/Share (Agenturkunden i. d. R. ohne Wasserzeichen).

## Kunden-Flow
- Kunde öffnet einen Freigabe-Link `/public/{token}`.
- Die Galerie lädt die Fotos des Auftrags und ruft für jedes Bild `/public/shares/{token}/photos/{id}` auf.
- Der Kunde kann einzelne Fotos auswählen und ZIP- (`POST /exports/zip`) oder Excel-Exporte (`POST /exports/excel`) starten; der Status wird über Polling von `/exports/{id}` aktualisiert.

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

UX/Leistung:
- Flüssige Interaktionen bei großen Datenmengen (Server-seitige Filter/Pagination, Streaming/Infinite Scroll).
- Tastaturkürzel, Batch-Workflows, Undo.
