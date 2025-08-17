# Web-Tool – Anforderungen

Hauptnutzergruppen:

- Verwaltung/Team: Prüfung, Korrektur, Zuordnung, Exporte, Freigaben.
- Kunden: Einsicht in freigegebene Aufträge, Download (falls erlaubt), Karten/Excel.
- Plakatierer (optional): Eigene Uploads sichten, Status einsehen.

Kernfunktionen:

- Galerie mit schneller Filterung (Plakatierer, Woche, Standort, Modus, Qualität, Auftrag, Kunde, Zeitraum, Status) sowie spezifischen Parametern `from`, `to`, `orderId`, `status`, `siteId`, `calendarWeek`, `qualityFlag`, `customerId`. Weitere Seiten werden beim Scrollen automatisch über einen `IntersectionObserver` nachgeladen (`page`/`limit`-basiertes Infinite Scroll).
- Kartenansicht mit Leaflet, lädt `/photos?bbox=` abhängig vom Kartenausschnitt,
  clustert Marker und erlaubt Standortkorrektur per Drag-and-Drop
  (`PATCH /photos/{id}` aktualisiert die Koordinaten).
- Leaflet-Styles (`leaflet/dist/leaflet.css`, `leaflet.markercluster/dist/MarkerCluster.css`) müssen eingebunden werden.
- Bulk-Operationen: Multi-Select, Zuweisen (`POST /photos/batch/assign`), Ausblenden (`POST /photos/batch/hide`), Curate-Flag (`POST /photos/batch/curate`), Re-Matching (`POST /photos/batch/rematch`), Export ausgewählter Fotos als ZIP/Excel/PDF (`POST /exports/zip`, `POST /exports/excel`, `POST /exports/pdf`).
- Mehrfachauswahl im Grid/Table mit Auftragszuweisung via `POST /photos/batch/assign`; weitere Batch-Aktionen über `POST /photos/batch/hide`, `POST /photos/batch/curate` und `POST /photos/batch/rematch`.
- Kundenfreigaben: Links (ablaufbar), Kunden-Login, optionaler Download je Freigabe (`download_allowed`), ZIP-, Excel- und PDF-Export (`POST /exports/zip`, `POST /exports/excel`, `POST /exports/pdf`), Karten-Sharing.
- Freigabeverwaltung: bestehende Shares paginiert listen (`page`/`limit`), optional nach Auftrag filtern (`orderId`), Seitenwechsel über `Prev`/`Next`-Buttons mit Gesamtseitenzahl aus `total` und `limit`, neue Links mit Ablaufdatum (`expires_at`, UTC im RFC3339-Format), Download-Erlaubnis (`download_allowed`), Wasserzeichen-Policy (`watermark_policy`) und optional benutzerdefiniertem Wasserzeichen-Text (`watermark_text`) bei `watermark_policy=custom_text` erzeugen, Widerruf über `POST /shares/{id}/revoke`; die generierte URL wird nach Erstellung angezeigt und kann per "Copy"-Button in die Zwischenablage kopiert werden. Nach Eingabe der Auftrags-ID werden `GET /orders/{id}` und `GET /customers/{customer_id}` aufgerufen, um die Wasserzeichen-Voreinstellungen des Kunden automatisch zu übernehmen.
- Export-Workflow: Export-Jobs der aktuellen Sitzung lokal verfolgen und in `localStorage` persistieren, ZIP-, Excel- und PDF-Exporte der ausgewählten Fotos anstoßen (`POST /exports/zip`, `POST /exports/excel`, `POST /exports/pdf`), Status via Polling aktualisieren (`GET /exports/{id}`) und Download-Link bei abgeschlossenen Jobs (`status=done`). ZIP-Exporte unterstützen optional einen Titel (`title`) sowie die Einbindung von EXIF-Daten (`includeExif`).
- Nutzer-/Rollenverwaltung: Nutzer paginiert listen (`page`/`limit`) mit Seitenwechsel über `Prev`/`Next`-Buttons; Einladungslinks, Passwort-Reset, 2FA.
- Auftragsverwaltung: Aufträge listen, nach Kunde und Status filtern, neue Aufträge anlegen sowie Details ansehen, den Status bearbeiten und Exporte als ZIP, Excel oder PDF starten (`GET /orders/{id}`, `PATCH /orders/{id}`, `POST /exports/zip`, `POST /exports/excel`, `POST /exports/pdf`).
- Standortpflege: Standorte suchen (`q`, `near`, `radius_m`), paginiert listen und Name, Adresse oder Aktivstatus bearbeiten (`PATCH /locations/{id}`).
- Foto-Detailseite zur Bearbeitung von Metadaten (`quality_flag`, `note`, ...)
  über `PATCH /photos/{id}` und Korrektur des Standorts per Karte
  (Marker-Drag mit `PATCH /photos/{id}` aktualisiert die Koordinaten).
