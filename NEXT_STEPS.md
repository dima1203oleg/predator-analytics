# Next Steps — Predator v22.0 Migration & Automation

1) **Review TECH_SPEC** — verify details and add missing items (schemas, helm charts, CI flows).
2) **Run Reorganize Script (dry-run first)**
   ```bash
   ./predator_v22/scripts/reorganize_workspace.sh
   # If ok, apply
   ./predator_v22/scripts/reorganize_workspace.sh --apply
   ```
3) **Rotate any leaked keys** (dynamic_keys.json — if real keys were found):
   - Rotate keys in LLM providers and cloud stores
   - Revoke/rotate any public keys
4) **Add GitHub Secrets** — store keys in GitHub Actions secrets or (better) use Vault + ExternalSecrets
5) **Run CI & Add Secret Scanner** — enable `predator_v22/.github/workflows/secret-scan.yml` and other CI jobs
6) **Migrate Helm/ArgoCD** — move existing infra manifests into `predator_v22/infra/helm` and create ArgoCD App-of-Apps
7) **Add a PR template** — require security checklist for secrets and code coverage gates
8) **Create an Issue or PR** — propose transfer of code to `predator_v22` and removal of duplicates

**Warnings:**
- `reorganize_workspace.sh` will perform `git mv` operations — ensure no uncommitted changes exist before running.
- If you prefer, we can create a PR branch with the proposed migration instead of directly altering `main`.

