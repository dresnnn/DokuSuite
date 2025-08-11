# iOS-App – Anforderungen

Funktionen:
- Zwei Modi: fester Standort vs. Ad-hoc.
- Standortaktualisierung manuell triggern; Anzeige von Genauigkeit/Quelle (GPS, Netzwerk).
- Vor-Ort-Matching: Vorschlagsliste (nächste Standorte, Favoriten, zuletzt genutzt), Karte mit Pin-Korrektur.
- Metadaten: Plakatierer/Subunternehmer, Belegungsfenster (Mo mit Vor-/Nachklebetag-Regeln), Notizen/Tags.
- Upload-Queue: offline sammeln, Hintergrund-Upload mit Retry/Backoff; Upload-Status sichtbar.
- Qualitätsflags: „schlecht“ (verdeckt, unscharf) / „Top“ (Social tauglich).
- Mehrfachauswahl/Serienaufnahme; optional Autoupload im WLAN.

Technik/Plattform:
- Swift/SwiftUI, CoreLocation (präzise Updates auf Nutzeraktion), BackgroundTasks.
- EXIF/HEIC/JPEG-Handling; Kompatibilität, Kompression konfigurierbar.
- Auth: sichere Token-Ablage im Keychain; SSO optional später.
- Sicherheit: AppTransportSecurity, minimale Berechtigungen, Datenschutztexte (Kamera/Standort).

UX/Robustheit:
- Deutliche Statuskommunikation (Offline/Sync), klare Fehlerhinweise.
- Undo/Korrektur vor Upload (Standort/Metadaten ändern).
- Performance bei großen lokalen Queues (virtuelle Listen, Thumbnail-Caching).

