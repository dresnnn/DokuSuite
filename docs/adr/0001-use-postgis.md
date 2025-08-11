# ADR 0001 – PostGIS für Geodaten

Status: accepted
Datum: 2025-08-10

Kontext
- Distanzen/Radius/KNN-Abfragen für Standort-Matching sind Kernfunktionalität.

Entscheidung
- PostgreSQL wird mit PostGIS-Erweiterung betrieben; Geometrien als `geography`/`geometry` mit GIST/KNN-Indizes.

Konsequenzen
- Positive: Schnelle Radius-/Nearest-Neighbor-Abfragen, robuste Geo-Funktionen.
- Negative: Zusätzliche DB-Erweiterung/Operationsaufwand.
- Offene Punkte: Feintuning von Indizes/Koordinatenpräzision.

