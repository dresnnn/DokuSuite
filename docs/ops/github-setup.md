# GitHub Setup – Labels & Branchschutz

Dieser Leitfaden richtet das Repository gemäß den DokuSuite‑Vorgaben ein.

## Labels

Labels werden automatisch via GitHub Actions synchronisiert:
- Datei: `.github/labels.yml`
- Workflow: `.github/workflows/labels.yml`

Aktion auslösen:
- Entweder Änderung an `.github/labels.yml` pushen oder den Workflow manuell starten (Actions → "Sync labels" → Run).

## Branchschutz für `main`

Per Web‑UI (Settings → Branches → Branch protection rules → Add rule):
- Branch name pattern: `main`
- Require a pull request before merging: enabled
  - Require approvals: 1
  - Dismiss stale approvals: optional
  - Require review from Code Owners: optional (empfohlen)
- Require status checks to pass before merging: enabled
  - Wähle relevante Checks (sobald CI vorhanden)
- Include administrators: enabled
- Require linear history: optional
- Sign commits: optional

Per GitHub CLI (Alternative):

```bash
OWNER=dresnnn
REPO=DokuSuite

# Erfordert gh auth login mit repo‑Admin Rechten
gh api \
  -X PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/$OWNER/$REPO/branches/main/protection" \
  -f required_status_checks='{"strict":true,"contexts":[]}' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":false,"require_code_owner_reviews":false}' \
  -f restrictions='null'
```

## CODEOWNERS

`CODEOWNERS` ist eingerichtet und verweist auf `@dresnnn` als Eigentümer. Optional können später Teams/Nutzer ergänzt werden.

