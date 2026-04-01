# Backlog: Decision Intelligence Integration (AZR)

## Мета

Зшити розрізнені модулі `core-api`, пайплайни CI/CD та AI-контур у єдину
систему прийняття рішень рівня enterprise для Predator Analytics.

## Принципи реалізації

- Єдине джерело правди для API: `services/core-api`
- Єдиний канон CI/CD: `ci-cd-unified.yml`
- Уніфіковані DTO рішень: сценарії `best/worst/optimal`
- Кожна інтеграція вимірюється KPI (latency, quality, reliability)

## EPIC 1 — Стабілізація CI/CD і GitOps

### Story 1.1: Прибрати дублювання build/deploy workflow
- **Scope:** `ci-cd-unified.yml`, `build-nvidia.yml`, `deploy-mac.yml`
- **Tasks:**
  - Визначити один канонічний pipeline для збірки образів
  - Уніфікувати формат тегів (рекомендовано commit SHA)
  - Вирівняти оновлення `values.yaml` у всіх середовищах
- **DoD:**
  - Немає двох workflow, що незалежно пушать один і той самий image tag
  - GitOps-оновлення узгоджені між `deploy/helm` та `infra/helm`

### Story 1.2: Підсилити quality gate
- **Scope:** `ci-cd-unified.yml`
- **Tasks:**
  - Додати `pytest` для `services/` і `libs/`
  - Додати `vitest` для `apps/predator-analytics-ui`
  - Зробити jobs required для merge в `main`
- **DoD:**
  - PR не може бути змержений без проходження тестів

## EPIC 2 — Канонічний Domain API під ТЗ

### Story 2.1: Decision Engine API (каркас)
- **Scope:** `services/core-api/app/routers/decision_engine.py`
- **Status:** виконано (каркас додано)
- **Tasks (next):**
  - Підключити реальні сервіси замість базових шаблонів
  - Додати трасування джерел даних і explainability
- **DoD:**
  - Endpoint повертає стабільний формат DTO для UI

### Story 2.2: Market + Procurement + Counterparty агрегатори
- **Scope:** нові сервіси в `services/core-api/app/services/`
- **Tasks:**
  - `market_intelligence_service.py`
  - `procurement_intelligence_service.py`
  - `counterparty_360_service.py`
  - Інтеграція в `decision_engine`
- **DoD:**
  - Рішення формуються з фактичних модулів, а не з мок-даних

## EPIC 3 — Business Navigator 360

### Story 3.1: Єдиний endpoint навігатора
- **Scope:** `/api/v1/decision-engine/navigator/{entity_id}`
- **Tasks:**
  - Об'єднати ризики, ринок, конкурентів, прогноз
  - Повернути сценарії `best/worst/optimal` з рейтингом альтернатив
- **DoD:**
  - Один запит дає готову управлінську рекомендацію

### Story 3.2: Контракт UI для картки рішення
- **Scope:** `apps/predator-analytics-ui`
- **Tasks:**
  - Додати типи та клієнт API
  - Рендер картки рекомендацій із джерелами і confidence
- **DoD:**
  - Рішення відображається в UI без ручних трансформацій

## EPIC 4 — Predictive + AZR Self-Learning

### Story 4.1: Feedback loop
- **Scope:** `decision_engine` + БД + оркестрація
- **Tasks:**
  - `POST /api/v1/decision-engine/feedback`
  - Зберігання фідбеку та результатів виконання рекомендацій
  - Нічна оцінка якості стратегій
- **DoD:**
  - Є дані для донавчання моделей та A/B-аналізу стратегій

### Story 4.2: Автопромо моделей
- **Scope:** `app/agents/orchestrator/workflows.py`, `factory`
- **Tasks:**
  - Пороги quality gate для промо моделей
  - Safe rollout (канарейка/поступове вмикання)
- **DoD:**
  - Модель не переходить у прод без проходження порогів

## EPIC 5 — KPI, SLO, Observability

### Story 5.1: SLA/Latency контроль
- **Tasks:**
  - p95 latency < 2 сек для decision endpoint
  - Алерти на деградацію SLA
- **DoD:**
  - KPI видно в метриках і вони контролюються автоматично

### Story 5.2: Accuracy контроль прогнозів
- **Tasks:**
  - Додати офлайн-метрики точності у ML pipeline
  - Публікувати звіт після кожного retrain
- **DoD:**
  - Точність прогнозу вимірюється і відслідковується в динаміці

## Пріоритезація (перші 3 спринти)

- **Sprint A (інфраструктура):** EPIC 1 + Story 2.1 (hardening)
- **Sprint B (продукт):** EPIC 2 (Story 2.2) + EPIC 3 (Story 3.1)
- **Sprint C (автономність):** EPIC 4 + EPIC 5 (Story 5.1)

## Ризики і залежності

- Ризик конфліктів між існуючими workflow для різних середовищ
- Неповна типізація в сервісах може сповільнити інтеграцію DTO
- Відсутність єдиної схеми даних для feedback/retrain циклу

## Технічний чекліст запуску

- [ ] Decision Engine endpoint працює в `core-api`
- [ ] DTO узгоджені між backend і frontend
- [ ] CI запускає lint + typecheck + tests
- [ ] GitOps теги оновлюються через єдиний pipeline
- [ ] Метрики latency/quality доступні в моніторингу
