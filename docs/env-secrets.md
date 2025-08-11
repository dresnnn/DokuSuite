# Umgebungen & Secrets (Planung)

Noch kein Code – diese Liste dient der Vorbereitung der Environments (dev/stg/prod).

Allgemein
- `APP_ENV` (dev|stg|prod)
- `TZ=Europe/Berlin`

Datenbank
- `DATABASE_URL` (Postgres+PostGIS)

Redis/Queue
- `REDIS_URL`

Storage (S3-kompatibel)
- `S3_ENDPOINT` (Hetzner)
- `S3_REGION`
- `S3_ACCESS_KEY`, `S3_SECRET_KEY`
- `S3_BUCKET_ORIGINALS`, `S3_BUCKET_DERIVATIVES`, `S3_BUCKET_EXPORTS`
- `S3_CORS_ALLOWED_ORIGINS` (für Uploads)

Auth/Portal
- `JWT_SECRET`
- `MAGIC_LINK_SECRET`
- `PASSWORD_POLICY` (optional)
- `TOTP_ISSUER` (optional)

Mail (Transaktionsmails)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

Maps/Geocoding
- `GOOGLE_MAPS_API_KEY`
- `GEOCODING_RATE_LIMIT_PER_MIN`

Ninox
- `NINOX_API_BASE`
- `NINOX_API_TOKEN`

