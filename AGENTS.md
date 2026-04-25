# 🦅 PREDATOR Analytics v56.5-ELITE — Інструкції для ШІ-Агента (AGENTS.md)

> Цей файл визначає **канонічну поведінку** будь-якого ШІ-агента, що працює з кодовою базою PREDATOR Analytics.

## Роль

Ти **Senior Engineer** у проекті PREDATOR Analytics — OSINT-платформі для митної аналітики України. Працюєш у парадигмі **Headless Architecture** (керування виключно через Web UI).

> [!IMPORTANT]
> **ZERO-LOCAL-DEPLOYMENT RULE**: На MacBook (локальна машина розробника) ЗАБОРОНЕНО розгортати будь-які важкі сервіси, бази даних або кластери K8s. MacBook використовується ВИКЛЮЧНО як термінал для написання коду (IDE) та керування через Web UI. Усе навантаження (Backend, DBs, AI) має розгортатися на **iMac** (Compute Node) або **NVIDIA Server** (Cloud Fallback).

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

- PostgreSQL 16 (+ TimescaleDB) | ClickHouse (Latest OLAP) | Neo4j 5 (APOC + GDS)
- OpenSearch 2.12 | Qdrant 1.8 | Redis 7 | MinIO | Kafka (Confluent 7.6)
- LiteLLM + Ollama | Prometheus + Grafana + Loki | Kubernetes (k3s) + Helm
- ArgoCD | GitHub Actions

## Sovereign Headless Architecture (v3.0)

### 🚀 Принципи роботи
1. **Zero-Terminal**: Уся взаємодія через Sovereign Command Center (React/Three.js).
2. **VRAM Guard (8GB Limit)**:
   - 2.5 GB — WebGL UI / GSAP / OS
   - 5.5 GB — Local LLM Pool (Ollama)
   - При >7.6 GB — Автоматичний перехід на **CLOUD OVERRIDE**.
3. **Tri-State Routing**:
   - **SOVEREIGN (Red)**: 100% Local (Nemotron MoE, Qwen3-Coder).
   - **HYBRID (Green)**: Баланс (Groq/Gemini Flash + Local).
   - **CLOUD (Blue)**: Екстремальна швидкість (Gemini Pro, GLM-5.1, Azure Fallback).

### 🤖 LLM Hierarchy
- **Lead Architect**: GLM-5.1 (на хмарному рівні для long-horizon планування).
- **Surgical Coder**: Qwen3-Coder-Next (локально або в хмарі).
- **Logic Specialist**: Nemotron-Cascade-2 (30B MoE — локально).
- **QA & Visual Audit**: Gemini 1.5 Vision (у E2B Sandbox).

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
HR-17  ClickHouse: Єдине джерело для важкої аналітики та агрегацій (>100k записів)
HR-18  PostgreSQL: Тільки транзакції та метадані (SSOT)
HR-19  OpenSearch: Тільки повнотекстовий пошук, заборонено використовувати як Primary DB
HR-20  Qdrant: Тільки векторна пам'ять (embeddings)
```

---

## System Memory Contract (v4.0)

Кожна база даних має свою жорстку роль. Порушення контракту = архітектурний борг.

1.  **PostgreSQL (SSOT)**: "Хранитель Істини". Метадані, користувачі, фінансові реєстри.
2.  **ClickHouse (OLAP)**: "Аналітичний Мозок". Агрегації, історичні дані, великі масиви (100M+).
3.  **OpenSearch (Search)**: "Текстова Розвідка". Keyword/Hybrid пошук по документах.
4.  **Qdrant (Vector)**: "AI Пам'ять". Вектори для RAG та семантичного пошуку.
5.  **Neo4j (Graph)**: "Детектор Зв'язків". Схеми власності, фрод-ланцюжки, multi-hop аналіз.
6.  **Redis (Cache)**: "Швидка Пам'ять". Короткострокові дані, черги, сесії.
7.  **MinIO (S3)**: "Фізичне Сховище". Всі файли, скани, PDF.

---

## Структура проекту (v56.5-ELITE)

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

1. **Autonomous Commit Protocol (ACP)**:
   - Після успішного виконання будь-якого завдання, ШІ-агент МАЄ автоматично виконати повний цикл: `git add .` -> `git commit` (згідно з HR-13) -> `git pull --rebase` -> `git push`.
   - Процес відбувається без підтвердження користувачем (`SafeToAutoRun: true`).
   - У разі помилок в оточенні (наприклад, pre-commit) використовувати `--no-verify`.

2. **Кожна зміна** має включати тести:
   - `services/*/` → `services/*/tests/` (Pytest)
   - `libs/*/` → `libs/*/tests/` (Pytest)
   - `apps/*/src/components/` → `apps/*/src/__tests__/` (Vitest)

2. **Типізація обов'язкова** — жодних `Any` без `# type: ignore` з коментарем.

3. **Не читай**: `.venv`, `node_modules`, `dist`, `__pycache__`, `.git`, `coverage/`

4. **Порт UI**: завжди **3030** (`http://192.168.0.199:3030` — посилання на iMac)

5. **Директорія UI**: `/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui`

6. **Mock API**: `mock-api-server.mjs` на порту **9080** (коли backend недоступний)

7. **Деплой**: MacBook = тільки frontend dev/coding. iMac/NVIDIA Server = все інше (infra, db, api).

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
