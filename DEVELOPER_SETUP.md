# Налаштування середовища розробки (Predator Analytics v22.0)

Цей документ пояснює, як підготувати локальне середовище та DevContainer для роботи з `predator_v22`.

## Передумови

- Git
- Docker & Docker Compose (для локальної інфраструктури)
- Node.js 18+ або pnpm
- Python 3.11+
- VS Code (Desktop) з Remote - Containers та рекомендованими розширеннями

## Швидкий старт у DevContainer

1. Відкрийте `predator_v22` у VS Code.
2. Виберіть Command Palette → Dev Containers: Reopen in Container.
3. Після створення контейнеру виконайте:

```bash
# у контейнері
pip install -r ua-sources/requirements.txt
pnpm install --workspace-root
```

## Запуск сервісів (локально, Docker Compose)

```bash
cd predator_v22
# Запускається мінімальний набір сервісів (backend, minio, redis, qdrant, opensearch, postgres)
docker-compose -f predator_v21/docker-compose.yml up --build
```

## Запуск backend локально (в контейнері або локальному віртуальному середовищі)

```bash
cd predator_v21/ua-sources
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Запуск тестів / локальна QA

Для запуску тестів та лінтерів в ізольованому середовищі рекомендовано використовувати `tox`:

```bash
# From project root
cd implementation_v22
./scripts/run-tox-docker.sh py311 ua-sources
```

Це відтворить CI-налаштування і допоможе уникнути помилок залежностей.

## Запуск frontend (Vite)

```bash
cd predator_v21/frontend
pnpm install
pnpm run dev
```

## Сценарій швидкого тесту

- curl http://localhost:8000/health
- curl http://localhost:8000/api/v1/system/infrastructure

---

## Corollary: Рекомендовані VS Code Extensions

(див. `.vscode/extensions.json` в `predator_v22`)

- ms-python.python
- ms-python.vscode-pylance
- dbaeumer.vscode-eslint
- esbenp.prettier-vscode
- ms-azuretools.vscode-docker
- ms-kubernetes-tools.vscode-kubernetes-tools
- GitHub.copilot
- eamodio.gitlens

---

## Рекомендації з безпеки

1. Не зберігайте API-ключі в репозиторії. Використовуйте `Vault` або `ExternalSecrets`.
2. Перевірте `SECURITY.md` у репозиторії для інструкції щодо ротації ключів.

## CI Release Secrets & Workflow

- `GHCR_PAT` (required for pushing to GitHub Container Registry) — must include `read:packages` and `write:packages`.
- `GH_PAT` (optional) — Personal Access Token with `repo` scope used by `gh` CLI to create PRs for Helm values updates; if not set, CI will try to use `GITHUB_TOKEN`.
- `KUBECONFIG_BASE64` (optional) — base64-encoded kubeconfig for the target cluster to allow CI jobs to deploy to canary namespace; ensure it contains correct context for a canary cluster or a safe namespace.
- To trigger the manual release workflow, create a semantic tag `vX.Y.Z` and `git push origin vX.Y.Z` — this triggers `.github/workflows/build-and-release.yml`.

Local verification steps:

```bash
# Build and test the backend image locally
docker buildx build --platform linux/amd64 -t ghcr.io/<org>/predator-backend:local-test -f ua-sources/Dockerfile ./ua-sources

# Inspect the digest (needs buildx and access)
docker buildx imagetools inspect ghcr.io/<org>/predator-backend:local-test --raw | jq -r '.manifests[0].digest'
```

---

## Використання digest-полів у Helm values.yaml

Для забезпечення незмінності образу (іммутабельність) у Helm values.yaml для backend та frontend додано поле `digest`. Якщо digest вказано, Helm шаблон використовує саме digest для деплойменту, ігноруючи тег.

**Приклад:**

```yaml
backend:
	repository: ghcr.io/org/predator-backend
	tag: "v22.0.1"
	digest: "sha256:abcd1234..."
frontend:
	repository: ghcr.io/org/predator-frontend
	tag: "v22.0.1"
	digest: "sha256:efgh5678..."
```

> **Примітка:** digest генерується автоматично CI/CD workflow після push образу у GHCR. Якщо digest не вказано, використовується tag.

## Canary deployment

Canary overlay values (`values-canary.yaml`) дозволяють деплоїти нову версію образу у окремий namespace для smoke-тестів.

CI/CD workflow автоматично:

- створює overlay PR з digest для canary
- деплоїть у canary namespace
- запускає smoke-тести (health, basic API)

**Приклад запуску canary:**

```bash
helm upgrade --install predator-backend ./infra/charts/predator-backend \
	-n canary --create-namespace \
	-f infra/charts/predator-backend/values-canary.yaml
```

**Smoke-тести:**

```bash
curl http://canary-backend:8000/health
curl http://canary-backend:8000/api/v1/system/infrastructure
```

---
