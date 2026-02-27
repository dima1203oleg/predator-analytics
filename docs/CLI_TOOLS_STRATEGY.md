# Predator Analytics v45.0 - CLI Tooling Strategy & WinSURF Matrix
# "Automated Evolution Architecture"

## 1. Концепція: Агент, що має Інструменти
Ми не даємо агентам "все підряд". Ми даємо їм спеціалізовані набори інструментів (Toolkits) залежно від їх ролі та стадії WinSURF.

## 2. WinSURF Governance Matrix

| Категорія | Інструмент | Роль | WinSURF R&D | WinSURF Prod | Дія Агента |
|---|---|---|---|---|---|
| **Code Quality** | **Ruff** | Linter/Formatter | ✅ Allowed | ✅ Enforced | Auto-fix syntax/style |
| **Code Quality** | **Mypy** | Type Checker | ✅ Allowed | ✅ Enforced | Validate types |
| **Security** | **Bandit** | Static Security | ✅ Allowed | ❌ Blocked (CI only) | Detect hardcoded secrets |
| **Security** | **Trivy** | Vulnerability Scan | ✅ Allowed | ✅ Enforced | Scan container images |
| **ML / Evolution** | **MLflow** | Experiment Tracking | ✅ Allowed | ✅ Allowed | Log metrics, compare runs |
| **ML / Evolution** | **DVC** | Data Versioning | ✅ Allowed | ✅ Allowed | Version datasets |
| **Infra** | **Kubectl** | Cluster Ops | ✅ Full Access | ⚠️ Read-Only | Debug pods, visual check |
| **Infra** | **Argo CLI** | GitOps Sync | ✅ Allowed | ✅ Allowed | Trigger sync (deploy) |
| **Meta-Dev** | **Aider** | AI Refactoring | ✅ Allowed | ⚠️ Review gate | Complex refactoring |

## 3. Workflow Scenarios (Reference Architectures)

### A. "The Sef-Healing Coder" (Code Quality Loop)
1. **Mistral Agent** генерує код.
2. **Ops Agent** запускає `ruff check --fix` (миттєве виправлення стилю).
3. **Ops Agent** запускає `bandit -r .` (перевірка безпеки).
4. Якщо Fail -> Повернення до Mistral з логом помилок.
5. Якщо Pass -> Створення PR.

### B. "The Evolutionary Model" (ML Ops Loop)
1. **Gemini Agent** детектує дрифт даних (через Evidently/WhyLogs).
2. **Mistral Agent** запускає `dvc pull` (отримує дані).
3. **Mistral Agent** запускає `mlflow run .` (тренування).
4. **Ops Agent** порівнює метрики в MLflow.
5. Якщо F1 Score кращий -> `argo app sync` (Deploy Canary).

### C. "Zero-Trust Deployment" (Infra Loop)
1. **Agent** формує маніфест.
2. **Trivy** сканує image в маніфесті.
3. **WinSURF** перевіряє `kubectl apply` (заборонено в Prod).
4. **Agent** комітить в Git.
5. **ArgoCD** синхронізує стан.

## 4. Forbidden Tools (Rationalization)
- `docker push` (тільки CI/CD)
- `kubectl edit` (хаос, тільки через Git)
- `pip install` в runtime (використовувати venv/docker build)
