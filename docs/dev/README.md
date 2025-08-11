# Developer Guide (Planung)

Aktuell kein Produktiv‑Code im Repo. Diese Anleitung bündelt Prozesse & Tools, um die nächsten Schritte vorzubereiten.

Abläufe
- Labels synchronisieren: Action „Sync labels“ starten.
- Backlog anlegen: „Seed Backlog“ mit `path` auf `.github/backlog-p1.json` oder `.github/backlog-p2.json`.
- P1‑Issues verfeinern: „Polish P1 Issues“ anhängen.

Branching & PRs
- Trunk‑based (Branch `main` geschützt), kurze Feature‑Branches, PR‑Review.
- Conventional Commits; PR‑Template nutzen; Labels setzen (`area:*`, `type:*`, `prio:*`, `status:*`).

Nächste Implementationsschritte (ohne Code jetzt)
- Contracts/OpenAPI entwerfen (siehe `packages/contracts/README.md`).
- DB‑Schema/Modelle aus ADRs & `docs/` ableiten.
- iOS/Web Skeletons und Auth‑Flows planen.

Weiterführend
- GitHub Setup: `docs/ops/github-setup.md`
- Project Board: `docs/ops/project-board.md`
- Env/Secrets: `docs/env-secrets.md`

