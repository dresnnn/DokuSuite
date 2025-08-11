# Zielbild & Leitplanken

**Ziele**

- Max. Transparenz für Kunden (Galerie, Karte, Exporte) bei min. internem Aufwand.
- Weitgehend **automatisierte Zuordnung von Fotos zu Standorten**; **keine automatische Zuordnung zu Aufträgen im MVP** (später optional via KI/Heuristiken).
- Offline-first für iOS, robuste Uploads, revisionssichere Historie.
- Saubere Trennung zwischen Stammdaten (Ninox) und operativer Bild-/Nachweisdatenbank.
- Zukunftsfähig (erweiterbar, skalierbar, auditierbar) bei moderater Komplexität.

**Nicht-Ziele (initial)**

- Kein KI-Overkill von Beginn an (Qualitätserkennung optional/„Phase 3“).
- Keine Big-Bang-Ablösung aller bestehenden Prozesse am Tag 1 (sanfte Migration).

---

# Nutzer & Rollen

- **Admin (Stadtbild)**: Systemeinstellungen, Benutzerverwaltung, Rechte, Datenimporte.
- **Disposition/Innendienst (Stadtbild)**: Review, Bulk-Zuordnung, Korrekturen, Exporte, Kundenfreigaben.
- **Plakatierer (intern)**: iOS-App, Uploads, eigene Historie.
- **Subunternehmer**: iOS-App, Uploads, eingeschränkter Zugriff (nur eigene Einsätze).
- **Kunde**: Zugriff auf freigegebene Aufträge (Galerie, Karte, ZIP, Excel, PDF).
- **Controlling/Management**: Lesezugriff auf KPIs/Reports.

**Rechteprinzip**

- Mandantentrennung auf Auftrag/Kunde-Ebene, Row-Level-Access.
- Getrennte Rollen für Plakatierer vs. Auftragssicht.
- Revisionssichere Audit-Logs für Änderungen (Wer? Was? Wann? Alt/Neu).

---

# End-to-End Use Cases (High Level)

1. **Eigener Standort – Standardwoche**: Plakatierer wählt Modus „fester Standort“, Foto → App matcht nächstgelegenen Standort (Cache), Nutzer bestätigt/korrektiert → Upload → Disposition prüft (optional) → Auftrag-Autoverknüpfung nach Regeln → Kunde sieht Nachweis.
2. **Nicht-fester Standort (Laternen)**: Modus „mobil“, Foto → Reverse Geocoding (Straße/Ort), optionale Metadaten (Laternen-ID/Notiz) → Upload → Disposition bündelt und ordnet Auftrag zu → Kunde.
3. **Bulk-Zuordnung**: Disposition filtert Fotos (Zeitfenster/Plakatierer/Region/Qualität) → Multi-Select → einem Auftrag zuordnen (mit Auto-Vorschlägen).
4. **Korrektur**: Standort/Belegungswoche korrigieren (Einzelfoto oder Stapel), Historie bleibt nachvollziehbar.
5. **Kundenportal**: Auftrag freigeben → Kunde erhält Einladungslink/Magic Link → Galerie/Karte/ZIP/Excel/PDF → Zugriff und Downloads werden protokolliert.
6. **Best-of/Marketing**: Markierung „besonders gut“, optionaler Export in einen separaten Pool (Freigabestatus).

---

# iOS-App – Funktionskonzept

**Kernfunktionen**

- Eigene Kamera-UI (HEIC/JPEG), Serienaufnahmen, Autofokus/Belichtungs-Feedback.
- **Standort-Handling**: On-demand „Standort aktualisieren“-Trigger (requestLocation), Anzeige Genauigkeit (horizontalAccuracy), optional Kompass/Heading.
- **Modi**: „Fester Standort“ vs. „Mobil (Laternen)“.
- **Matching auf dem Gerät**: Standort-Cache (Standorte, Medien), Kandidatenliste nach Distanz/Genauigkeit, Map-Vorschau, manuelle Auswahl/Override.
- **Metadaten** pro Foto: Timestamp (lokal), GPS (Lat/Lon/Acc), Modus, Device-ID, Plakatierer-ID, optional Notiz, Standort-ID (falls gewählt), Belegungswoche (App-Vorschlag), Qualitäts-Flag (optional).
- **Upload**: Hintergrund-Uploads (URLSession background), automatische Wiederholung bei Abbruch, Deduplizierung (Client-UUID + Hash), Statusanzeige, Offline-Queue.

**Stabilität & UX**

- Klare Zustände: „im Gerät“, „wartet auf Upload“, „hochgeladen“, „serverseitig verarbeitet“.
- Schnelle Candidate-Picker (Liste + Karte), bevorzugt Einhandbedienung.
- Datenschutz: Keine Fotos lokal nach Upload behalten (optional konfigurierbar).

**Sicherheit**

- OAuth2/OIDC mit PKCE, Tokens im Keychain, gerätebezogene Registrierung.
- Signierte Upload-URLs (kurzlebig), TLS-only.
- **Verteilung/MDM**: Geräteverwaltung und App-Verteilung über **JAMF** (MDM).

---

# Web-Tool – Funktionskonzept

**UI-Muster**

- Drei Hauptansichten: **Galerie**, **Tabelle**, **Karte** (umschaltbar). Persistente Filter. Gespeicherte Sichten.
- Schnelle Multi-Select-Interaktionen (Shift/Strg), Bulk-Aktionen (Zuordnen, Markieren, Verwerfen, Export).
- Foto-Detail: Metadaten, Karte, Historie, Kommentare, Quick-Actions.

**Filter**

- Zeitraum/Belegungswoche, Plakatierer/Subunternehmer, Modus, Standort/Region, Kunde/Auftrag, Qualität, Genauigkeit, Duplikate, „best-of“.

**Prozesse**

- **Review**: Automatische Qualitäts-/Duplikats-Hinweise, schnelles Bestätigen/Korrigieren.
- **Zuordnung**: Auto-Vorschläge anhand gebuchter Standorte je Auftrag/Woche, manueller Bulk-Override möglich.
- **Korrekturen**: Standort/Belegungswoche änderbar (stapelweise), Vollhistorie.
- **Kundenfreigabe & -Zugriff**: **Einladungslinks** (zeitlich begrenzt) **und** klassische **Accounts** (Passwort/2FA). Regelmäßig buchende Kunden sehen ihre Historie; Einmalkampagnen per Magic Link. **Wasserzeichen** pro Kunde/Share konfigurierbar (Endkunde mit, Agentur ohne), gebrandete Ansicht.
- **Exporte**: ZIP (strukturierte Dateinamen), **Excel** (Standortliste + Metadaten), **PDF-Report** (Deckblatt, Kennzahlen, Karte, Auswahl an Bildern), **Karten-Link**.

**Benutzerverwaltung**

- Rollen & Rechte, Einladungen (E-Mail/Magic Link), Subunternehmer-Gruppen, Kundensichten pro Auftrag.

---

# Architekturvorschlag (Server)

**Ansatz**: **Modularer Monolith** (klar getrennte Domänenmodule) + asynchrone Worker. So einfach wie möglich, so modular wie nötig.

