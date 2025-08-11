# Datenmodell (konzeptionell)

Kern-Entitäten:
- Standort: Eigene Werbestandorte inkl. GPS, Adresse, Status, Medien.
- Ad-hoc-Spot: Dynamisch erfasster Ort (z. B. Laterne) inkl. Reverse-Geocoding-Daten.
- Foto: Datei-Refs (Original, Thumbs), EXIF, Zeit, GPS, Qualität/Flags, pHash, Status.
- Auftrag (Kundenauftrag/Kampagne): Kunde, Zeitraum(e), Ziele, Verknüpfung zu Standorten/Fotos.
- Belegung/Platzierung: Zuordnung Foto ↔ Standort ↔ Belegungswoche/-fenster.
- Nutzer: Rollen (Admin, Team, Plakatierer, Kunde), Organisation/Zugehörigkeit.
- Lieferant/Partner: Subunternehmer, Zuordnung zu Nutzern/Teams.
 - Share/Freigabe: Kundenfreigaben inkl. Ablauf, Branding/Wasserzeichen-Policy, Download-Flags.

Wichtige Beziehungen:
- Standort 1—n Foto (über Belegung/Platzierung) für feste Standorte.
- Ad-hoc-Spot 1—n Foto bei dynamischen Plakatierungen.
- Auftrag n—n Foto (über Zuordnung) mit Zusatzattributen (Kurator-Status, Freigabestatus).
- Nutzer 1—n Foto (Ersteller), Nutzer 1—n Aktion (Audit-Log).
 - Share 1—n Download/Einsicht (Audit-Einträge pro Zugriff).

Schlüsselattribute/Indizes:
- Foto: `capture_time`, `site_id`/`ad_hoc_spot_id`, `phash`, `uploader_id`.
- Standort: `ninox_id`, `lat/lon`, `active`.
- Auftrag: `customer_id`, `calendar_week`, `status`.
 - Share: `watermark_policy`, `expires_at`, `branding_theme`.
 - Kunde: `is_agency` (steuert Default-Wasserzeichen-Policy).
 - Geodaten: GIST/GiST-Index auf Geometrien (PostGIS), KNN-Queries für „nächster Standort“.
