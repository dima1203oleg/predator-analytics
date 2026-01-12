# Predator v25 Automation Plan

Це детальний план автоматизації CI/CD, Dockerfile конверсій, та загальної релізної стратегії для `v25.0`. Плани та кроки виконані з урахуванням поточних артефактів у `implementation_v25` та репозиторію.

## Цілі ✅

- Стандартизувати Dockerfile для всіх сервісів (Python: 3.11) з multi-stage builds та distroless runtime, за винятком GPU-контейнерів.
- Реалізувати CI/CD: тестування (tox/pytest), статичний аналіз (ruff/black/mypy), складання образів, скан безпеки (Trivy/Clair), пуш у GHCR, та ініціацію ArgoCD sync.
- Додати e2e тести в CI для перевірки готовності образів у тестовому середовищі (kind/docker-compose).
- Налаштувати release workflow: тегування, реліз, оновлення Helm values, PR для ArgoCD (App-of-Apps), та опціональну автосинхронізацію.

## Обмеження та політика

- Python >=3.11 (тільки `3.11-slim` у builder stage).
- Використати `gcr.io/distroless/python3` для non-GPU runtimes.
- GPU images (CUDA) залишити з офіційними CUDA базовими образами; при потребі використовувати `nvidia/cuda` або `nvidia/cuda:XX.YY-devel-ubuntu..`.
- Image push — тільки за наявності секрету `GHCR_PAT` та дозволів.

---

## Discovery: інвентаризація артефактів (технічні кроки) 🔎

1. Знайти усі Dockerfiles:

- `frontend/`, `ua-sources/`, `predator-frontend_22/` та інші.

2. Визначити тип образу: Python, Node, CUDA, Misc.
3. Позначити особливості: system dependencies (`libpq-dev`, `gcc`, `libmkl`), GPU runtime, non-root user setup.

### Репозиторій - знайдені Dockerfile та CI jobs (результат інвентаризації)

- Dockerfile (backend): `ua-sources/Dockerfile` — builder: `python:3.12-slim`, runtime: `gcr.io/distroless/python3` (multi-stage) ✅
- Dockerfile (frontend): `frontend/Dockerfile` — builder: `node:18-alpine`, runtime: `nginx:alpine` (multi-stage static SPA) ✅
- Dockerfile (mlflow server): `infra/mlflow/Dockerfile` — base: `ghcr.io/mlflow/mlflow:latest`; custom additions for `psycopg2-binary` & `boto3` ✅

- CI workflows that build & push images:
  - `.github/workflows/ci.yml` — tests + validate Dockerfile + optional GHCR push; uses buildx and cache from `type=gha`.
  - `.github/workflows/ci-cd-pipeline.yml` — build/test pipeline that also pushes to GHCR and updates Helm values (umbrella).
  - `.github/workflows/build-nvidia.yml` — build & push and update `environments/nvidia/values.yaml` and commit.
  - `.github/workflows/deploy-nvidia-self-hosted.yml` — deploy to NVIDIA cluster (self-hosted runner) and applies ArgoCD manifests + triggers sync.
  - Additional deploy workflows: `deploy-mac.yml`, `deploy-oracle.yml`, `deploy-prod.yml` — each includes builds and environment updates for their target profiles.

### Observations

- Backend Dockerfile already conforms to multi-stage + distroless runtime and uses Python 3.11 — no immediate conversion necessary.
- Few other Dockerfiles (frontend, mlflow) require specific handling and templates are appropriate for their runtime (Node / custom mlflow runtime).
- CI already includes many of the desired patterns (matrix tests, buildx, optional GHCR push). Improvements: digest-based tagging, helm value updates via PRs, explicit scan gating on severity, caching tune-up, and e2e test gating.

## Конверсія Dockerfile (приклад шаблону) 🛠️

- Загальна схема:
  - Stage `builder` на `python:3.12-slim`
  - Stage `runtime` на `gcr.io/distroless/python3` (для non-GPU)
  - Ключі: віртуальне оточення, статичні залежності, копіювання лише необхідних файлів
  - Приклад (псевдо):

```Dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y build-essential gcc libpq-dev --no-install-recommends && rm -rf /var/lib/apt/lists/*
COPY requirements.txt ./
RUN python -m venv /opt/venv && /opt/venv/bin/pip install --upgrade pip && /opt/venv/bin/pip install -r requirements.txt
COPY . .
RUN /opt/venv/bin/python -m pip install --no-deps -e .  # optional: editable for packages

FROM gcr.io/distroless/python3
WORKDIR /app
COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /app /app
ENV PATH="/opt/venv/bin:$PATH"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- GPU images: використовувати CUDA базу (обговорити шаблон окремо).

## CI: Workflows (архітектура) ⚙️

1. `ci.yml` — тестування та linting (tox via matrix: py312).
2. `build-images.yml` — job matrix для кожного сервіс:

- Build + scan (Trivy/Clair)
- Push to GHCR if `GHCR_PAT` present
- Cache: use buildx with action/cache and GitHub-registry cache
- Tagging: `sha`, `latest`, `v{tag}` (from release tag), `date`

3. `release.yml` — on tag push:

- Run build-images with `vX.Y.Z` tags
- Update Helm `values.yaml` with new images and create PR in `deployment` repo (or update in repo with `gh` CLI)
- Optional: create GH Release and attach artifacts

4. `deploy.yml` — on PR/merge to `main` or after successful release (manual or scheduled):

- Trigger ArgoCD sync via CLI (safest) or API (bearer token)

## Helm Values update & ArgoCD sync (safe approach) 🔁

- After building & pushing images on release, update `helm/charts/umbrella/values.yaml` with the new tags and image digests.
- Create PR back into the `helm-charts` repo or the deployment manifest repo with the updated values; this will be reviewed and merged.
- When merged, ArgoCD will pick up changes and sync; optionally, CI can call `argocd app sync` using a service account token.

## CI Improvements - recommendations ⚙️

- Standardized image tagging: include `sha` and `semver` tag. Prefer immutable image digests (sha256) when updating Helm values.
- Use Docker Buildx with `cache-from` and `cache-to` GH Actions cache to speed up builds.
- Use `docker/build-push-action` to push and then read the pushed image digest (or use skopeo/registry API) — update Helm values with the digest (prefixed `@sha256:`) rather than mutable tags.
- Use `yq` or `kubectl set image` to safely update YAML values rather than `sed` for maintainability.
- Implement PR-based updates for Helm values instead of direct commits by CI to main (unless we have a dedicated bot account).
- Make pushes conditional on `GITHUB_REF`/`github.event_name` & PR status and use `GHCR_PAT` for GHCR push permissions.
- Add a job that runs Trivy with higher severity gating for release builds to prevent accidental release of high/critical vulns.

## E2E testing & validation ✅

- Implement GitHub Actions job `e2e-test` that:
  - Spins up a test cluster (kind) or uses `docker-compose` to run minimal infra (postgres, minio, qdrant/opensearch)
  - Deploy built images to that environment
  - Run a small suite of smoke tests that validate readiness and endpoints
  - Block image pushes & releases if e2e fails

## Security & scanning 🔒

- CI job: run Trivy (or Snyk) on images to detect vulns; fail pipeline if critical vulnerabilities found.
- Add an image size threshold policy (70% of target environment cap) as a warning in a job; configurable via CI input.

## Rollout plan & rollback strategy 🚨

- Canary approach: deploy to a canary namespace first (e.g., `canary`); run smoke tests; if pass, rollout to `prod`.
- Rollback managed by ArgoCD: revert Helm values or use ArgoCD `rollback` if release fails.

## Migration tasks & dev experience 🧭

- Create `implementation_v25/scripts/dockerfile-template.sh` to generate standardized Dockerfile.
- Add `implementation_v25/scripts/run-lint-and-tests.sh` to run local tests and `tox` via Docker fallback.
- Document the process in `implementation_v25/README.md` and `DEVELOPER_SETUP.md`.

---

## Deliverables & Timeline

1. Inventory and CI scan (1 day)
2. Dockerfile refactor for backend & policy engine (1 day)
3. CI workflows to build & push images, update helm values (2 days)
4. e2e validations and ArgoCD sync PR flow (2 days)
5. Security scanning & size checks (1 day)
6. Documentation & Dev tooling updates (1 day)

## Next Steps (Immediate)

1. Inventory Dockerfiles and CI jobs to identify scope of work.
2. Convert the `backend` Dockerfile (`ua-sources/Dockerfile`) into the standard template and validate in CI.
3. Add the CI build & push job for the backend and run a dry-run build in a testing environment.
4. Add `build-and-release.yml` workflow to build images, get digests, run Trivy scan, e2e tests and open a PR updating Helm umbrella values to use the image digest and create PR.
5. Update Helm templates to prefer `image.digest` if present (already done for backend and celery).
6. Implement canary deployments and smoke tests in CI (optional):

- Add a `values-canary.yaml` with minimal replicas and canary host.
- Create `deploy-canary.sh` to deploy `helm/predator-umbrella` into `canary` namespace using a base64-encoded `KUBECONFIG` secret (named `KUBECONFIG_BASE64`).
- Add CI job in `build-and-release.yml` to deploy to canary and run simple curl-based smoke tests inside the cluster; only executes if `KUBECONFIG_BASE64` secret is present.

---

If ви затверджуєте цей план — я починаю з інвентаризації Dockerfiles та CI workflows, потім виконаю тестову конверсію `ua-sources/Dockerfile` та додам відповідний CI job (будування, сканування, опціонально пуш).

Файл створено: `implementation_v25/automation-plan.md`.
