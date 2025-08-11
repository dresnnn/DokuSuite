# Ninox ↔ DokuSuite – Sync-Entwurf (Auszug)

Leitlinien
- Ninox bleibt Stammdaten-Master (Kunden, Aufträge, Standorte/Medien, Netze/Slots, Adressen, Personen), DokuSuite ist read-only gegenüber Ninox in Phase 1.
- Idempotente Upserts anhand stabiler Ninox-Record-IDs; Mapping-Tabelle `ext_ref` (source=`ninox`, table, record_id, local_id, etag/hash, synced_at).
- Delta-Sync über Änderungsmarker (falls verfügbar), sonst periodischer Pull + Feld-Hashes; weiche Löschungen (inaktiv statt Hard Delete).
- PII-Minimierung: nur erforderliche Felder syncen; keine sensiblen HR-/Bankdaten.
- Geodaten normalisiert in WGS84; bevorzugt numerische Lat/Lon.

Tabellen (Auszug)
- Kunden (E) → `customer`: name, adresse, status, is_agency, watermark_policy_default.
- Aufträge (Q) → `order`: customer_id, name, status, service_period, customer_po.
- Auftragspositionen (NB) → `order_item`: order_id, title, period, format.
- Objekte (K) → `location`: name, street/zip/city, lat/lon, active, notes, telekom_ids.
- Medien (L) → `media_unit`: location_id, format, last_occupied_at.
- Touren/Stops (R/PB) → `route`, `route_stop` (optional).
- Personen (WC) → `installer` (nur notwendige Felder; HR-Felder ausschließen).
- Schaltkästen Telekom (X), Belegungstermine (HC/IC): zunächst nicht importieren.

Validierung/Quarantäne
- Referenzen prüfen, inkonsistente Datensätze in Quarantäne-Queue parken und protokollieren.
- Audit-Log für Sync-Ereignisse mit Zähler (erstellt/aktualisiert/übersprungen/fehlerhaft).

