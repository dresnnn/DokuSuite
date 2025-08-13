# Web-Tool – Anforderungen

Hauptnutzergruppen:
- Verwaltung/Team: Prüfung, Korrektur, Zuordnung, Exporte, Freigaben.
- Kunden: Einsicht in freigegebene Aufträge, Download, Karten/Excel.
- Plakatierer (optional): Eigene Uploads sichten, Status einsehen.

Kernfunktionen:
- Galerie mit schneller Filterung (Plakatierer, Woche, Standort, Modus, Qualität, Auftrag, Kunde, Zeitraum, Status).
- Kartenansicht mit Clustering, Bounding-Box-Filter, Standortkorrektur.
- Bulk-Operationen: Multi-Select, Zuweisen, Ausblenden, Curate-Flag, Re-Matching, Export.
- Kundenfreigaben: Links (ablaufbar), Kunden-Login, ZIP- und Excel-Export, PDF-Report, Karten-Sharing.
- Nutzer-/Rollenverwaltung; Einladungslinks, Passwort-Reset, 2FA (später).
 - Authentifizierung via Token: Browser speichert das Token und sendet es bei jeder API-Anfrage als `Authorization: Bearer <token>`.
   - `AuthContext` verwaltet Loginstatus und Token im Frontend.
   - `AuthGuard` schützt Seiten und leitet nicht authentifizierte Nutzer auf `/login`.
   - Logout löscht das Token und navigiert zu `/login`.
 - Navigationsleiste mit Links zu `Photos`, `Users`, `Orders` und `Shares`.
 - Branding/Wasserzeichen-Policy je Kunde/Share (Agenturkunden i. d. R. ohne Wasserzeichen).

UX/Leistung:
- Flüssige Interaktionen bei großen Datenmengen (Server-seitige Filter/Pagination, Streaming/Infinite Scroll).
- Tastaturkürzel, Batch-Workflows, Undo.
