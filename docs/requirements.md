# Anforderungen

## Funktional
### iOS-App
- Zwei Modi: fester Standort (eigene Medien) vs. Ad-hoc-Standort (z. B. Laternen).
- Manuelles Triggern der Standortaktualisierung; Anzeige der Genauigkeit.
- Lokales Caching der Standortdatenbank (Ninox) inkl. Delta-Sync für Offline-Nutzung.
- On-device Matching-Vorschläge mit Korrekturmöglichkeit (Dropdown/Autocomplete/Map-Pin).
- Upload-Queue mit Hintergrund-Upload, Retry, Fortschritt, Konfliktauflösung.
- Erfassung von Metadaten: Plakatierer, Subunternehmer, Modus, Belegungswoche/-fenster.
- Optional: Mehrfachaufnahme, Serienmodus, Qualitäts-Check (z. B. unscharf, verdeckt) als Flag.

### Web-Tool (Verwaltung & Kundenportal)
- Galerie-Ansichten, Kartenansichten, starke Filter (Plakatierer, Woche, Standort, Modus, Qualität, Kunde, Auftrag, Zeitraum, Status).
- Bulk-Selektionen und -Aktionen (z. B. mehreren Fotos einen Auftrag zuweisen, ausblenden, hervorheben).
- Kennzeichnung schlechter/guter Fotos; Curated-Flag für Social Media.
- Korrektur von Standorten und Metadaten; Re-Matching.
- Kundenportal mit geschützten Zugängen, Download als ZIP, Excel-Export, freigabefähige Kartenlinks.
- Einladungslinks für Kunden und Plakatierer; Rollen-/Rechtemodell.

### Backend/Service
- Zentrale Foto- und Metadatenverwaltung; Integration Ninox (Lieferanten, Aufträge, Standorte) via REST.
- Matching-Pipeline: Standort (fester Standort oder Ad-hoc via Reverse Geocoding), Belegungslogik (Vor-/Nachklebetag, Zählwoche).
- Medienverarbeitung: EXIF/Heic/Jpeg, Orientierungen, Thumbnails, Qualitätsheuristiken, Duplikaterkennung (Perceptual Hash).
- Presigned Uploads für iOS/Web direkt in Objektspeicher; serverseitige Validierung und Indexierung.
- Export-Services: ZIP, Excel (Standortliste), geteilte Links, Kartenansichten.
- Ereignisprotokollierung, Audit-Log, Status-Workflows (eingegangen, geprüft, freigegeben, geteilt).

## Nicht-funktional
- Sicherheit/DSGVO: Rollen, Least Privilege, Verschlüsselung in Transit/at Rest, Löschkonzepte, Aufbewahrungsfristen, TOMs.
- Performance: >1.000 Fotos/Woche, schnelle Filter/Batch-Operationen, flüssige UI.
- Verfügbarkeit: Betrieb auf Ubuntu 22.04, Monitoring/Alerting, Backups, Wiederanlauf.
- Erweiterbarkeit: saubere Module und APIs; austauschbare Provider (Maps/Storage/Auth).
- Beobachtbarkeit: strukturierte Logs, Metriken, Tracing für Uploads/Exporte.