- Foto-Upload: Browser fordert über `POST /photos/upload-intent` eine signierte URL an und lädt die Datei direkt hoch. Nach erfolgreichem Upload erscheint ein Erfolgs-Toast, bei Fehlern ein Fehler-Toast.
- Authentifizierung via Token: Browser speichert das Token und sendet es bei jeder API-Anfrage als `Authorization: Bearer <token>`.
- `AuthContext` verwaltet Loginstatus und Token im Frontend.
- `AuthGuard` schützt Seiten und leitet nicht authentifizierte Nutzer auf `/login`.
- Öffentliche Seiten ohne Login: `/login`, `/register`, `/forgot-password`, `/reset`, `/accept`, `/public`, `/2fa/verify`.
- Admin-Seiten (`Users`, `Shares`, `Locations`) sind nur für Nutzer mit `role === 'ADMIN'` zugänglich und leiten sonst auf `/photos` weiter.
- Logout löscht das Token und navigiert zu `/login`.
- Bei abgelaufener Sitzung (HTTP 401) löscht das Frontend das Token und leitet automatisch auf `/login` weiter.
- Registrierung neuer Nutzer über Formular (`POST /auth/register`), leitet nach erfolgreicher Registrierung zu `/login`.
- Navigationsleiste nur für eingeloggte Nutzer mit Links zu `Photos`, `Orders` und `Exports`; Admins sehen zusätzlich `Users`, `Shares` und `Locations`.
- Branding/Wasserzeichen-Policy je Kunde/Share (Agenturkunden i. d. R. ohne Wasserzeichen).

## Profilverwaltung

- Nutzer können ihr Passwort ändern (`POST /auth/change-password`).
- Zwei-Faktor-Authentifizierung kann aktiviert (`POST /auth/2fa/setup`) oder deaktiviert (`DELETE /auth/2fa`) werden.
- Nach Deaktivierung der 2FA wird der Nutzer ausgeloggt und muss sich erneut anmelden.

## Kundenverwaltung

- Kunden paginiert listen (`GET /customers`).
- Neue Kunden anlegen (`POST /customers`).
- Kunden bearbeiten (`PATCH /customers/{id}`) und löschen (`DELETE /customers/{id}`).

## Login-Flow

- Nutzer meldet sich auf `/login` mit E-Mail und Passwort an.
- Bei erfolgreicher Anmeldung speichert das Frontend das Token und leitet automatisch zur Galerie `/photos` weiter.

## Kunden-Flow

- Kunde öffnet einen Freigabe-Link `/public/{token}`.
- Bei ungültigem Token erscheint die Fehlermeldung „Freigabe nicht gefunden“ und es wird ein leeres UI angezeigt.
- Die Galerie lädt die Fotos inklusive URLs direkt über `/public/shares/{token}/photos`; keine Einzelrequests pro Bild.
- Der Kunde kann einzelne Fotos auswählen und ZIP-, Excel- oder PDF-Exporte (`POST /exports/zip`, `POST /exports/excel`, `POST /exports/pdf`) starten; der Status der Export-Jobs wird im UI angezeigt, über Polling von `/exports/{id}` aktualisiert und bei `status=done` als Download-Link bereitgestellt. Beim ZIP-Export kann zusätzlich ein Titel angegeben und die Einbindung von EXIF-Daten aktiviert werden (`title`, `includeExif`).
- Export-Buttons werden nur angezeigt, wenn die Freigabe Downloads erlaubt (`download_allowed=false` blendet sie aus).
- Zusätzlich kann der Kunde eine Kartenansicht aufrufen, die Fotos abhängig vom Kartenausschnitt über `/public/shares/{token}/photos?bbox` lädt.

