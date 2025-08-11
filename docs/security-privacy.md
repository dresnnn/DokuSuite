# Sicherheit & Datenschutz (DSGVO)

Grundsätze:
- Privacy by design, Security by default, Need-to-know/Least-Privilege.
- Auftragsverarbeitung und TOMs dokumentieren; AVV mit eingesetzten Subprozessoren (z. B. Storage, Mail, Maps).

Technische Maßnahmen:
- Transportverschlüsselung (TLS) überall; Storage-Verschlüsselung at rest.
- RBAC/ABAC, starke Standard-Policies, 2FA perspektivisch.
- Audit-Logs (unveränderbar, manipulationssicher abgelegt), Alarme bei Auffälligkeiten.
- Härtung: sichere Defaults, Rate Limits, Content Validation, Anti-CSRF für Web, Secure Cookies.
 - Downloads/Portal-Zugriffe protokollieren (Kundenfreigaben, ZIP/Excel/PDF, Kartenlinks).

Datenschutz-Aspekte:
- Personenbezug: Fotos können Passanten zeigen (inzidentell) – Minimierung und Löschkonzepte.
- EXIF-Felder prüfen/ggf. reduzieren in Exporten (z. B. GPS), abhängig vom Zweck.
- Aufbewahrung: definierte Fristen je Kundentyp/Auftrag; definierte Lösch-/Anonymisierungsprozesse.
- Betroffenenrechte: Auskunft, Löschung, Einschränkung – Prozesse und Verantwortlichkeiten festlegen.
 - Optional: Anonymisierung/Unkenntlichmachung sensibler Bildbereiche (Gesichter, Kennzeichen) als Batch-Prozess.

Prozesse:
- Sicherheitsreviews für Releases, regelmäßige Pen-Tests, Abhängigkeits-Scanning.
- Backup/Recovery-Tests, Notfallpläne, Incident Response.
