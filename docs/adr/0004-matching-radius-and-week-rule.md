# ADR 0004 – Matching-Radius & Belegungswochen-Regel

Status: accepted
Datum: 2025-08-10

Kontext
- Präzises Matching nahegelegener Standorte und korrekte Zuordnung zur Belegungswoche sind zentral.

Entscheidung
- Matching-Radius 50 m (konfigurierbar). Belegungswoche startet Montag; Sonntag zählt zur Folgewoche; global definierbar, pro Auftrag überschreibbar.

Konsequenzen
- Positive: Klare, einheitliche Regeln; geringe Fehleranfälligkeit.
- Negative: Edge-Cases (Feiertage, Sonderfreigaben) benötigen Overrides/Config.
- Offene Punkte: UI-Hinweise bei Grenzfällen.