**Komponenten**

- **API/Backend**: Python (z. B. FastAPI), REST (später optional GraphQL für reichhaltige Clients).
- **DB**: PostgreSQL + **PostGIS** (Geodaten, Distanzabfragen, Geofences, Geohash).
- **Object Storage**: **Hetzner Object Storage (S3-kompatibel)** für Originale & Varianten (Thumbnails, Wasserzeichen, PDF-Reports); Kosten skalieren nutzungsbasiert.
- **Queue/Cache**: Redis (Job-Queue, Rate-Limits, Caching von Reverse-Geocoding und Ninox-Deltas).
- **Worker**: Bildverarbeitung (Thumbnails, Orientierung, Hashing), Matching, Exporte, Geocoding, Report-Generierung.
- **Reverse Proxy**: Nginx (TLS, Caching statischer Varianten, Range-Requests).
- **Auth**: **Interne Benutzerverwaltung im Backend** (Passwort, 2FA, Einladungen) als Standard. **Optionale** spätere Anbindung an AD/LDAP/SSO (UCS/Authentik) via OIDC/SAML, wenn benötigt. Rollen-/Rechteprüfung im Backend.

**Warum PostGIS?**

- Schnelle „nächstgelegener Standort“-Abfragen (ST\_DWithin, KNN-Index), robuste Geometrie-Prüfungen.

**Datenfluss (vereinfacht)**

1. App lädt Foto + Metadaten → Upload-Endpunkt (signiert) → Object Store.
2. Event → Worker: Hashing/Dedupe → EXIF/IPTC lesen → Matching (Standort) → Reverse Geocoding (bei „mobil“) → Belegungswoche berechnen → Thumbnails → DB schreiben.
3. Optional: Auto-Zuordnung zu Auftrag (Regeln), sonst „Zu prüfen“.
4. Web-Tool bedient sich via API, Exporte/Reports als asynchrone Jobs.

**Skalierung**

- Erwartung: 1.500 Fotos/Woche × \~3 MB ≈ **4,5 GB/Woche** → \~**234 GB/Jahr** → \~**1,17 TB/5 Jahre** (+ Varianten/Backups ≈ 20–30 %).
- Horizontal skalierbare Worker, Objekt-Storage wächst linear.

---

# Datenmodell (logisch, Auszug)

- **customer** (id, name, …)
- **order** (id, customer\_id, name, start/end, status)
- **order\_item** (id, order\_id, media\_unit\_id, weeks/bookings)
- **location** (id, name, lat, lon, geog, geohash, radius, city, street,…)
- **media\_unit** (id, location\_id, format, seitennummer/fläche, status)
- **photo** (id, object\_key, taken\_at, device\_id, uploader\_id, mode, lat, lon, accuracy, heading, hash, quality\_score, is\_duplicate, best\_of, raw\_exif)
- **photo\_location** (photo\_id ↔ location\_id, distance, selected\_by [auto/user], confidence)
- **assignment** (photo\_id ↔ order\_id, week, assigned\_by, assigned\_at)
- **user** (id, role, supplier\_id?, customer\_id?)
- **supplier** (id, name) / **installer** (id, user\_id, supplier\_id)
- **share** (id, order\_id, audience, expires\_at, watermark, download\_allowed)
- **audit\_log** (entity, entity\_id, action, before, after, actor\_id, ts)

**Indizes/Technik**

- GIST auf `location.geog` (KNN), GIN auf Volltextfeldern, Partial-Indizes für „offene“ Aufgaben.
- Eindeutigkeit: `photo.hash` (uniq), `device_id + client_uuid` (uniq).

**Datenmodell – Ergänzungen (Beschlüsse)**

- `photo` ↔ `order`: **n****:m** bleibt, ein Foto kann **mehrere Aufträge** abdecken.
- `share`: Erweiterung um `watermark_policy` (z. B. `none|default|custom_text`) und `branding_theme`.
- `customer`: Flag `is_agency` für Standard-Wasserzeichen-Policy.
- `order`: Felder für Vor-/Nachklebetage (Override globaler Regel).
- `settings`: globale Defaults (z. B. Standard-Radius 50 m, Belegungsregel).

---

# Geschäftslogik & Regeln

**Belegungswoche (DE, Europe/Berlin)**

- Grundregel: **Montag = Start der Belegungswoche**.
- **Vor-/Nachklebetag**: Samstag/Sonntag für Woche *t+1* erlaubt → **Sonntag zählt standardmäßig zur Folgewoche** (übersteuerbar pro Foto/Job).
- Randfälle (Feiertage, Sonderfreigaben) als Konfiguration je Auftrag.
- **Regel** global definierbar und **je Auftrag überschreibbar**.

**Matching-Logik (feste Standorte)**

- Kandidaten = Standorte im **fixen Standard-Radius 50 m** (konfigurierbar).
- Score = f(Distanz, GPS-Genauigkeit, Historie des Auftrags, zuletzt belegte Fläche). Top-1 auto, Top-3 zur manuellen Auswahl bei Unsicherheit.

**Mobil (Laternen)**

- Reverse Geocoding (Straße/Hausnr./PLZ/Ort), Caching, Limitkontrolle.
- Optional: Eingabe „Mast-Nr.“/Notiz.

**Qualität & Duplikate**

- Heuristiken (optional, später): Schärfe, Belichtung, Blickwinkel, Verdeckung (einfach).
- **Duplikaterkennung: Hash-only** nach Normalisierung (Orientierung/EXIF-Strips). Mehrere Fotos am selben Standort/Zeitraum sind **nicht** automatisch Duplikate.
- Flag „schlecht ausblenden“/„best-of“ für Marketing.

---

# Integrationen

**Ninox (Master für Stammdaten)**

- Pull-Sync: Standorte, Medien, Aufträge, Lieferanten, Kunden via REST.
- Delta-Strategie (updated\_at), Konflikte protokollieren, Validierung vor Import.
- IDs stabil spiegeln (Mapping-Tabelle), nur lesend aus Ninox (initial).

**Maps & Geocoding**

- **Zunächst ausschließlich Google Maps** (beste Abdeckung, bereits im Einsatz). Caching + Backoff.
- Evaluierung alternativer Anbieter (Mapbox/OSM) nur bei Bedarf in späterer Phase.

**Benachrichtigungen**

- **E-Mail** (Freigaben, Exporte fertig). Slack/Webhooks später optional.

---

# Sicherheit, Datenschutz, Compliance

- **Datenschutz**: Aufbewahrungsfristen pro Kunde/Auftrag, Löschkonzepte, DSGVO-Auskunft/Export.
- **Anonymisierung**: Optionales Verwischen von Gesichtern/Nummernschildern (batch, konfigurierbar, Watermark in Portal).
- **Transport/At Rest**: TLS, Server-Side-Encryption im Object Store, verschlüsselte DB-Backups.
- **Least Privilege**: Service-Accounts, Secret-Management, regelmäßige Rotation.
- **Audits**: Vollständige Nachverfolgbarkeit aller Änderungen und Zugriffe (auch Kunden-Downloads).

---

