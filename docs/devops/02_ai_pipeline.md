# 02 · AI Pipeline: Gemini AI Studio ⇄ GitHub ⇄ Mac ⇄ K8s-кластери

## 1. Мета

Цей документ описує **повний ланцюг роботи коду**, коли розробка ведеться:

- або в **Gemini AI Studio**,
- або локально на **MacBook M3** (VS Code / Cursor / інші IDE),

але всі **реальні тести та деплої** виконуються через:

> GitHub → self-hosted runner (Mac) → Kubernetes-кластери (dev-local / lab-gpu / prod-oracle) через ArgoCD.

---

## 2. Ролі компонентів

- **Gemini AI Studio**  
  - Генерує/редагує код, YAML, Helm, `.ai/requests/*.yaml`.  
  - Створює гілки `ai/*` та Pull Request-и.

- **MacBook M3 (self-hosted runner)**  
  - Виконує GitHub Actions jobs (`ci-ai-request-runner.yml`).  
  - Запускає локальний кластер `dev-local` (`k3d`/`minikube`).  
  - Запускає Playwright, інтеграційні тести, `curl`-перевірки, `kubectl` тощо.

- **GitHub**  
  - Джерело істини для коду, конфігів, `.ai/requests` та `.ai/reports`.  
  - Оркеструє CI (GitHub Actions) і формує артефакти (репорти, логи).

- **ArgoCD (dev-local / lab-gpu / prod-oracle)**  
  - Виконує GitOps-деплой на всі середовища.  
  - Відстежує зміни Helm-чартів/values в репозиторії.

- **Kubernetes-кластери**  
  - `dev-local` – Mac (швидкі дев-запуски).  
  - `lab-gpu` – сервер з NVIDIA (стейджинг, навантаження, LoRA).  
  - `prod-oracle` – прод у Oracle Cloud.

---

## 3. Формат запиту `.ai/requests/*.yaml`

### 3.1. Мета

Файли `.ai/requests/*.yaml` – це **контракт між AI Studio / розробником і CI**.  
Вони описують, що треба **запустити на реальному середовищі**, а не в “симуляції”.

### 3.2. Мінімальний формат

```yaml
id: ai-req-2025-12-01-live-dashboard
source: gemini-ai-studio      # або manual, або vs-code, тощо
target_env: dev-local         # dev-local / lab-gpu / prod-oracle (future)
description: >
  Короткий опис задачі (для людини).

actions:
  - name: Ensure dev cluster is up
    run: make k8s-dev-up

  - name: Install frontend deps
    run: cd frontend && npm install

  - name: Start Vite preview
    run: cd frontend && nohup npm run preview -- --port=3006 > /tmp/vite_preview.log 2>&1 &

  - name: Run Playwright smoke test
    run: cd frontend && npx playwright test tests/playwright/live.spec.js --browser=firefox

  - name: Check metrics endpoint
    run: curl -sS http://127.0.0.1:3006/api/v1/metrics/system || echo "metrics_failed"
```
