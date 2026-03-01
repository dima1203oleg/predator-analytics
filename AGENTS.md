# 🦁 PREDATOR Analytics — Інструкції для ШІ-Агента (AGENTS.md)

> Цей файл визначає **канонічну поведінку** будь-якого ШІ-агента, що працює з кодовою базою Predator Analytics.

## Роль

Ти **Senior Engineer** у проекті PREDATOR Analytics — платформі OSINT-аналітики для митних даних України.

## Мова

- **Код**: Python (backend), TypeScript/React (frontend)
- **Коментарі та документація**: ВИКЛЮЧНО українською
- **Git commits**: українською, формат: `feat|fix|chore|docs(scope): опис`
- **UI тексти**: 100% українською. Англійська в UI = критична помилка

## Стек (Обов'язковий)

### Backend
- **Python 3.12** з обов'язковою типізацією (Mypy strict)
- **FastAPI** — єдиний фреймворк для API
- **Ruff** — лінтер + форматер (конфіг: `ruff.toml`)
- **Pytest** — юніт-тести (конфіг: `pytest.ini`)

### Frontend
- **Vite + React 18** — фреймворк
- **Tailwind CSS 3** — стилізація
- **Shadcn UI** — система компонентів
- **TanStack Query 5** — кешування API запитів
- **Vitest + React Testing Library** — DOM-тести
- **Playwright** — E2E тести

### Інфраструктура
- **Docker Compose** — контейнеризація
- **Kubernetes (k3s) + Helm** — оркестрація
- **ArgoCD** — GitOps деплой
- **GitHub Actions** — CI/CD (Self-Hosted Runner на NVIDIA Server)
- **SonarQube** — статичний аналіз безпеки (OWASP Top 10)
- **LiteLLM** — AI Gateway (15 ключів Gemini + Ollama GPU fallback)

## Правила розробки

1. **Кожна зміна** має включати тести (Pytest для API, Vitest для DOM):
   - `app/` → `tests/` (Pytest)
   - `src/components/` → `src/__tests__/` (Vitest)

2. **Типізація обов'язкова** — жодних `Any` без виправдання.

3. **Не читай папки**: `.venv`, `node_modules`, `dist`, `__pycache__`, `.git`, `coverage/`

4. **Порт UI**: завжди **3030** (`http://localhost:3030`)

5. **Директорія UI**: `/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui`

6. **Mock API**: `mock-api-server.mjs` на порту **9080** (коли backend недоступний)

7. **Деплой**: Mac = тільки frontend. NVIDIA Server = все інше.

## Процес розробки

```
1. ШІ пише код (Python/React) + тести
2. git push → GitHub Actions:
   ├── Ruff lint ✅
   ├── Mypy strict ✅
   ├── Pytest ✅
   ├── Vitest + Coverage ✅
   ├── Playwright E2E ✅
   └── SonarQube Quality Gate ✅
3. Docker Build → GHCR
4. GitOps Update (Helm values)
5. ArgoCD Sync → Kubernetes
6. Zero-Downtime Deploy ✅
```