# Betrieb & Monitoring

- **Deployment**: Ubuntu 22.04, Docker/Compose, Nginx, systemd.
- **Observability**: Metriken (Prometheus/Grafana), Logs (ELK/OpenSearch), Tracing (optional).
- **Backups**: DB Point-in-Time Recovery, Object-Store-Replikation (andere Platte/Standort), regelmäßige Restore-Tests.
- **DR**: RPO/RTO-Ziele definieren; Runbooks.

---

# Roadmap (phasenweise, ohne Zeitangaben)

**Phase 1 – MVP Kernfluss**

- iOS: Aufnahme + Offline-Queue + Upload, Standort-Cache, einfacher Candidate-Picker.
- Backend: Ingestion, Hashing/Dedupe, Matching, Belegungswoche, Thumbnails.
- Web: Galerie/Tabelle, Filter Basis, manuelle/bulk Zuordnung, Exporte (Excel/ZIP), Einladungen.
- Ninox: Einweg-Sync (Stammdaten Pull).

**Phase 2 – Kundenportal & Karten**

- Kartenansicht, Freigaben/Magic Links, PDF-Report, gebrandete Portale.

**Phase 3 – Automation & Qualität**

- Einfache Qualitätsmetriken, Duplikaterkennung UI; **optionale** (niedrig priorisierte) KI-gestützte Vorschläge zur Auftrag-Zuordnung (später evaluieren).

**Phase 4 – Reporting & Skalierung**

- KPI-Dashboards, Archiv/Retention, optimierte Caches/CDN, optionale SSO/2FA.

---

# Beschlüsse (10.08.2025)

1. Radius: **50 m** fix (konfigurierbar).

2. Vor-/Nachklebetag: global + **pro Auftrag** übersteuerbar (Sonntag zählt zu Folgewoche bei Start Mo).

3. Storage: **Hetzner S3-kompatibler Object Storage**.

4. Karten: **zunächst nur Google Maps**.

5. Freigabe: **Magic Links und Accounts** (Passwort/2FA); **Wasserzeichen** je Kunde/Share steuerbar (Agentur i. d. R. ohne).

6. Duplikate: **Hash-only** (keine Distanz/Zeit-Heuristik).

7. App-Verteilung: über **JAMF** (MDM).

8. **Agentur-Erkennung**: zunächst **manuell** in DokuSuite (Flag je Kunde).

9. **Telekom-Daten**: **Tabelle X ignorieren** (wird entfernt); maßgeblich ist `Telekom-Kasten-ID` in **K.Objekte**.

10. **Laternen-IDs**: kein Pflichtfeld; optionales Freitextfeld in iOS, Speicherung nur in DokuSuite.

11. **Belegungstermine (HC/IC)**: **nicht** gesynct; ableitbar aus Auftragspositionen (NB).

---

# Risiken & Gegenmaßnahmen

- **Schwankende GPS-Qualität** → App-Trigger + Genauigkeitsanzeige + Mindest-Acc-Filter + manuelle Korrektur.
- **Offline-Phasen** → robuste Queue, idempotente Uploads, klare Status.
- **Daten-/Zugriffsfehler** → strikte Rechteprüfung, Staging-Umgebung, Audit-Logs, Backups.
- **API-Kosten (Geocoding/Maps)** → Caching, Batch-Verarbeitung, Kostengrenzen/Alerts.
- **Change Management** → Schulung, Pilotbetrieb mit 2–3 Teams, paralleler iCloud-Fallback im Notfall.

---

# KPIs (Erfolgsmessung)

- Anteil automatisch zugeordneter Fotos (%).
- Zeit von Upload bis Kundenfreigabe (Median).
- Manuelle Korrekturen pro 1.000 Fotos.
- Kundennutzung: Portal-Logins, Downloads, Kartenaufrufe.
- Kosten/Foto (Speicher, Geocoding, Betrieb).

---

# Nächste Schritte (Vorschlag)

- 1–2 Workshops zur Fein-Spezifikation (Regeln Belegungswoche, Matching-Radius, Exporte, Freigaben).
- Abgleich Datenmodell vs. bestehende Ninox-Felder (IDs, Felder, Pflichtattribute).
- Prototyp-Plan: kleine Feldstudie mit 1–2 Plakatier-Teams, Standort-Typen mixen (eigene/mobil).
- Sicherheits- & Datenschutzkonzept finalisieren (Löschfristen, Einwilligungen, AV-Verträge).

---

# Ninox ↔ DokuSuite Mapping & Sync-Spezifikation (Entwurf)

## Leitlinien

- **Ninox = Stammdaten-Master** (Kunden, Aufträge, Standorte/Medien, Netze/Slots, Adressen, Personen). DokuSuite ist **read-only** ggü. Ninox; kein Writeback in Phase 1.
- **Idempotente Upserts** anhand stabiler **Ninox-Record-IDs**. Mapping-Tabelle `ext_ref` (source=`ninox`, table, record\_id, local\_id, etag/hash, synced\_at).
- **Delta-Sync**: bevorzugt per Ninox-Änderungsmarker (falls verfügbar), sonst periodischer Pull + Feld-Hash-Vergleich. Weiche Löschungen (inaktiv statt hard delete).
- **PII-Minimierung**: Nur felder ziehen, die für Beleg-/Nachweisdoku nötig sind. Besonders schützensame Felder (IBAN, Steuer-ID, SV-Nummer etc.) **nicht** syncen.
- **Geodaten**: Wo vorhanden, präferiere numerische Lat/Lon; `location`-Felder als Fallback. Normalisierung in WGS84.

## Tabellen-Mapping (Auszug)

### Kunden (E) → `customer`

- **id**: Ninox-Record-ID (ext\_ref)
- **name**: `Firma` (B) ∥ `Vorname`+`Name`
- **address\_default**: `Straße + Hausnummer` (F), `PLZ` (G), `Ort` (H), `Land` (Q2)
- **contacts**: via `Kontakte` (JC) / `Kunden-Kontakte` (MC) – nur lesend
- **status**: `Kundenstatus` (K1) → Enum („lead“, „active“, …)
- **is\_agency (bool)**: Standard **false**, manuell pflegbar in DokuSuite; optional Ableitung über `Branche` (Z1) später
- **billing\_prefs**: `Zahlungsbedingungen` (G2)
- **notes**: `Bemerkungen` (F2) / `Notizen` (V1)
- **watermark\_policy\_default**: neu (DokuSuite); Agenturkunden i. d. R. „none“

### Adressen (MB) → `address`

- **customer\_id**: Ref E
- **type**: `Rechnungsanschrift`/`Lieferanschrift`/Standard-Flags
- **street, plz, city, company, person**: (A,B,C,D,M,P,F)

### Aufträge (Q) → `order`

