# Vision und Zielbild

Die DokuSuite ist eine Ende-zu-Ende-Lösung zur transparenten, effizienten und skalierbaren Dokumentation von Außenwerbung (OOH) für die Stadtbild Werbegesellschaft mbH. Sie ersetzt manuelle, fehleranfällige Schritte (iCloud-Links, manuelles Matching, Excel-Erstellung) durch eine integrierte Plattform aus iOS-App, Web-Tool und einem zentralen Backend.

## Status quo (Kurzfassung)
- Plakatierer und Subunternehmer dokumentieren per iPhone-Fotos (GPS-Genauigkeit unter iOS besser nutzbar).
- Wöchentliche Einreichung via iCloud-Link; Matching gegen Standortdatenbank per Skript.
- Ad-hoc-Standorte (z. B. Laternen) werden via Google Maps API rückwärts-geokodiert.
- Manuelle Zuordnung zu Kundenaufträgen, manuelle Exporte (Galerie-Link, Karte, Excel).

## Ziele
- Maximale Transparenz und Nachvollziehbarkeit für Kunden, minimaler manueller Aufwand intern.
- Nahtloser Capture-to-Client-Prozess: Aufnahme, automatisches Matching, Prüfung, Freigabe und Bereitstellung.
- Robuste Offline-Funktion (Feldeinsatz), performante Filter/Batch-Operationen im Web-Tool.
- Saubere Rollen- und Rechteverwaltung (Team, Plakatierer, Kunden) mit Auditierbarkeit.
- Nachhaltige, erweiterbare Architektur mit klaren Schnittstellen (Ninox, iOS, Web, Exporte).

## Leitprinzipien
- Offline-first auf iOS, eventual consistency im Backend.
- Privacy by design (DSGVO), Security by default.
- Einfache, überprüfbare Prozesse mit klaren Zuständen statt impliziter Regeln.
- Modular, testbar, ersetzbare Integrationen (z. B. Maps-Provider, Storage).

