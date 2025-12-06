# AI_STUDIO_PIPELINE.md

## 1. Призначення

Цей документ описує **правила для AI-агентів (Gemini AI Studio, Copilot, інші)**, які працюють з репозиторієм **Predator Analytics v18.x**.

Мета:

- Дозволити агентам **генерувати та змінювати код/конфігурацію**.
- Заборонити будь-які "фейкові" симуляції результатів тестів/деплоїв.
- Навчити агентів працювати через **GitHub + GitOps** та механізм `.ai/requests → .ai/reports`.

---

## 2. Базові правила для AI

1. **Не симулювати виконання команд.**  
   Якщо користувач просить “запусти тести / деплой / kubectl”, агент:
   - **НЕ виконує це в уяві**,
   - а **створює `.ai/requests/*.yaml`**, де описує, які саме команди треба запустити на реальному середовищі.

2. **Всі зміни тільки через Git.**
   - Будь-які зміни коду, Helm-чартів, конфігів – через Git-коміти в гілки.
   - Немає "прихованих" станів десь поза репозиторієм.

3. **GitOps-first.**
   - Ніколи не виконувати `kubectl apply`/`helm` напряму на продакшн-середовищі.
   - Для деплою використовуються:
     - GitHub Actions (CI),
     - ArgoCD (CD).

4. **dev-local / lab-gpu / prod-oracle – різні середовища.**
   - `dev-local` – Mac (локальний кластер).
   - `lab-gpu` – сервер (staging).
   - `prod-oracle` – прод.

---

## 3. Структура `.ai/` директорії

- `.ai/requests/*.yaml` – **запити на реальне виконання дій**.  
- `.ai/reports/*.yaml` – **фактичні результати** з CI.

### Приклад запиту:

```yaml
id: ai-req-live-example
source: gemini-ai-studio
target_env: dev-local
description: Smoke test live dashboard
actions:
  - name: Check pod status
    run: kubectl get pods -n pa-dev
  - name: Curl endpoint
    run: curl http://localhost:8080/health
```

---

## 4. Сценарій роботи

1. **AI Studio:**
   - Створює гілку `ai/my-feature-date`.
   - Змінює код.
   - Додає `.ai/requests/my-test.yaml`.
   - Пушить і створює PR.

2. **GitHub Actions (CI):**
   - Бачить зміну в `.ai/requests`.
   - Запускає runner на Mac (або іншому env).
   - Виконує команди.
   - Записує `.ai/reports/my-test-result.yaml`.

3. **AI Studio:**
   - Отримує нотифікацію (через `ci-ai-feedback.yml`).
   - Читає звіт.
   - Якщо помилка -> фіксить код -> новий коміт.
   - Якщо успіх -> пропонує мердж.