- **id**: Ninox-Record-ID
- **customer\_id**: Ref E
- **name**: `Projektname` (A)
- **status**: `Status` (H) → Enum („reserved“, „booked“, „cancelled“)
- **service\_period**: `Leistungszeitraum Beginn/Ende` (B2/C2) (Fallback: `Auftrags-Datum` M1)
- **customer\_po**: `Bestellnummer beim Kunden` (V)
- **project\_no\_client**: `Projekt-Nummer beim Kunden` (U)
- **address\_override**: Ref `Adressen` (P1) + Inline Felder (R1..Y1)
- **flags**: Druck/Versand/Abrechnung (J,K,L,O,P,R) – nur Anzeige
- **notes**: `Notizen/Projektverlauf` (N3) (nicht für Kundenportal)

### Auftragspositionen (NB) → `order_item`

- **id**: Ninox-Record-ID
- **order\_id**: Ref Q
- **title/description**: `Bezeichnung` (C) / `Beschreibung` (E1)
- **quantity**: `Anzahl` (B)
- **format**: `Formatgröße` (K1) → Enum (`A1`, `A0q`, `4/1`, `8/1`, …)
- **period**: `Belegungsbeginn/ende` (Y/A1) ∥ `Leistungsdatum` (B1)
- **unit\_price**: `Einzelpreis` (W) (Netto), Rabatte (G,N) als Metadaten
- **article\_ref**: `Artikel` (R) / `Artikelnummer` (D)
- **slots\_link**: via Slots (P.G) (optional)

### Objekte (K) → `location`

- **id**: Ninox-Record-ID
- **name**: `Bezeichnung` (A)
- **street/zip/city**: (B,C,F) + `Ort` (P) optional
- **lat/lon**: primär `Breitengrad` (R1) / `Längengrad` (S1); Fallback `GPS` (G)
- **active**: `aktiv` (E)
- **media\_types**: `Medien-Arten` (X)
- **notes**: `Notizen` (F) / `Standortbeschreibung` (E1)
- **telekom**: `Telekomschaltkasten` (F2) + `Telekom-Kasten-ID` (H2)
- **owner/contract**: `Vertrag/Vereinbarung` (H) + `Vertragspartner` (D2)
- **tour\_id**: Ref `Tour` (T)

### Medien (L) → `media_unit`

- **id**: Ninox-Record-ID
- **location\_id**: Ref K
- **format**: `Medium` (D) → Enum (`A1`, `4/1`, …)
- **last\_occupied\_at**: `letzte Belegung` (L)
- **last\_creative**: `Motiv letzte Belegung` (M)
- **notes/indices**: (P,N,O,Q) – interne Felder

### Netze (M) → `network` (optional, Gruppierung)

- **id**: Ninox-Record-ID, **name** (A), **city** (I), **type** (M), **target\_units** (J)

### Slots (P) → `network_slot`

- **id**: Ninox-Record-ID, **network\_id** (D), **begin/end** (A/B)
- **linked\_order\_item**: Ref NB (G) (wenn belegt)

### Touren (R) / Routen (PB) → `route`/`route_stop`

- **route**: id, name (A), owner (H)
- **stop**: name (B), address (C–E), lat/lng (G/H), route\_ref (F)
- **location ↔ route**: via K.T

### Mitarbeiter (H) / Personen (WC) → `installer`

- **Quelle**: *WC.Personen* als primär (Typ=„Mitarbeiter/in“/„Subunternehmer/in“); H (Mitarbeiter) nur für HR, **nicht** syncen von Bank-/SV-/Steuer-Feldern.
- **felder**: Name, Vorname, E-Mail, aktiv.

### Schaltkästen Telekom (X) – **nicht mehr importieren**

- **Hinweis**: Tabelle **X** wird ignoriert (wird entfernt). Relevante Telekom-Kasten-IDs sind zuverlässig in **K.Objekte** (`Telekomschaltkasten`, `Telekom-Kasten-ID`) hinterlegt und werden darüber abgebildet.

### Motive (Z) → `creative`

- **id**: Ninox-Record-ID, **name** (A), **format** (B), **event\_date** (C), **customer\_id** (O), **asset** (K)

### Belegungstermine (HC/IC)

- Optionaler Import zur **Planungs- und Kapazitätssicht**; nicht kritisch für MVP.

### Gemeinden (A)

- Für **Sondernutzung Laternen** relevant (Preise/Regeln). Kein Muss für MVP; spätere Integration möglich.

## Feldnormalisierung & Validierung (Auszug)

- **Adressen**: Straße/Hausnr. aufteilen (optional), Postleitzahlen-Format prüfen (5-stellig DE).
- **Koordinaten**: Wertebereich check, Genauigkeit optional aus K.GPS übernehmen.
- **Enums**: Choice-Felder in Ninox werden in DokuSuite als stabile Codes gespeichert (Mapping-Tabelle `enum_map`).
- **Referenzen**: bei fehlenden Zielen -> Quarantäne-Tabelle `import_errors` + E-Mail-Report.

## Sync-Prozesse

1. **Bootstrap**: Vollimport der relevanten Tabellen in definierter Reihenfolge (Kunden → Adressen → Aufträge → Positionen → Objekte → Medien …).
2. **Delta-Pull**: zyklisch (z. B. alle 15 min) je Tabelle; nur geänderte Datensätze verarbeiten; Jobs idempotent.
3. **Konflikte**: Bei referentiellen Brüchen (z. B. Auftragsposition ohne Auftrag) Datensatz parken.
4. **Löschungen**: In Ninox entfernte Datensätze → `is_archived=true` in DokuSuite.
5. **Monitoring**: Importmetriken, Fehlerquote, Laufzeiten; Alarmierung per E‑Mail.

## Datenschutz (PII-Filter)

- **Nicht syncen**: H.R1 `Bankverbindung`, H.X `SV-Nummer`, H.Y `Steuer-ID`, weitere HR/Versicherungstabellen.
- **Kunden-PII**: E‑Mails/Telefonnummern ja, IBAN/BIC (falls vorhanden) nein.

## App-/Backend-Nutzung der Daten

- **iOS-Cache**: Nur `location` + `media_unit` + minimale Kunden-/Auftrags-Metadaten (IDs, Namen) für schnelle Auswahl.
- **Matching**: KNN-Distanz auf `location` (PostGIS); Medienformat-Hinweise aus `media_unit`.
- **Kundenportal**: `order` + optionale `order_item`-Infos (Beschreibung/Zeitraum) als Kontext.

---

# Offene Punkte zum Mapping (klein, nicht blocker)

- **Agentur-Erkennung**: manuell flaggen in DokuSuite (Default false); später Regel (z. B. Branche enthält „Agentur“).
- **Telekom-Verknüpfung**: Klärung, ob `K.H2` zuverlässig auf `X.KVZ_ID` mappt – falls nicht, separater Matching-Schlüssel.
- **Laternen-IDs**: derzeit kein Feld in Ninox – iOS-App erhält Freitextfeld „Mast-Nr.“; Speicherung nur in DokuSuite.
- **Belegungstermine (HC/IC)**: Einbeziehen erst ab Phase 2 (Planung).

---

# MVP – Acceptance Criteria & Testplan (v1.0)

> Fokus: **eigene feste Standorte** + **mobil/Laternen** (ohne automatische Auftragszuordnung), **Kundenportal** mit Magic Links & Accounts, **Ninox-Pull-Sync**, **Hetzner S3**, **Google Maps**.

## 1) iOS-App

