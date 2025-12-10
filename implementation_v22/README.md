# Predator Analytics v22.0 — Implementation-ready

This folder contains the initial, implementation-ready artifacts for v22.0 of the Predator Analytics platform.

Contents:

- `TECH_SPEC.md` — Implementation-Ready Technical Specification (v22.0) (the full document)
- `helm/` — sample Helm values for dev/staging/prod
- `qdrant/collection.yaml` — sample Qdrant collection config
- `opensearch/mapping.json` — example OpenSearch index mapping
- `sql/schema.sql` — SQL schema (PostgreSQL) required tables
- `dvc/config` — DVC remote config example
- `scripts/` — convenience scripts (index, train, deploy, eval)
- `Makefile` — simple local/dev commands
- `cleanup_proposal.sh` — lists candidate files to remove or move (DO NOT run without confirmation)
- `services/policy_engine/` — minimal policy decision service (FastAPI)
- `si_cycles/diagnostic_report.schema.json` — schema for diagnostic_report

Prerequisites (recommended):

- kubectl (>=1.24)
- helm (>=3.7)
- argocd CLI (optional for GitOps management)
- docker (for local dev using docker-compose)
- node + pnpm (frontend dev)
- Python 3.11 (developer tooling and local commands; prefer system or pyenv virtualenv)

Run these checks with:

```bash
./scripts/check-prereqs.sh
python3.11 -m pip --version
```

How to use:

1. Review `TECH_SPEC.md` for architecture and operational details.
2. Use the `helm/values-*.yaml` as minimal templates for dev/staging/prod.
3. Follow the scripts for local dev/testing; adapt as needed in CI/CD.

Important: This folder is a single consolidated location for deployment- and infra-related artifacts.
Before running destructive cleanup operations, confirm the files listed in `cleanup_proposal.sh`.

Development tips:

- Start the local policy engine (development):

```bash
cd implementation_v22/services/policy_engine
uvicorn policy:app --reload --port 8100
```

- Run training & indexing examples via Makefile:

```bash
cd implementation_v22
make train CONFIG=configs/llm/exp_reranker_lora.py
make index DATASET=sample
```

Local dev URLs (defaults):

- UI (Vite dev server): http://localhost:5173
- Backend API (FastAPI/UVicorn): http://localhost:8000
- Policy Engine (dev): http://localhost:8100

Prod (NVIDIA server):

- UI: http://<NVIDIA_SERVER_IP>:5173
- Backend API: http://<NVIDIA_SERVER_IP>:8000
- Policy Engine: http://<NVIDIA_SERVER_IP>:8100

Deployment commands (ArgoCD):

- To sync ArgoCD app (NVIDIA - production):
  argocd app sync predator-prod
  argocd app get predator-prod
- To check ArgoCD app status:
  argocd app list

Deployment script example (local):

```bash
# deploy to nvidia cluster (requires argocd login)
cd implementation_v22
./scripts/deploy-to-nvidia.sh nvidia predator-prod
```

Fallback strategy:

- If NVIDIA cluster is unreachable, run the following local fallback in dev: (Mac)
  - Use `values-mac.yaml` and ArgoCD dev overlay (`predator-dev`) or run Docker Compose for local services on Mac.

How to deploy to NVIDIA (prod):

1. Set up the NVIDIA cluster kubeconfig on your machine/CI and name the context `nvidia` (example):

```bash
# Copy your Nvidia kubeconfig as ~/.kube/config or set KUBECONFIG and ensure context 'nvidia' exists
kubectl config get-contexts
kubectl config use-context nvidia
```

2. Ensure ArgoCD is installed and an `argocd` CLI is authenticated:

argocd login <ARGOCD_SERVER> --username admin --password <ADMIN_PW> --insecure

````

3. Sync the production app (ArgoCD):
**Quick preflight**
```bash
# Check kube context and nodes
./scripts/setup-nvidia-context.sh --kubeconfig /path/to/nvidia-kubeconfig

# Ensure argocd CLI exists (script lists install instructions if needed)
./scripts/ensure-argocd-cli.sh

# Then run the deploy
./scripts/deploy-to-nvidia.sh nvidia predator-prod
````

```bash
argocd app sync predator-prod
argocd app get predator-prod
```

4. Alternatively use the local helper script (ensure you have `argocd` and kubeconfig):

```bash
cd implementation_v22
chmod +x ./scripts/deploy-to-nvidia.sh
./scripts/deploy-to-nvidia.sh nvidia predator-prod
```

How to fallback to Mac quickly: - `cd implementation_v22 && docker-compose -f docker-compose.dev.yaml up -d` - Or deploy via Helm using the Mac values file:

```bash
helm upgrade --install predator ./helm --values ./helm/values-mac.yaml --namespace dev --create-namespace
```

Docker images & best practices:

- Prefer `python:3.11-slim` in your Dockerfiles and build multi-stage images to keep image size small.
- For production runtime, consider `gcr.io/distroless/python3` or `python:3.11-slim` as a safety fallback.
- Avoid `python:3.11-full` in production images — use the `slim` variant and multi-stage builder to reduce attack surface & build times.

GHCR CI Push guidance:

- When CI (GitHub Actions) pushes images to GHCR, set the following values in your environment-specific values files (or Helm automations):
  - `images.backend.repository`: `ghcr.io/<org>/<repo>/backend`
  - `images.backend.tag`: `v<major>.<minor>.<patch>.<run>`
  - `images.frontend.repository`: `ghcr.io/<org>/<repo>/frontend`
  - `images.frontend.tag`: `...`

To enable publishing images from CI, add `GHCR_PAT` secret with a Personal Access Token (packages: write
scope) to your GitHub repo settings. The CI will log in and push images only if that secret is present.

CI Build & Release (v22 automation):

- New workflow: `.github/workflows/build-and-release.yml` — builds backend & frontend images, pushes to GHCR, extracts image digest, runs Trivy scans, executes e2e smoke tests via `docker-compose`, and opens a PR to update the Helm umbrella `values.yaml` with the digest.
- Helper scripts: `implementation_v22/scripts/commit-helm-values-pr.sh` and `implementation_v22/scripts/generate-dockerfile-from-template.sh`.
- Run a manual release locally: push a tag `vX.Y.Z` or trigger the workflow from the GitHub UI.

Local test runner helper:

If you do not have `tox` or `python3.11` locally, run the helper script which uses Docker to run tox in a `python:3.11-slim` container:

```bash
cd implementation_v22
./scripts/run-tox-docker.sh py311 ua-sources
```

ArgoCD utilities:

- `./scripts/argocd-check-app.sh <app-name>` — checks whether an ArgoCD app exists and helps debug missing app/permissions.
- `./scripts/create-argocd-app.sh <app-name> <repo-url> <path>` — creates an ArgoCD application (requires `argocd` CLI and access to the ArgoCD server)

-- Predator Analytics Team