## Invite-Flow

- Ein Administrator lädt einen Nutzer über `POST /auth/invite` ein.
- Der Nutzer erhält einen Link `/accept/{token}`.
- Auf der Accept-Seite setzt der Nutzer ein neues Passwort; das Frontend sendet `POST /auth/accept` mit Token und Passwort.
- Ist der Token ungültig oder abgelaufen, erhält der Nutzer eine Fehlermeldung und wird auf `/login` weitergeleitet.
- Nach erfolgreichem Setzen des Passworts kann sich der Nutzer über `/login` anmelden.

## 2FA-Flow

- Nutzer generiert auf `/2fa/setup` ein TOTP-Secret (`POST /auth/2fa/setup`).
- Beim Login ohne gültiges 2FA-Token liefert `/auth/login` einen `challenge_token`.
- Der Nutzer wird zu `/2fa/verify` geleitet und sendet `POST /auth/2fa/verify` mit `challenge` und Einmalcode.
- Bei erfolgreicher Verifizierung erhält der Browser wie gewohnt ein JWT (`access_token`).
- Nach der Verifizierung leitet das Frontend zur Galerie `/photos` weiter.
- Setup und Verifizierung bestätigen Erfolg oder Fehler über Toast-Feedback.

## Invite-Flow

- Ein Administrator lädt einen Nutzer über `POST /auth/invite` ein.
- Der Nutzer erhält einen Link `/accept/{token}`.
- Auf der Accept-Seite setzt der Nutzer ein neues Passwort; das Frontend sendet `POST /auth/accept` mit Token und Passwort.
- Ist der Token ungültig oder abgelaufen, erhält der Nutzer eine Fehlermeldung und wird auf `/login` weitergeleitet.
- Nach erfolgreichem Setzen des Passworts kann sich der Nutzer über `/login` anmelden.

## Password-Reset-Flow

- Nutzer fordert über `/forgot-password` einen Reset an (`POST /auth/reset-request`).
- Er erhält einen Link `/reset/{token}` per E-Mail.
- Auf der Reset-Seite setzt der Nutzer ein neues Passwort; das Frontend sendet `POST /auth/reset` mit Token und Passwort.
- Ist der Token ungültig oder abgelaufen, erhält der Nutzer eine Fehlermeldung und wird auf `/login` weitergeleitet.
- Nach erfolgreichem Reset leitet das Frontend auf `/login` weiter und zeigt einen Erfolgs-Toast an; anschließend kann sich der Nutzer mit dem neuen Passwort anmelden.

## Plakatierer-Flow

- Nutzer mit Rolle `USER` sehen im Web-Tool ausschließlich ihre eigenen Uploads.
- Das Frontend setzt `uploaderId` automatisch auf die eigene `userId` und blendet den Filter im Fotoformular aus.

UX/Leistung:

- Flüssige Interaktionen bei großen Datenmengen (Server-seitige Filter/Pagination, Streaming/Infinite Scroll).
- Tastaturkürzel, Batch-Workflows, Undo.
  - Navigation mit Pfeiltasten (\u2190/\u2192) und Auswahl aller Fotos per `A`.
  - Letzte Batch-Zuweisung l\u00e4sst sich mit `Ctrl+Z` r\u00fcckg\u00e4ngig machen.

## Fehler-/Statusmeldungen

- Zentrale Toast-Komponente f\u00fcr Erfolg- und Fehlermeldungen.
- `AuthGuard` informiert \u00fcber fehlende Berechtigungen oder nicht eingeloggte Nutzer.
- Seiten wie `Register`, `Forgot Password`, `Accept`, `Profile`, `Photos`, `Orders` (inkl. Detailseiten), `Shares`, `Users`, `Customers` und `Locations` zeigen Ergebnis von API-Aktionen über Toasts an (z. B. Einladungen oder Rollenänderungen, Kundenanlage/-aktualisierung, Standort-Updates).