### Functional Acceptance

1. **Aufnahmemodi**: Nutzer kann zwischen *Fester Standort* und *Mobil (Laternen)* wechseln; Auswahl wird pro Foto gespeichert.
2. **Standort-Refresh**: Button „Standort aktualisieren“ triggert neue iOS-Lokalisierung; `timestamp` und `horizontalAccuracy` aktualisieren sich sichtbar.
3. **Genauigkeit**: App zeigt Accuracy in m an; bei >50 m wird ein Hinweis angezeigt und **keine** Auto-Auswahl erzwungen.
4. **Matching (Feste Standorte)**: Innerhalb 50 m existierender Objekt-Koordinaten werden **Kandidaten** (Top‑3) nach Distanz angezeigt; Nutzer kann 1 Kandidat wählen; Auswahl wird gespeichert.
5. **Mobil (Laternen)**: Reverse Geocoding liefert Straße/PLZ/Ort (Server-seitig, später), App zeigt die Werte nach Upload-Processing an; optionales Freitextfeld „Mast-Nr./Notiz“.
6. **Metadaten**: Pro Foto werden Zeit (lokal, Europe/Berlin), Lat/Lon/Accuracy, Heading (falls verfügbar), Modus, Device-ID, Uploader-ID, Client-UUID erfasst.
7. **Upload**: Hintergrund-Uploads (Warteschlange), automatische Retry-Strategie, idempotent mittels `client_uuid`+Hash.
8. **Dedupe (Client)**: Gleiches Bild (identischer Hash) wird nicht doppelt hochgeladen; UI zeigt Status „bereits hochgeladen“.
9. **Offline**: Ohne Netz werden Fotos in Queue gestellt; bei Rückkehr automatisch hochgeladen.
10. **Batterie/Netz**: Upload pausiert unter Low Power Mode oder <5% Akku (konfigurierbar) und setzt sich fort, wenn Bedingungen erfüllt.
11. **MDM**: App lässt sich via **JAMF** verteilen/aktualisieren; Startet ohne Konfig fehlerfrei, zeigt Login.
12. **Login**: E-Mail + Passwort; 2FA optional (TOTP); Session im Keychain; Logout löscht Tokens.

### Non-Functional Acceptance

- **iOS-Version**: iOS 16+; iPhone 11 oder neuer.
- **Performance**: Aufnahme→Upload-Start < **3 s** (online), Upload→Server-ACK < **8 s** bei 4 MB Bild und 10 Mbit/s.
- **Stabilität**: 1.000 Fotos Dauerlauf (Labor) ohne App-Crash.
- **Barrierefreiheit**: Mindestkontraste, Dynamic Type kompatibel.

### Testfälle (Auszug)

- **IOS-01**: Flugmodus an → 3 Fotos aufnehmen → Flugmodus aus → alle 3 werden innerhalb 60 s hochgeladen, Reihenfolge egal, Status korrekt.
- **IOS-02**: Standort-Refresh; vorher Accuracy 120 m → nach 10 s Refresh < 50 m; Kandidatenliste erscheint.
- **IOS-03**: Zwei nahe Standorte (30 m/45 m) → Top‑3-Picker zeigt beide, Auswahl speicherbar.
- **IOS-04**: Gleiches Foto zweimal aufnehmen → zweiter Upload wird clientseitig unterbunden (Duplikat-Hinweis).
- **IOS-05**: MDM-Deployment via JAMF auf neues Gerät → Login möglich, Grundfunktion läuft.

## 2) Backend/API & Processing

### Functional Acceptance

1. **Auth**: Interne Benutzerverwaltung, JWT-Token, 2FA optional; Rollen: Admin, Dispo, Plakatierer, Kunde.
2. **Upload-Pipeline**: Pre-signed PUT zu Hetzner S3; nach Upload **Ingestion-Event** → Worker startet.
3. **Ingestion**: EXIF lesen, Orientierung normalisieren, Hash (SHA‑256), Thumbnails erzeugen, Metadaten speichern.
4. **Matching**: PostGIS-KNN (50 m) liefert Kandidaten; bei eindeutiger Lage (z. B. Distanz <10 m und keine weiteren <30 m) Auto-Vorschlag `selected_by=auto`.
5. **Belegungswoche**: Berechnung Europe/Berlin; **Sonntag zählt zur Folgewoche**, wenn Wochenstart Montag. Override pro Foto/Job möglich.
6. **Reverse Geocoding**: Für Modus „Mobil“: Straße/Hausnummer/PLZ/Ort ermitteln (Google), mit Cache (Redis) und Rate-Limit; Fehler robust protokollieren.
7. **Dedupe (Server)**: Hash‑Uniqueness; zweiter identischer Upload wird als Duplikat markiert (`is_duplicate=true`) und mit Erstfoto verlinkt.
8. **Exporte**: ZIP (strukturierte Dateinamen), Excel (definierte Spalten), PDF-Report (Deckblatt, Kennzahlen, Karte, Auswahlbilder).
9. **Sharing**: Magic Links (Ablaufdatum, optional Passwort), Accounts (2FA optional), **Wasserzeichen pro Share/Kunde**.
10. **Audit-Log**: Jede Änderung an Foto/Zuordnung/Share wird protokolliert (wer/was/vorher/nachher/zeit).

### Non-Functional Acceptance

- **SLA API**: 95. Perzentil `GET /photos?filter=…` < **500 ms** bei 10k Datensätzen, P95 `POST /assignments` < **800 ms** (Batch 500 IDs).
- **Skalierung**: 2 Worker parallel → 2.000 Fotos/Stunde verarbeitet (Hashing, Thumbs, Matching, Geocoding-Cached).
- **S3 Latenz**: Upload→Event-Empfang < **5 s** im Mittel.
- **Fehlerhandling**: idempotente Endpunkte; klare Fehlercodes (4xx/5xx); Dead-Letter-Queue bei Worker-Fehlern.

### Testfälle (Auszug)

- **BE-01**: Duplikat-Upload (gleicher Hash) → 409/`is_duplicate=true`, Link auf Original.
- **BE-02**: Foto am Sonntag 23:30 Uhr → Belegungswoche = nächste Kalenderwoche (Montagsstart).
- **BE-03**: Mobil-Foto ohne Google-Erreichbarkeit → Retry mit Backoff, Fallback „Adresse unbekannt“, Job bleibt nicht hängen.
- **BE-04**: 1.500 Fotos ingestieren → alle verarbeitet; PII-Felder fehlen in DB; Processing-Metriken im Monitoring sichtbar.

## 3) Web-Tool (Backoffice & Kundenportal)

### Functional Acceptance

