# Roadmap & Meilensteine

Phase 0 – Discovery/Feinspezifikation
- Stakeholder-Interviews, Edge-Cases, Glossar, KPIs festlegen.
- Technologiewahl finalisieren (Maps/Storage/Auth/Frameworks).

Phase 1 – MVP (intern): iOS Capture + Grundverwaltung
- iOS: Zwei Modi, Offline-Cache, Upload-Queue, Grundmetadaten.
- Backend: Auth, Fotos, Presigned Uploads, einfache Matching-Regeln (50 m Radius, PostGIS), Thumbnails.
- Web: Galerie, Filter (Basis), manuelle Zuweisung, einfache Exporte.
 - Hinweis: Keine automatische Auftragszuordnung im MVP (manuell/Bulk im Web).

Phase 2 – Betriebsreife
- Belegungsfenster-Regeln (Vor-/Nachklebetag), Ninox-Sync robust, Bulk-Workflows.
- Kartenansicht, Qualitätsflags, Curated-Flow, ZIP/Excel stabil.
- RBAC/Rollen, Audit-Logs, Backups/Monitoring.

Phase 3 – Kundenportal & Automatisierung
- Kunden-Accounts/Einladungen, freigabefähige Links, Self-Service-Downloads.
- Fortgeschrittene Filter/Batch, Re-Matching, pHash-Deduplikation.
- Kostenoptimierung Storage, Lifecycle-Policies.

Phase 4 – Optimierung/Erweiterungen
- Social-Media-Exports, Public-Embeds (optional), SSO/2FA, Mobile Web.
- ML-gestützte Qualitätsbewertung (optional), Routenplanung.

Definition of Done je Phase: dokumentiert, getestet, betriebsfähig.
