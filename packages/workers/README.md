# Workers

Noch kein Code – hier werden später die Job‑Spezifikationen (ohne Secrets) für Ingestion/Thumbnails/Matching/Exporte dokumentiert.

## Ingestion Worker

Zum Starten des Ingestion-Workers:

```bash
python packages/workers/ingestion/worker.py
```

Fehlgeschlagene Jobs können mit RQ erneut eingeplant werden:

```bash
rq requeue <job_id>
```

Der Worker verbindet sich standardmäßig mit einem Redis unter `REDIS_URL` (Fallback: `redis://localhost:6379/0`).