1. **Login & 2FA**: Accounts mit Passwort; TOTP optional pro Nutzer. Magic-Link-Zugriff ohne Account für freigegebene Shares.
2. **Rollen & Sichtbarkeit**: Dispo sieht alle Fotos; Kunde sieht nur freigegebene Aufträge; Plakatierer nur eigene Uploads.
3. **Listen & Filter**: Galerie/Tabelle/Karte; Filter nach Zeitraum/Belegungswoche, Plakatierer, Modus, Standort/Region, Kunde/Auftrag, Qualität, Genauigkeit, Duplikate, Best‑of.
4. **Bulk-Selection**: 1.000+ Fotos markieren; **Batch-Zuordnung** zu einem oder mehreren Aufträgen (manuell) in einem Schritt.
5. **Korrekturen**: Standort/Belegungswoche stapelweise ändern; Historie bleibt nachvollziehbar.
6. **Kundenfreigaben**: Share erstellen (Ablauf, optional Passwort, Wasserzeichen-Policy, Branding); Link generieren; Zugriff/Downloads werden geloggt.
7. **Exporte**: ZIP-Download, Excel (Spalten s. unten), PDF-Report; Kunde kann alles über Portal abrufen.
8. **Wasserzeichen**: Vorschau/Downloads je Share gemäß Policy (none/default/custom\_text) gerendert.
9. **Map**: Marker-Clustering, Klick → Fotoliste gefiltert; Link zu Google Maps.

### Excel-Spalten (MVP)

`photo_id, taken_at_local, week_iso, mode, uploader, customer_id, customer_name, order_ids, order_names, location_id, location_name, lat, lon, accuracy_m, address_str, media_format, is_duplicate, best_of`

### Non-Functional Acceptance

- **Usability**: Bulk-Operation 1.000 Fotos < **30 s** (Server-Job + UI-Feedback).
- **Rendering**: Galerie-Scroll flüssig bis 10k Fotos (virtuelles Scrolling, Thumb-CDN/Cache).
- **A11y/Design**: Tastaturkürzel für Multi-Select; abgesicherte Lösch-/Verwerf-Aktion (Undo 30 s).

### Testfälle (Auszug)

- **WEB-01**: Kunde mit Account + 2FA sieht alle historischen, freigegebenen Aufträge; kein Zugriff auf interne Fotos.
- **WEB-02**: Magic Link mit Ablauf 7 Tage → nach Ablauf HTTP 410 und UI-Hinweis.
- **WEB-03**: 1.200 Fotos filtern (Woche 35/2025, Modus=fester Standort) → Multi-Select → einem Auftrag zuordnen → Audit-Log erfasst Aktion.
- **WEB-04**: Share mit Wasserzeichen „Stadtbild“ → Galerie & ZIP enthalten Wasserzeichen; anderer Share für Agentur **ohne** Wasserzeichen.

## 4) Ninox-Sync

### Acceptance

1. **Read-only Pull**: Tabellen **E (Kunden), MB (Adressen), Q (Aufträge), NB (Auftragspositionen), K (Objekte), L (Medien), M (Netze), P (Slots), R (Touren), PB (Routen), WC (Personen)** werden periodisch synchronisiert.
2. **Filter/PII**: HR-/Finanz-Felder werden nicht synchronisiert (siehe Mapping-Sektion).
3. **Delta**: Nur geänderte Datensätze (per Änderungsmarker/Hash-Vergleich). Weiche Löschungen → `is_archived`.
4. **Referenzen**: Reihenfolge und Quarantäne bei Brüchen.

### Testfälle

- **NX-01**: Neuer Kunde in Ninox → innerhalb 15 min in DokuSuite sichtbar.
- **NX-02**: Objekt mit fehlender PLZ → Import schlägt nicht fehl; Warnung im Import-Report; Objekt dennoch als Standort führbar (ohne Adresse).
- **NX-03**: Löschen eines Mediums in Ninox → `is_archived=true`, nicht mehr wählbar in UI.

## 5) Sicherheit & Datenschutz

### Acceptance

- **TLS** überall; Passwörter gehasht (Argon2/bcrypt), Token kurzlebig.
- **Rechte** strikt; Row-Level-Access auf Order/Customer.
- **Audit** vollständig; Export aller personenbezogenen Daten pro Kunde/Nutzer auf Anfrage (DSGVO-Auskunft) innerhalb 72 h möglich.
- **Wasserzeichen** konfigurierbar; Standard-Policy pro Kunde.
- **Backups**: DB PITR; S3 Versioning; tägliche Backups; **monatlicher Restore-Test**.

### Testfälle

- **SEC-01**: Kunde A erhält Magic Link von Kunde B → Zugriff verweigert.
- **SEC-02**: Admin ändert Wasserzeichen-Policy eines bestehenden Shares → neue Downloads haben neue Policy, alte Downloads bleiben unverändert.

## 6) Betrieb & Monitoring

### Acceptance

- **Deployment**: Ubuntu 22.04, Docker Compose, Nginx Reverse Proxy; Konfiguration über `.env`/Secrets-Store.
- **Monitoring**: Prometheus/Grafana (CPU, RAM, Queue-Länge, Jobs/min), Log-Suche (OpenSearch/ELK), Basis-Alerts (Ingestion-Stau, S3-Fehler, Geocoding-Quota).
- **S3**: Hetzner Bucket + Access/Secret; Health-Checks; Latenzmetriken.

### Testfälle

- **OPS-01**: S3-Schlüssel rotieren → Uploads funktionieren nach Rotation ohne Ausfall > 5 min.
- **OPS-02**: Worker abstürzen → Supervisor/Orchestrierung startet sie automatisch; keine Jobs verloren (idempotent).

## 7) Abgrenzung (Nicht im MVP)

- Automatische Mehrfach-Auftragszuordnung per KI.
- Gesichts/Nummernschild-Unkenntlichmachung.
- Slack/Webhooks, Map-Fallbacks, Writeback nach Ninox.

## 8) Exit-Kriterien MVP

- Alle obigen Acceptance- und Kern-Testfälle **grün** in Staging und im 2‑wöchigen Feldtest (≥2 Teams, ≥1.500 Fotos).
- KPI: ≥ **80 %** der Fotos haben korrektes Standort-Matching ohne manuelle Korrektur.
- KPI: Median „Upload → Kundenfreigabe“ < **24 h** in Pilot.



---

# MVP – Abnahmekriterien & Testplan (v1)

## 0) Geltungsbereich & Annahmen

- **Module**: iOS-App, Backend/API, Web (Konsole + Kundenportal), Ninox-Sync. Exporte & Karten inkl.
- **Out of Scope (MVP)**: Auto-Zuordnung Foto→Auftrag, Slack/Webhooks, AD/SSO, KI-Qualität, HC/IC-Planungstabellen, Ninox-Writeback.
- **Rahmen**: Europe/Berlin, Belegungswoche ab Montag; Sonntag zählt zur Folgewoche; Radius 50 m.

---

## 1) iOS-App – Abnahmekriterien

**Funktional**

