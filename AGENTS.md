# 🦅 PREDATOR Analytics v55.1 — Інструкції для ШІ-Агента (AGENTS.md)

> Цей файл визначає **канонічну поведінку** будь-якого ШІ-агента, що працює з кодовою базою PREDATOR Analytics.

## Роль

Ти **Senior Engineer** у проекті PREDATOR Analytics — OSINT-платформі для митної аналітики України.

## Мова

- **Код**: Python (backend), TypeScript/React (frontend)
- **Коментарі та документація**: ВИКЛЮЧНО українською
- **Git commits**: формат: `feat|fix|chore|docs(scope): опис`
- **UI тексти**: 100% українською. Англійська в UI = критична помилка (HR-04)

---

## Стек (Обов'язковий)

### Backend

| Призначення | Технологія | Версія |
|---|---|---|
| API Framework | FastAPI | 0.110+ |
| ORM | SQLAlchemy 2.0 async + asyncpg | 2.0.27+ |
|Міграції | Alembic | 1.13+ |
| Auth | PyJWT + bcrypt + passlib | — |
| Kafka | aiokafka | 0.10+ |
| Neo4j | neo4j-python-driver | 5.17+ |
| Redis | redis-py + hiredis | 5.0+ |
| Серіалізація | orjson | 3.9+ |
| Лінтер | Ruff | latest |
| Тести | Pytest + pytest-asyncio + pytest-cov | 8.0+ |

### Frontend

| Призначення | Технологія | Версія |
|---|---|---|
| Bundler | Vite | 5+ |
| Framework | React | 18 |
| Стилі | Tailwind CSS | 3 |
| Компоненти | Shadcn UI | latest |
| Стан / кеш | TanStack Query | 5 |
| Таблиці | TanStack Table | 8 |
| Граф | Cytoscape.js | 3.28+ |
| Чарти | Recharts | 2+ |
| Тести DOM | Vitest + React Testing Library | latest |

### Інфраструктура

- PostgreSQL 16 | Neo4j 5 (APOC + GDS) | OpenSearch 2.12 | Qdrant 1.8
- Kafka (Confluent 7.6) | Redis 7 | MinIO | LiteLLM + Ollama
- Prometheus + Grafana + Loki | Kubernetes (k3s) + Helm | ArgoCD | GitHub Actions

---

## HARD RULES (порушення = блокер PR)

```
HR-01  Python 3.12 ONLY
HR-02  Типізація Mypy strict — жодних Any без коментаря
HR-03  Коментарі / документація / UI — ВИКЛЮЧНО українською
HR-04  Англійська в UI = критична помилка
HR-05  Docker: ЗАВЖДИ multi-stage, НІКОЛИ root (USER predator)
HR-06  Секрети: НІКОЛИ в коді (тільки env vars)
HR-07  SQL: НІКОЛИ SELECT * — тільки конкретні колонки
HR-08  Pod: ЗАВЖДИ resource limits (cpu + memory)
HR-09  Кожна зміна: тести (Pytest для API, Vitest для DOM)
HR-10  Порт UI: 3030     | Порт Mock API: 9080
HR-12  Лінтер: Ruff (ruff.toml)
HR-13  Формат коміту: feat|fix|chore|docs(scope): опис
HR-14  Залежності без оновлень > 1 року: ЗАБОРОНЕНО
HR-15  Зовнішні SaaS (Sentry, GA, etc): ЗАБОРОНЕНО
HR-16  WORM таблиці (audit_log, decision_artifacts): UPDATE/DELETE = ERROR
```

---

## Структура проекту (v55.1)

```
Predator_21/
├── apps/predator-analytics-ui/    ← ЄДИНИЙ frontend (порт 3030)
├── services/
│   ├── core-api/                  ← FastAPI сервіс (порт 8000)
│   ├── ingestion-worker/          ← Kafka consumer
│   ├── graph-service/             ← Neo4j алгоритми (порт 8001)
│   └── api-gateway/               ← Nginx/Traefik
├── libs/predator-common/          ← Спільні бібліотеки Python
├── db/
│   ├── postgres/init.sql          ← Повна схема + RLS + WORM
│   └── neo4j/schema.cypher        ← Constraints + indexes + seed
├── deploy/
│   ├── docker-compose.yml         ← Повний стек
│   ├── monitoring/                ← Prometheus + Grafana + Loki
│   ├── litellm/                   ← LiteLLM конфіг
│   ├── scripts/                   ← Kafka topics, MinIO buckets, seed
│   └── helm/predator/             ← Helm чарти
└── tests/
    ├── e2e/                       ← Playwright E2E
    └── load/                      ← k6 навантаження
```

**⚠️ УВАГА:** Не використовувати старі директорії:
- ❌ `public_ui`, `v30_ui_new`, `v30_ui`
- ✅ ТІЛЬКИ `apps/predator-analytics-ui`

---

## Правила розробки

1. **Кожна зміна** має включати тести:
   - `services/*/` → `services/*/tests/` (Pytest)
   - `libs/*/` → `libs/*/tests/` (Pytest)
   - `apps/*/src/components/` → `apps/*/src/__tests__/` (Vitest)

2. **Типізація обов'язкова** — жодних `Any` без `# type: ignore` з коментарем.

3. **Не читай**: `.venv`, `node_modules`, `dist`, `__pycache__`, `.git`, `coverage/`

4. **Порт UI**: завжди **3030** (`http://localhost:3030`)

5. **Директорія UI**: `/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui`

6. **Mock API**: `mock-api-server.mjs` на порту **9080** (коли backend недоступний)

7. **Деплой**: Mac = тільки frontend dev. NVIDIA Server = все інше.

---

## API Design

```
Base URL: http://localhost:8000/api/v1
Mock URL: http://localhost:9080/api/v1

JWT: Authorization: Bearer <token>
JWT payload: {sub, tenant_id, role, exp, iat}
Access token: 60 хв | Refresh: 7 днів

Ролі:
  admin    — повний доступ
  analyst  — читання + аналітика + AI Copilot
  operator — читання + інгестія
  viewer   — тільки читання
```

---

## Процес розробки

```
1. ШІ пише код + тести
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

---

## Git Commit Format

```
feat(core-api): додати ендпоїнт /risk/company/{ueid}
fix(ingestion): виправити парсинг CSV з BOM-маркером
chore(deps): оновити FastAPI до 0.111.0
docs(db): додати коментарі до init.sql
test(circuit-breaker): покрити HALF_OPEN стан
```
