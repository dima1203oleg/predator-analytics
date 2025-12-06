# 03 · Кластери та ArgoCD: dev-local, lab-gpu, prod-oracle

Цей документ описує:
- які існують кластери Predator Analytics,
- як до них підʼєднано ArgoCD,
- як виглядають ArgoCD Application / ApplicationSet для кожного середовища.

---

## 1. Огляд середовищ

### 1.1. dev-local (MacBook M3)

- **Ціль**: швидкі дев-запуски, smoke-тести, AI-запити.
- **Де**: локальний кластер на MacBook M3:
  - `k3d` або `minikube` (імʼя кластера: `pa-dev`).
- **Що крутиться**:
  - мінімальний набір сервісів: backend, frontend, базові БД, observability.
  - ArgoCD-dev (може бути встановлений в namespace `argocd`).
- **Git-гілки, що сюди привʼязані**:
  - `feature/*`
  - `ai/*` (AI Studio)
  - іноді `develop` (для локальної перевірки перед lab-gpu).

### 1.2. lab-gpu (сервер NVIDIA)

- **Ціль**: staging + навантаження, LoRA/ML, MAS-агенти, великі датасети.
- **Де**: k3s/k8s кластер на сервері з NVIDIA GTX 1080 (назва кластера: `pa-lab-gpu`).
- **Що крутиться**:
  - повний стек: backend, frontend, PostgreSQL, OpenSearch, Qdrant, MinIO, Ollama, MLflow, MAS-агенти, observability.
- **Git-гілки**:
  - `develop` – основне джерело правди для lab-gpu.

### 1.3. prod-oracle (Oracle Cloud)

- **Ціль**: продакшен-середовище для реального використання.
- **Де**: Oracle Cloud (OKE або k3s на VM), кластер `pa-oracle-prod`.
- **Що крутиться**:
  - весь стек, з production-настройками, DR, міні-флотом нод, LB, TLS і т.д.
- **Git-гілки**:
  - `main` – єдине джерело правди для продакшену.

---

## 2. ArgoCD: базова модель

Кожен кластер має свій ArgoCD-інстанс:

- `argocd-dev` – в `dev-local` кластері (Mac).
- `argocd-lab` – в `pa-lab-gpu`.
- `argocd-prod` – в `pa-oracle-prod`.

Усі вони дивляться на **той самий GitHub-репозиторій** `Predator-Analytics`, але на різні гілки та різні `values-*.yaml`.