1. Fotoaufnahme in den Modi **Fester Standort**/**Mobil** inkl. **„Standort aktualisieren“**-Trigger und Anzeige **Genauigkeit (m)**.
2. **Matching auf Gerät**: Kandidatenliste fester Standorte im **50 m**-Umkreis (Cache). Manuelle Auswahl/Override möglich.
3. Metadaten je Foto: Timestamp (lokal), Lat/Lon/Accuracy, Modus, Device-ID, Benutzer-ID, optional Notiz. (Kein lokaler EXIF-Strip notwendig; Backend übernimmt.)
4. **Upload-Queue offline-first**: Hintergrund-Uploads, automatische Wiederaufnahme, **idempotent** (Client-UUID + Hash).
5. **Duplikate lokal vermeiden**: Kein Mehrfach-Upload desselben Bildes (Client-UUID persistiert).
6. Zustände sichtbar: „Wartet auf Upload“, „Hochgeladen“, „Server verarbeitet“.
7. Verteilung & Gerätemanagement via **JAMF**; App startet auf MDM-registrierten Geräten fehlerfrei.

**Nicht-funktional**

- **Upload-Erfolgsrate** ≥ 99,5 % pro Tag (bei verfügbarer Konnektivität innerhalb 15 min).
- **Matching-Latenz** (Kandidatenliste rendern) ≤ 400 ms bei Cache-Hit, ≤ 1 s bei Kaltstart (5k Standorte im Cache).
- **Akku**: ≤ 8 % Verbrauch pro Stunde bei 1 Foto/Minute (Bildschirm an, GPS aktiv, LTE).
- **Stabilität**: Crash-free sessions ≥ 99,9 % über 7 Tage Pilot.

**Tests (Beispiele)**

- **GPS-Güte**: Given Genauigkeit 65 m → App zeigt Warnhinweis, erlaubt Foto; Kandidatenliste sortiert nach Distanz.
- **Grenzfall Radius**: Standort 49 m entfernt → erscheint; 51 m → erscheint nicht.
- **Offline**: Flugmodus an → 20 Fotos aufnehmen → später online → alle 20 werden automatisch hochgeladen (keine Duplikate).
- **Dedupe**: Gleiches Foto zweimal aufnehmen → zweiter Upload wird lokal verhindert.
- **Belegungswoche-Hinweis**: Foto am So 17:00 → App zeigt „zählt i. d. R. zur Folgewoche“ (rein informativ).

---

## 2) Backend/API – Abnahmekriterien

**Ingestion & Verarbeitung**

1. **Signierte Uploads** zum **Hetzner S3** (Pre-Signed, TTL konfigurierbar), Originaldatei bleibt unverändert.
2. Pipeline: Hashing (SHA‑256), EXIF/Orientation, Thumbnail-Erzeugung, **PostGIS**-Matching (50 m), Reverse Geocoding (nur Modus „Mobil“), Belegungswoche.
3. **Duplikaterkennung: Hash-only** → bereits vorhandenes Objekt erzeugt keinen neuen `photo`-Record (idempotent), aber erhöht Referenzzähler (internes Log).
4. **N****:n-Foto****↔Auftrag** technisch unterstützt, aber **keine Auto-Zuordnung** im MVP.
5. **Belegungslogik**: Montag=Start; Sonntag standardmäßig Folgewoche; Override-Flag je Foto/Job möglich; Zeitzone **Europe/Berlin**.

**APIs**

- Auth (Einladungen, Login, 2FA), Fotos (listen/filtern/Details), Standorte/Medien, Aufträge/Positionen (read-only), Shares (Magic Link), Exporte (Excel/ZIP/PDF), Admin (Enums/Settings).

**Nicht-funktional**

- **Durchsatz**: ≥ 10 Fotos/sek (Ingestion) mit 4 Worker-Threads auf Standard-Hardware.
- **Verarbeitungszeit**: 95‑Perzentil < 8 s vom Upload bis „verarbeitet“ (inkl. Thumbnails, Matching, DB-Commit) ohne Geocoding; mit Geocoding < 12 s (Cache-Hit < 6 s).
- **Integrität**: Jede Änderung auditierbar (Actor, alt/neu, Zeit).

**Tests**

- **Idempotenz**: Gleiches Objekt 3× melden → 1 `photo`-Datensatz.
- **Orientation**: Hochkant-Foto wird korrekt dargestellt (EXIF berücksichtigt).
- **Belegungswoche**: Fotos am So/Mo rund um Mitternacht → korrekte Wochenzuordnung.
- **Matching**: Foto 12 m neben Standort K123 → auto-linked; 75 m entfernt → kein Auto-Link, Flag „unsicher“.
- **S3**: Objekt-Existenz vor DB-Commit geprüft; Pre-Signed-URL nach TTL ungültig.

---

## 3) Web – Konsole & Kundenportal – Abnahmekriterien

**Konsole (intern)**

1. **Filter**: Zeitraum/Belegungswoche, Plakatierer/Subunternehmer, Modus, Standort/Region, Kunde/Auftrag, Qualität, Genauigkeit, Duplikate, „best‑of“.
2. **Bulk-Aktionen**: Multi-Select (≥ 1.000 Fotos), Zuordnung zu Auftrag(en), Standortkorrektur, Markierungen (schlecht/best‑of), Export.
3. **Foto-Detail**: Metadaten, Map, Historie, Kommentare, Audit-Log.
4. **Performance**: Listen-Rendern (1.000 Kacheln mit Thumbnails) **< 2 s** nach Filterwechsel (Server liefert paginiert, Thumbs gecacht).

**Kundenportal**

1. **Zugänge**: **Accounts** (Passwort/2FA) + **Magic Links** (Ablauf konfigurierbar). Historie nur für Accounts.
2. **Freigaben**: pro Share konfigurierbare **Wasserzeichen-Policy** (Endkunde „an“, Agentur „aus“), Branding.
3. **Ansichten**: Galerie, Karte, Tabelle; **ZIP‑Download** aller Fotos; **Excel** (Standortliste + Metadaten); optional **PDF-Report** (Deckblatt, Kennzahlen, Karten-Minimap, 12–24 Bilder).
4. **Nachvollziehbarkeit**: Jeder Zugriff/Download wird geloggt (Zeit, Nutzer/Link, Anzahl Dateien).

**Tests**

- **Bulk-Zuordnung**: 500 Fotos selektieren → 2 Aufträgen zuordnen → n\:m-Beziehung korrekt (keine Duplikate, Historie vorhanden).
- **Magic Link**: Ablauf nach 14 Tagen → Zugriff abgelehnt, Log vermerkt.
- **Wasserzeichen**: Kunde A (Endkunde) sieht Wasserzeichen; Kunde B (Agentur) nicht.
- **Leistung**: 1.200 Fotos gefiltert → UI reagiert < 2 s; Karte zeigt Cluster statt Einzelpins.

---

## 4) Ninox‑Sync – Abnahmekriterien

1. **Pull-only** aus Tabellen: **E, MB, Q, NB, K, L, M, P, R, PB, Z, VC, WC**. **X (Schaltkästen)** und **HC/IC (Belegungstermine)** werden **ignoiert**.
2. **Idempotenz**: Wiederholter Import desselben Datensatzes führt zu keinem doppelten Record (`ext_ref`-Abgleich).
3. **Delta**: Nur geänderte Datensätze (Zeitstempel/Hash) – Laufzeit je Durchgang < 2 min bei 50k Records.
4. **PII-Filter**: Keine HR-/Bank-/Steuerdaten (H.\* sensible Felder) werden importiert.
5. **Fehlerbehandlung**: Referenzbruch → `import_errors` + E‑Mail an Admin.

**Tests**

- **Bootstrap**: Vollimport auf leerem System → konsistente Fremdschlüssel, 0 Importfehler.
- **Änderung**: Adresse eines Kunden ändern → nach max. 15 min im System sichtbar.
- **Löschung**: In Ninox inaktiv gesetzter Standort → `is_archived=true` in DokuSuite.

---

## 5) Exporte, Karten & Geocoding – Abnahmekriterien

- **Excel**: Spalten mind. Auftrag, Standort, Mediaeinheit, Lat/Lon, Timestamp, Plakatierer, Modus, Genauigkeit.
- **ZIP**: Struktur `/Auftrag/<YYYY‑WW>/<Standort>/<photo_id>.jpg`; optional mit/ohne Wasserzeichen.
- **PDF-Report** (lightweight): 1–2 Seiten, Logo/Kunde/Auftrag, Kennzahlen (#Fotos, #Standorte, Zeitraum), kleine Karte, Bildkacheln.
- **Karten**: **Google Maps** only; Marker-Clustering; Deep-Link zum Standort.
- **Geocoding**: Nur Modus „Mobil“, mit Cache; Kostenlimits konfiguriert.

**Tests**

- **Excel** importierbar in Excel/Numbers; deutsche Dezimaltrennung, UTF‑8.
- **ZIP** entpackbar; Dateinamen eindeutig; Wasserzeichen-Variante korrekt.
- **Geocoding-Quota**: Drossel aktiv → Worker pausiert/backoff, keine Fehlerspirale.

---

## 6) Sicherheit, Datenschutz, Betrieb – Abnahmekriterien

- **Auth**: Interne Benutzerverwaltung mit Einladungen, Passwort, **2FA** optional pro Kunde; Rate-Limiting & Lockout.
- **Rechte**: Strikte Row‑Level‑Access (Kunde sieht nur eigene Aufträge/Fotos).
- **Audit**: Änderungen und Downloads revisionssicher.
- **Speicher**: Hetzner S3 + Server-Side-Encryption; DB‑Backups täglich, PITR aktiv; **Restore‑Test** erfolgreich.
- **Monitoring**: Metriken (Uploads/min, Verarbeitungszeit, Fehlerquote), Logs mit Trace-ID.
- **RPO/RTO**: RPO ≤ 1 h, RTO ≤ 4 h (MVP); Runbooks dokumentiert.

**Tests**

- **Pen-Test light**: Schwache Passwörter verhindert; Magic-Link-Missbrauch (Erraten) praktisch ausgeschlossen (≥ 128‑bit Entropie, kurze TTL möglich).
- **Backup-Restore**: Wiederherstellung eines zufällig gewählten Tagesstandes in Staging.
- **Rechtemodell**: Kunde A kann nicht auf Auftrag B zugreifen (direkter Linktest).

---

## 7) Abnahme-Datenvolumen & Pilot

- **Pilotdataset**: \~5.000 Standorte, 7.500 Medien, 50 Aufträge (je 2–4 Positionen), 10 Plakatierer, **1.500 Fotos/Woche**.
- **Abnahmekriterien Pilot** (4 Wochen):
  - ≥ 95 % Fotos **automatisch** korrektem Standort zugeordnet.
  - Median „Upload → freigegeben“ < 30 min (inkl. menschlichem Review-Light).
  - Manuelle Korrekturen < 30 pro 1.000 Fotos.

---

## 8) Go‑Live‑Checkliste (MVP)

-

---

# Repository-Strategie & Setup (v1.0)

## Empfehlung: Monorepo für das MVP

Warum?

- Kleines Team, viele gemeinsame Verträge/Modelle (OpenAPI, Enum-Maps) → 1 PR kann API + iOS + Web synchron ändern.
- Einfachere Versionierung & Releases im Pilot, weniger Cross-Repo-Koordination.
- Gemeinsamer "contracts-first"-Workflow.

Ordnerstruktur (Vorschlag)

```
/README.md
/docs/                      ← Konzept, Akzeptanzkriterien (dieses Dokument als v1.0)
/apps/
  ios/                      ← iOS-App (Swift/SwiftUI)
  web/                      ← Web-Konsole & Kundenportal (React/Next.js)
  server/                   ← API + Admin + Auth (FastAPI) – modularer Monolith
/packages/
  contracts/                ← OpenAPI, JSON-Schemas, Postman-Collections
  shared/                   ← geteilte Typen/Helper (z. B. TS/Proto), Enum-Maps
  workers/                  ← Bild-/Geocoding-Job-Spezifikationen (kein Code im MVP)
/infra/
  docker/                   ← Dockerfiles, Compose, Nginx-Conf (ohne Secrets)
  db/                       ← Migrationskonzept (Alembic-Plan), Seed-Skizze
  monitoring/               ← Dashboards/Alert-Skizzen
/scripts/                   ← Wartungs-/Ops-Skripte (Platzhalter)
/.github/
  ISSUE_TEMPLATE/           ← Bug/Feature/UAT-Vorlagen
  PULL_REQUEST_TEMPLATE.md
  workflows/                ← CI-Skizzen (Lint/Test/Build, kein Secret im Repo)
```

Branching & Versionierung

- trunk-based: `main` (geschützt) + kurze Feature-Branches; Reviews mit CODEOWNERS (Domain-basierte Reviewer).
- Conventional Commits + automatische Changelogs. Versionen per App mit Changesets (später), im MVP reicht Tagging (z. B. `ios-0.1.0`, `server-0.1.0`).

Repo-Policies (GitHub)

- Branchschutz: 1 Review, Required status checks. Secret Scanning, Dependabot Security.
- Labels: `area:ios`, `area:web`, `area:server`, `type:bug`, `type:feat`, `prio:P1..P3`, `good first issue`.
- Issue-Vorlagen: Bug, Feature, UAT (Gherkin-Style), Aufgabe.
- CODEOWNERS: Dispo-Leads für Web, Ops für infra, etc.

Environments

- dev, staging, prod (getrennte DBs/S3-Buckets/Keys). GitHub Environments + Secrets.
- Hetzner S3: `stadtbild-ds-dev`, `stadtbild-ds-stg`, `stadtbild-ds-prd` (Beispielnamen), Lifecycle-Regeln (Versioning, Retention).

CI/CD (ohne Code, nur Struktur)

- server: Lint/Test → Docker-Build → Push Registry → Staging-Deploy (manuell) → Smoke Test.
- web: Lint/Test → Static Build → Artefakt hochladen → Staging-Deploy (manuell).
- ios: Static Checks (SwiftLint, Unit-Tests). Signierte Builds erst in Pilotphase (Fastlane, Apple Keys via Encrypted Secrets).

Security/Secrets

- .env.example im Repo; echte Secrets nur in GitHub Secrets/Environments.
- Optional SOPS + age für verschlüsselte Config-Dateien.
- Git LFS für Beispielbilder/Mockdaten.

---

## Alternative: Polyrepo (wann sinnvoll?)

- Unterschiedliche Releasezyklen/Teams oder externe Dienstleister pro App.
- Strenge Kopplung vermeiden (z
