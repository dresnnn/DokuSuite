# Betrieb & DevOps (High-Level)

Zielumgebung:
- Ubuntu 22.04 Server, Containerisierung empfohlen (Docker/Podman), Reverse Proxy (nginx/traefik).
- Services: Backend, Worker, DB (PostgreSQL + PostGIS), Redis, Object Storage (Hetzner S3/MinIO), Frontend.

Grundsätze:
- Infrastructure-as-Code (z. B. Terraform/Ansible) perspektivisch; Secrets-Management.
- Staging/Prod-Trennung; Migrationsstrategie; Rollbacks.
- Monitoring/Alerting (z. B. Prometheus/Grafana), zentralisiertes Logging.

Backups & Wiederanlauf:
- DB: tägliche Snapshots, Point-in-Time Recovery optional.
- Objektspeicher: Versionierung/Replication je nach Kosten/Nutzen (Hetzner S3 Lifecycle-Policies prüfen).
- Validierte Restore-Playbooks.

Kosten/Skalierung:
- Storage-Kosten (Originale + Thumbnails + Exporte) planen; Lifecycle-Policies für Archivierung/Löschung.
- Horizontale Skalierung von Worker-Jobs bei Lastspitzen (z. B. Wochenanfang).
