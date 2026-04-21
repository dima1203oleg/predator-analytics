# PREDATOR ANALYTICS — КАНОНІЧНЕ ТЕХНІЧНЕ ЗАВДАННЯ v5.0
# (Production-Grade Canonical Specification)

> **СТАТУС:** КАНОНІЧНЕ, ОБОВ'ЯЗКОВЕ ДО ВИКОНАННЯ
> **Версія платформи:** v56.5-ELITE → v57.0-NEXUS
> **Дата:** 2026-04-21
> **Підготовлено:** Аналіз реального коду + синтез ТЗ v4.0 та v4.2
> **Основа:** Глибокий аудит `/Users/Shared/Predator_60` (кодова база, схеми БД, Docker Compose, API роутери, UI-маршрутизація)

---

## ⚡ КРИТИЧНА ПЕРЕДМОВА: СТАН ПРОЕКТУ СЬОГОДНІ

Перед встановленням нових вимог — **фіксація реального стану** на 2026-04-21.

### ✅ ЩО ВЖЕ РЕАЛІЗОВАНО (підтверджено кодом)

| Компонент | Файл/Шлях | Статус |
|---|---|---|
| FastAPI Core API v56.5-ELITE | `services/core-api/app/main.py` | ✅ Реалізовано |
| 35 API роутерів | `services/core-api/app/routers/` | ✅ Реалізовано |
| PostgreSQL + TimescaleDB | `docker-compose.yml:11` | ✅ Реалізовано |
| Redis 7 | `docker-compose.yml:33` | ✅ Реалізовано |
| Neo4j 5.16 + APOC | `docker-compose.yml:49` | ✅ Реалізовано |
| Qdrant | `docker-compose.yml:81` | ✅ Реалізовано |
| OpenSearch 2.17 | `docker-compose.yml:94` | ✅ Реалізовано |
| MinIO | `docker-compose.yml:114` | ✅ Реалізовано |
| Redpanda (Kafka API) | `docker-compose.yml:130` | ✅ Реалізовано |
| Ollama (GPU) | `docker-compose.yml:372` | ✅ Реалізовано |
| Keycloak 22 | `docker-compose.yml:428` | ✅ (server profile) |
| HashiCorp Vault 1.15 | `docker-compose.yml:451` | ✅ (server profile) |
| Prometheus + Grafana + Loki | `docker-compose.yml:471+` | ✅ (server profile) |
| Celery Worker + Beat | `docker-compose.yml:309+` | ✅ Реалізовано |
| MCP Router | `services/mcp-router/` | ✅ Реалізовано |
| Graph Service (Neo4j) | `services/graph-service/` | ✅ Реалізовано |
| Ingestion Worker | `services/ingestion-worker/` | ✅ Реалізовано |
| Antigravity AGI Orchestrator | `app/services/antigravity_orchestrator.py` | ✅ Реалізовано |
| Sovereign Guardian (auto-heal) | `app/services/guardian.py` | ✅ Реалізовано |
| PostgreSQL RLS + WORM | `db/postgres/init.sql` | ✅ Реалізовано |
| Tenant Isolation (multi-tenant) | `app/core/middleware.py` | ✅ Реалізовано |
| CERS Risk Scoring | `services/core-api/app/services/aml_scoring.py` | ✅ Реалізовано |
| Anomaly Detection (SOM) | `services/core-api/app/services/anomaly_detection.py` | ✅ Реалізовано |
| Neo4j Service (UBO graphs) | `services/core-api/app/services/neo4j_service.py` | ✅ Реалізовано |
| React UI (Vite + Tailwind) | `apps/predator-analytics-ui/` | ✅ Реалізовано |
| WRAITH Boot + Login | `src/components/BootSequenceWRAITH.tsx` | ✅ Реалізовано |
| 50+ UI-маршрутів | `src/AppRoutesNew.tsx` | ✅ Реалізовано |
| Admin System Command Center | `src/pages/admin/AdminHub.tsx` | ✅ Реалізовано |
| AML Scoring | `src/features/intelligence/AMLScoringView.tsx` | ✅ Реалізовано |
| Telegram Bot | `apps/telegram-bot/` | ✅ Реалізовано |
| Alembic Migrations | `services/core-api/alembic/` | ✅ Реалізовано |
| Prometheus Metrics | `app/main.py:/metrics` | ✅ Реалізовано |
| Circuit Breaker (tenacity) | `pyproject.toml:tenacity>=8.3.0` | ✅ Реалізовано |

### ⚠️ ВИЯВЛЕНІ РОЗБІЖНОСТІ МІЖ ТЗ v4.2 ТА РЕАЛЬНІСТЮ

| Пункт ТЗ v4.2 | Реальний стан | Рішення в v5.0 |
|---|---|---|
| "Kafka АБО Redpanda" | Redpanda вже задеплоєний (v24.2.19) | **Канонічно: Redpanda = Kafka. Термін "Kafka" в ТЗ = Redpanda** |
| "TimescaleDB можливо зайвий" | `timescale/timescaledb:latest-pg15` вже є | **Залишаємо — TimescaleDB для time-series CERS та декларацій** |
| "MVP без Neo4j, Qdrant, OpenSearch" | Всі три вже реалізовані | **Всі три є production стеком** |
| "Keycloak лише на server profile" | Auth через JWT у `auth_simple.py` | **Двоїстість: власний JWT (локально) + Keycloak (продакшн)** |
| "Kong API Gateway" | Відсутній | **Пріоритет Фаза 2: Впровадити Kong** |
| "SCD Type 2 для компаній" | `companies` без `valid_from/valid_to` | **Пріоритет Фаза 1.5: Alembic міграція** |
| "Schema Registry" | Відсутній | **Пріоритет Фаза 2: Apicurio/Confluent** |
| "Vault для секретів" | Задекларований, але .env файли | **Поетапна міграція: .env → Vault у Фазі 2** |

---

## 1. ЗАГАЛЬНА КОНЦЕПЦІЯ ТА МІСІЯ

**Predator Analytics** — подіє-орієнтована (Event-Driven) аналітична платформа розвідки на основі OSINT та комерційних реєстрів. Виявляє приховані зв'язки, оцінює ризики (AML/CFT) та забезпечує моніторинг контрагентів у реальному часі.

**5 ключових ціннісних пропозицій:**
1. **Signal over Data** — користувач отримує не дані, а сигнали (CERS score, alerts, graphs)
2. **Entity-Centric** — всі дані зшиваються навколо унікального UEID
3. **Probabilistic** — кожен висновок має `confidence_score` + SHAP explanation
4. **Reactive Architecture** — Event-Driven через Redpanda (Kafka-compatible)
5. **Multi-Tenant** — повна ізоляція даних кожного клієнта на всіх рівнях

### 1.1. SLA / SLO

| Метрика | Ціль | Пік |
|---|---|---|
| API Latency (p95) | < 300 мс | < 500 мс |
| API Availability | 99.5% | — |
| Ingestion Delay | < 5 хв | < 15 хв |
| AI Inference Time | < 3 сек | < 8 сек |
| Kafka Consumer Lag | < 1 000 msg | < 5 000 msg |
| CERS Recalculation | < 30 сек | < 2 хв |

---

## 2. АРХІТЕКТУРНА КОНСТИТУЦІЯ

### 2.1. Control Plane / Data Plane

```
+───────────────────── CONTROL PLANE ─────────────────────+
|  Keycloak (IAM) · Kong/Nginx (API GW) · Vault (Secrets) |
|  ArgoCD (GitOps) · GitHub Actions (CI/CD) · Admin UI    |
|  Feature Flags (Redis) · Quota Manager · Billing         |
+──────────────────────────────────────────────────────────+
                          | JWT + X-Tenant-ID
+───────────────────── DATA PLANE ────────────────────────+
|  Core API (FastAPI) · Ingestion Worker · Graph Service   |
|  MCP Router · Antigravity Orchestrator · Guardian        |
|  Redpanda · PostgreSQL/Timescale · Neo4j                 |
|  OpenSearch · Qdrant · MinIO · Redis · Ollama            |
+──────────────────────────────────────────────────────────+
```

### 2.2. Сім шарів системи (Canonical Architecture)

```
ШАР 1: CONTROL PLANE    — Git + GitHub Actions + ArgoCD + Helm
ШАР 2: INTELLIGENCE     — MCP Router + RAG + CERS + AML + Antigravity
ШАР 3: AUTONOMY CORE    — SIO + Sovereign Guardian + Factory Studio [human-in-the-loop]
ШАР 4: DATA EXECUTION   — PostgreSQL + Redis + MinIO + Redpanda + Qdrant + OpenSearch + Neo4j
ШАР 5: OBSERVABILITY    — Prometheus + Grafana + Loki + Alertmanager + DCGM (GPU)
ШАР 6: SECURITY         — Vault + Keycloak + Kong + RLS + WORM + mTLS (Phase 3)
ШАР 7: APPLICATION      — React UI (3030) + Core API (8000/8090) + Mock API (9080) + Telegram Bot
```

### 2.3. Canonical Technology Stack

#### Backend

| Призначення | Технологія | Версія | Підтверджено |
|---|---|---|---|
| API Framework | FastAPI | >= 0.111.0 | `pyproject.toml` |
| ORM | SQLAlchemy 2.0 async + asyncpg | >= 2.0.30 | `app/database.py` |
| Міграції | Alembic | >= 1.13.1 | `alembic/` |
| Auth (local) | PyJWT + bcrypt + passlib | — | `routers/auth_simple.py` |
| Auth (enterprise) | Keycloak 22 (OIDC) | 22.0.5 | `docker-compose.yml:428` |
| Event Bus | Redpanda (Kafka API) | v24.2.19 | `docker-compose.yml:130` |
| Graph DB | Neo4j 5.16 + APOC | 5.16.0 | `services/neo4j_service.py` |
| Vector DB | Qdrant | latest | `qdrant_client>=1.9.0` |
| Search | OpenSearch | 2.17.1 | `docker-compose.yml:94` |
| Cache | Redis 7 | 7-alpine | `docker-compose.yml:33` |
| Storage | MinIO | latest | `docker-compose.yml:114` |
| Linter | Ruff | latest | `ruff.toml` |
| Type Check | Mypy strict | >= 1.10.0 | `pyproject.toml` |
| Tests | Pytest + pytest-asyncio + pytest-cov | >= 8.2.0 | `pytest.ini` |
| Circuit Breaker | tenacity | >= 8.3.0 | `pyproject.toml` |
| LLM Gateway | LiteLLM | >= 1.40.0 | `pyproject.toml` |
| ML Core | scikit-learn, XGBoost, Prophet | latest | `pyproject.toml` |
| Metrics | prometheus-client | >= 0.20.0 | `app/main.py:/metrics` |
| Task Queue | Celery[redis] | >= 5.4.0 | `docker-compose.yml:309` |
| Secrets | HashiCorp Vault 1.15 | — | `docker-compose.yml:451` |

#### Frontend

| Призначення | Технологія | Версія | Підтверджено |
|---|---|---|---|
| Bundler | Vite | 5+ | `apps/predator-analytics-ui/` |
| Framework | React | 18 | `App.tsx` |
| Стилі | Tailwind CSS | 3 | — |
| Компоненти | Shadcn UI | latest | — |
| Стан / кеш | TanStack Query | 5 | `App.tsx:QueryClient` |
| Таблиці | TanStack Table | 8 | — |
| Граф | Cytoscape.js | 3.28+ | — |
| Чарти | Recharts + ECharts | — | `components/ECharts.tsx` |
| Анімації | Framer Motion | — | `AppRoutesNew.tsx` |
| Роутинг | React Router DOM | 6 | `AppRoutesNew.tsx` |
| Тести | Vitest + RTL | latest | `src/__tests__/` |

---

## 3. МУЛЬТИТЕНАНТНІСТЬ

### 3.1. Архітектура ізоляції (поточний стан)

| Рівень | Механізм | Статус |
|---|---|---|
| Middleware | TenantContextMiddleware -> set_config('app.current_tenant') | OK |
| PostgreSQL | Row-Level Security (16 таблиць) + set_tenant() | OK |
| Kafka/Redpanda | Топіки `tenant.{id}.category.name` | OK |
| OpenSearch | Фільтрація per tenant_id у кожному запиті | Перевірити |
| Qdrant | Колекції `tenant_{id}_companies` | Впровадити |
| Redis | Ключі `tenant:{id}:cache:*` | Перевірити |
| MinIO | Бакети `tenant-{id}-raw`, `tenant-{id}-processed` | Впровадити |

### 3.2. RBAC Ролі

| Роль | Код | Доступ |
|---|---|---|
| Адміністратор | `admin` | Control Plane + Data Plane всіх tenant-ів |
| Tenant Admin | `tenant_admin` | Керування лише своїм tenant-ом |
| Аналітик | `analyst` | Читання + AI + пошук |
| Аудитор | `auditor` | audit_log + decision_artifacts (Read-only) |
| Оператор | `operator` | Читання + інгестія даних |
| Глядач | `viewer` | Тільки читання |
| Клієнт Basic | `client_basic` | Обмежений програмний доступ |

### 3.3. ABAC Extension (Фаза 2)

Розширення RBAC через casbin + Redis:
- `data_sensitivity`: `public`, `internal`, `restricted`, `top_secret`
- `owner_tenant_id`: сутність належить конкретному tenant-у
- `source_classification`: `osint`, `commercial`, `state`, `restricted`

---

## 4. СХЕМА ДАНИХ POSTGRESQL (Canonical Schema v5.0)

### 4.1. Поточні таблиці (підтверджено `db/postgres/init.sql`)

| Таблиця | Призначення | RLS | WORM |
|---|---|---|---|
| `tenants` | Клієнти платформи | - | - |
| `users` | Користувачі | - | - |
| `companies` | Компанії + CERS | OK | - |
| `persons` | Фізичні особи, PEP | OK | - |
| `declarations` | Митні декларації | OK | - |
| `company_person_links` | Зв'язки | OK | - |
| `sanctions_entries` | Санкційні списки | - | - |
| `uktzed_codes` | Довідник УКТЗЕД | - | - |
| `ingestion_jobs` | Завдання інгестії | OK | - |
| `alerts` | Сповіщення | OK | - |
| `alert_events` | Тригери алертів | OK | - |
| `audit_log` | Журнал аудиту | OK | OK (trigger) |
| `decision_artifacts` | ШІ-рішення | OK | OK (trigger) |
| `risk_scores` | CERS-оцінки | OK | - |
| `som_anomalies` | SOM-аномалії | OK | - |
| `som_proposals` | Пропозиції SOM | OK | - |

### 4.2. Необхідні доповнення (Фаза 1.5 — нові Alembic міграції)

```sql
-- A. SCD Type 2 для companies (повна історія змін)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS business_key UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS valid_to TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_scd
  ON companies(tenant_id, business_key, valid_from);

-- B. Data Lineage
CREATE TABLE IF NOT EXISTS data_lineage (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    source_name TEXT NOT NULL,
    source_id TEXT,
    source_url TEXT,
    confidence_score FLOAT,
    ingested_at TIMESTAMPTZ DEFAULT NOW()
);

-- C. Ідемпотентність Kafka подій
CREATE TABLE IF NOT EXISTS processed_events (
    event_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    source TEXT NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'SUCCESS'
);

-- D. Usage Tracking (квоти / білінг)
CREATE TABLE IF NOT EXISTS usage_tracking (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    metric_type TEXT NOT NULL,
    period_date DATE NOT NULL DEFAULT CURRENT_DATE,
    value BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, metric_type, period_date)
);

-- E. Feature Flags (PostgreSQL fallback для Redis)
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_key TEXT NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT FALSE,
    rollout_percent SMALLINT DEFAULT 0,
    tenant_whitelist UUID[] DEFAULT '{}',
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3. Alembic Zero-Downtime Pattern

```python
# revision: 0005_add_scd_type2_companies
def upgrade() -> None:
    # Крок 1: nullable колонки
    op.add_column('companies', sa.Column('business_key', postgresql.UUID(), nullable=True))
    op.add_column('companies', sa.Column('valid_from', sa.TIMESTAMPTZ(), nullable=True))
    op.add_column('companies', sa.Column('valid_to', sa.TIMESTAMPTZ(), nullable=True))
    op.add_column('companies', sa.Column('is_current', sa.Boolean(), nullable=True, server_default='true'))
    # Крок 2: backfill
    op.execute("UPDATE companies SET business_key = id, valid_from = created_at, is_current = true")
    # Крок 3: NOT NULL constraint
    op.alter_column('companies', 'business_key', nullable=False)
    op.alter_column('companies', 'valid_from', nullable=False)
```

---

## 5. EVENT-DRIVEN PIPELINE (Redpanda / Kafka)

### 5.1. Специфікація топіків (Canonical)

| Topic Name | Призначення | Retention | Гарантія |
|---|---|---|---|
| `tenant.{id}.ingestion.raw` | Сирі дані журналу | 7 днів | At-least-once |
| `tenant.{id}.ingestion.cleaned` | Нормалізовані події | 30 днів | Idempotent |
| `tenant.{id}.entity.resolution` | ERE команди | 7 днів | At-least-once |
| `tenant.{id}.enrichment.events` | Нові факти | 30 днів | Idempotent |
| `tenant.{id}.risk.alerts` | Критичні тригери | 90 днів | Exactly-once |
| `tenant.{id}.dlq` | Невдалі події | 90 днів | — |
| `tenant.{id}.quarantine` | Невалідна схема | 30 днів | — |

### 5.2. Canonical Message Format

```json
{
  "event_id": "01932c6e-9b5a-7a8b-9c0d-1e2f3a4b5c6d",
  "tenant_id": "a0000000-0000-0000-0000-000000000001",
  "source": "customs",
  "source_version": "2026-04-21",
  "timestamp": "2026-04-21T10:30:00Z",
  "schema_version": "v1",
  "payload": {
    "declaration_id": "UA10012026-001",
    "importer_name": "ТОВ Ромашка",
    "importer_edrpou": "12345678",
    "uktzed_code": "8703109090",
    "invoice_value_usd": 150000.00
  }
}
```

### 5.3. Ідемпотентність (Canonical Pattern)

```python
async def process_event(event: dict) -> None:
    event_id = UUID(event["event_id"])
    # Перевірка через таблицю processed_events
    if await is_already_processed(event_id):
        return
    try:
        await process_business_logic(event)
        await mark_as_processed(event_id, tenant_id=UUID(event["tenant_id"]))
    except ValidationError as e:
        await publish_to_quarantine(event, error=str(e))
    except Exception as e:
        await publish_to_dlq(event, error=str(e))
        raise
```

### 5.4. Data Freshness Monitor (Celery Beat Task)

```python
CRITICAL_SOURCES = {
    "customs": timedelta(hours=6),
    "youcontrol": timedelta(hours=24),
    "opensanctions": timedelta(days=7),
    "rnbo": timedelta(hours=12),
}
# При перевищенні порогу -> SEV-2 alert + publish до tenant.{id}.risk.alerts
```

---

## 6. СЕРВІСИ ТА API

### 6.1. Core API — 35 реалізованих роутерів

| Роутер | Endpoint Prefix | Призначення |
|---|---|---|
| `auth` / `auth_simple` | `/api/v1/auth` | JWT аутентифікація |
| `companies` | `/api/v1/companies` | CRUD компаній |
| `persons` | `/api/v1/persons` | Фізичні особи, PEP |
| `declarations` | `/api/v1/declarations` | Митні декларації |
| `risk` | `/api/v1/risk` | CERS scoring |
| `analytics` | `/api/v1/analytics` | Аналітика |
| `graph` | `/api/v1/graph` | Neo4j queries |
| `ingestion` | `/api/v1/ingestion` | Upload, jobs |
| `search` | `/api/v1/search` | Full-text search |
| `alerts` | `/api/v1/alerts` | Сповіщення |
| `dashboard` | `/api/v1/dashboard` | Dashboard data |
| `competitors` | `/api/v1/competitors` | Аналіз конкурентів |
| `copilot` | `/api/v1/copilot` | AI Copilot (RAG) |
| `intelligence` | `/api/v1/intelligence` | OSINT |
| `maritime` | `/api/v1/maritime` | Морські дані |
| `newspaper` | `/api/v1/newspaper` | Медіа-моніторинг |
| `registries` | `/api/v1/registries` | Реєстри України |
| `osint` / `osint_ua` | `/api/v1/osint` | OSINT queries |
| `som` | `/api/v1/som` | SOM anomalies |
| `system` | `/api/v1/system` | System health |
| `factory` | `/api/v1/factory` | OODA Factory |
| `ml_studio` | `/api/v1/ml-studio` | ML моделі |
| `optimizer` | `/api/v1/optimizer` | DSPy оптимізатор |
| `public_api` | `/api/v1/public` | Публічний API |
| `warroom` | `/api/v1/warroom` | War Room |
| `cases` | `/api/v1/cases` | Справи |
| `premium` | `/api/v1/premium` | Premium features |
| `antigravity` | `/api/v1/antigravity` | AGI Orchestrator |
| `agents` | `/api/v1/agents` | AI Agents |
| `websocket` | `/api/v1/ws` | Real-time WebSocket |
| `registries_ui` | `/api/v1/registries-ui` | UI API |
| `stats` | `/api/v1/stats` | Статистика |

### 6.2. URL Policy

```
Production:   http://api.predator.local/api/v1   (через Kong)
Development:  http://localhost:8090/api/v1
Mock:         http://localhost:9080/api/v1        (mock-api-server.mjs)
Frontend:     http://localhost:3030               (HR-10)

JWT payload: { sub, tenant_id, role, exp, iat }
Access token TTL: 60 хв | Refresh: 7 днів
```

### 6.3. MCP Router Tri-State

```
SOVEREIGN (Red):  100% Local -> Ollama (Nemotron MoE, Qwen3-Coder)
HYBRID (Green):   Баланс -> Groq/Gemini Flash + Local
CLOUD (Blue):     Хмарний -> Gemini Pro, GLM-5.1, Azure Fallback

VRAM Guard (GTX 1080 8GB):
  LLM Pool:   max 5.5GB
  WebGL UI:   2.5GB
  При >7.6GB: AUTO CLOUD OVERRIDE
```

---

## 7. БЕЗПЕКА

### 7.1. Реалізовані засоби (підтверджено кодом)

| Захід | Файл | Статус |
|---|---|---|
| JWT Auth + bcrypt | `routers/auth_simple.py` | OK |
| TenantContextMiddleware | `core/middleware.py` | OK |
| RateLimitMiddleware | `core/middleware_optimization.py` | OK |
| SecurityHeadersMiddleware (CSP) | `core/middleware_optimization.py` | OK |
| PostgreSQL RLS (16 таблиць) | `db/postgres/init.sql:450+` | OK |
| WORM triggers | `init.sql + triggers` | OK |
| Security validation on startup | `core/security.py` | OK |
| Request ID tracing | RequestIDMiddleware | OK |

### 7.2. Дорожня карта безпеки

| Захід | Пріоритет | Фаза |
|---|---|---|
| Kong API Gateway | P1 | Фаза 2 |
| Vault Dynamic Secrets | P1 | Фаза 2 |
| Keycloak OIDC інтеграція | P2 | Фаза 2 |
| casbin ABAC | P3 | Фаза 2 |
| mTLS (Istio/Cilium) | P3 | Фаза 3 |
| WAF (Kong plugin) | P3 | Фаза 2 |
| ip Allowlist для Admin | P4 | Фаза 2 |
| Trivy image scanning | P4 | CI зараз |

---

## 8. СПОСТЕРЕЖУВАНІСТЬ

### 8.1. Реалізований стек

| Компонент | Порт | Призначення |
|---|---|---|
| Prometheus | 9090 | Збір метрик |
| Grafana | 3001 | Дашборди |
| Loki | 3100 | Агрегація логів |
| Alertmanager | 9093 | Сповіщення |
| DCGM Exporter | 9400 | GPU метрики (GTX 1080) |

### 8.2. Обов'язкові Grafana дашборди

```
1. "API Health & Latency"    -> predator_api_latency_seconds{quantile="0.95"}
2. "Kafka Lag Monitor"       -> kafka_consumer_group_lag (alert > 1000)
3. "GPU / AI Inference"      -> nvidia_gpu_memory_used_bytes
4. "CERS Recalculation"      -> predator_cers_updates_total
5. "Tenant Usage"            -> predator_api_calls_total{tenant_id}
6. "DLQ Monitor"             -> predator_dlq_size_total (alert > 100)
7. "Data Freshness"          -> predator_source_last_updated_seconds
```

### 8.3. Alerting Severity

| Рівень | Опис | Час реакції |
|---|---|---|
| SEV-1 | API Gateway down, PostgreSQL down | 5 хв |
| SEV-2 | Kafka lag > 5000, AI queue overflow | 15 хв |
| SEV-3 | DLQ spike, Data freshness alert | 1 год |

---

## 9. FAULT TOLERANCE

### 9.1. Реалізовані механізми

| Механізм | Реалізація |
|---|---|
| Circuit Breaker | tenacity (pyproject.toml) |
| Graceful Degradation | lifespan() warning mode (main.py:99-128) |
| Sovereign Guardian | Auto-healing loop (services/guardian.py) |
| Health checks (3 рівні) | /health, /health/ready, /health/live |
| DLQ Processing | kafka_dlq.py |

### 9.2. Canonical Retry / Timeout Policy

```
Retry: exponential backoff (1с, 2с, 4с, 8с, 16с cap 30с), 5 спроб
Circuit Breaker OPEN після: 50% помилок за 10 сек
HALF-OPEN через: 30 сек
Fallback: Redis cache (TTL 1 год)

Timeouts:
  API requests:       2 сек
  DB queries:         1 сек
  AI Inference:       5 сек (GPU), 10 сек (CPU fallback)
  External OSINT API: 30 сек
```

---

## 10. AI / ML АРХІТЕКТУРА

### 10.1. CERS Formula

```
CERS = 0.40*SanctionIndex + 0.25*OffshoreIndex
     + 0.20*CustomsAnomaly + 0.15*NewsIndex

Z-score normalization для кожного субіндексу
PCA-декореляція між корельованими індексами

Рівні:
  0-20:   Stable     (зелений)
  21-40:  Watchlist  (жовтий)
  41-60:  Elevated   (помаранчевий)
  61-80:  High Alert (червоний)
  81-100: Critical   (темно-червоний)
```

### 10.2. Confidence Score

```
CS = 0.25*Completeness + 0.20*ModelStability
   + 0.25*HistoricalAccuracy + 0.15*IndexVariance
   + 0.15*(1 - DriftScore)

Реалізація: services/core-api/app/core/confidence.py
```

### 10.3. GPU Budget (GTX 1080 — 8GB VRAM)

```
ollama_llm: 4.5GB    (Qwen3-Coder або Llama-3-8B 4-bit quant)
embeddings: 1.0GB    (intfloat/multilingual-e5-small)
whisper:    2.0GB    (опціонально)
tts:        CPU      (64GB RAM — CPU inference)
guard:      0.5GB    (резерв)

При >7.6GB -> CLOUD OVERRIDE (MCP Router автоматично)
```

---

## 11. ФРОНТЕНД АРХІТЕКТУРА

### 11.1. Application State Machine

```
BOOTING -> LOGIN -> READY

BOOTING: BootSequenceWRAITH.tsx (cinematic boot)
LOGIN:   LoginScreen.tsx (authen + role selection)
READY:   AppRoutesNew.tsx + Layout + Global Components
```

### 11.2. Hub Architecture

| Hub | Маршрут | Колір | Tabs |
|---|---|---|---|
| CommandHub | `/command` | Gold | board, brief, risk, observer, warroom |
| MarketHub | `/market` | Amber | customs, flows, suppliers, price |
| SearchHub | `/search` | Cyan | search, registries, documents, newspaper |
| OSINTHub | `/osint` | Purple | diligence, ubo, graph, sanctions |
| FinancialHub | `/financial` | Emerald | aml, swift, offshore, assets |
| AIHub (Nexus) | `/nexus` | Blue | agents, hypothesis, insights, knowledge, oracle |
| SystemHub | `/system` | Gray | monitoring, settings (клієнтські ролі) |
| AdminHub | `/admin/command` | Crimson | infra, failover, gitops, agents-ops, security, dataops |

### 11.3. Глобальні компоненти (стан READY)

```tsx
<QuickActionsBar />    // Швидкі дії
<ToasterProvider />    // Toast сповіщення
<OnboardingWizard />   // Онбординг нових юзерів
<OfflineBanner />      // Офлайн/деградований режим
<Predator />           // AI Copilot (RAG чат)
<LiveAgentTerminal />  // Командний термінал (Ctrl+`)
```

---

## 12. ІНФРАСТРУКТУРА

### 12.1. Deployment Profiles

```
local profile:   Mac-розробник
  -> frontend (3030) + mock-api (9080)
  -> НЕ запускаємо: keycloak, vault, prometheus, grafana, ollama

server profile:  NVIDIA Server (194.177.1.240)
  -> Повний стек включно з GPU, monitoring, security
```

### 12.2. Node Capacity Contract

```
Server: 194.177.1.240
  CPU: 20 vCPU | RAM: 64 GB | GPU: GTX 1080 (8GB) | Disk: 1TB NVMe

RAM Budget:
  OS + K3s:        4 GB
  Data Platform:  18 GB  [PG 8G, ES 4G, Neo4j 4G, Qdrant 2G, RP 3G, Redis 4G]
  AI/ML (Ollama):  8 GB
  API + Workers:  12 GB
  Observability:   4 GB
  Security (IAM):  2 GB
  Резерв:         16 GB
```

### 12.3. GitOps CI/CD Pipeline

```
git push -> GitHub Actions CI:
  ruff + mypy --strict + pytest (>80%) + vitest (>70%) + trivy

Docker Build -> GHCR
GitOps Update -> predator-gitops (Helm values)
ArgoCD Sync -> K3s (Canary: 5% -> 50% -> 100%)
Argo Rollouts -> Auto-rollback при SLA порушенні
```

---

## 13. DISASTER RECOVERY

| Компонент | Стратегія | RTO | RPO |
|---|---|---|---|
| PostgreSQL | WAL-G continuous + daily pg_dump -> MinIO | 1 год | 5 хв |
| MinIO | Versioning + replication | 2 год | 1 год |
| Redpanda | Tiered Storage -> MinIO | 30 хв | 5 хв |
| Neo4j | Daily snapshot -> MinIO | 4 год | 24 год |
| K3s | Velero snapshots -> MinIO | 2 год | 1 год |

---

## 14. ТЕСТУВАННЯ

| Рівень | Інструменти | Покриття | Розташування |
|---|---|---|---|
| Unit | pytest | > 80% backend | `services/*/tests/` |
| Integration | pytest + Docker Compose | Критичні потоки | `tests/integration/` |
| Contract | pact | API між сервісами | `contracts/` |
| DOM | Vitest + RTL | > 70% frontend | `apps/*/src/__tests__/` |
| E2E | Playwright | Критичні сценарії | `tests/e2e/` |
| Load | k6 | 500 concurrent | `tests/load/` |
| Chaos | LitmusChaos | Pod failures | `tests/chaos/` |

---

## 15. ПЛАН ІНТЕГРАЦІЇ v4.2 -> v5.0 (Execution Roadmap)

### Фаза 0: Стабілізація (1-2 тижні) — ЗАРАЗ
- [ ] Ревізія .env змінних -> .env.example актуалізація
- [ ] Перевірити Alembic міграції (консистентність з init.sql)
- [ ] Додати таблицю `processed_events` (ідемпотентність Kafka)
- [ ] Активувати OpenTelemetry tracing (main.py:198 - закоментовано)
- [ ] Виправити test coverage -> ціль >80%
- [ ] Перевірити tenant isolation в OpenSearch

### Фаза 1: Event-Driven Pipeline (2-4 тижні)
- [ ] Стандартизація топіків Redpanda (розділ 5.1)
- [ ] Ідемпотентність у всіх consumers
- [ ] DLQ Handler API (/api/v1/system/dlq/*)
- [ ] Data Freshness Monitor (Celery Beat task)
- [ ] Quarantine топік + Schema Drift alerts

### Фаза 1.5: Data Schema Enhancement (2 тижні)
- [ ] Alembic: SCD Type 2 для `companies` та `persons`
- [ ] Alembic: таблиця `data_lineage`
- [ ] Alembic: таблиця `usage_tracking`
- [ ] Alembic: таблиця `feature_flags`
- [ ] confidence_score у кожен запис

### Фаза 2: Security & Infrastructure (3-5 тижнів)
- [ ] Kong API Gateway (443 -> backend:8000)
- [ ] Vault dynamic secrets (міграція з .env)
- [ ] Keycloak OIDC інтеграція
- [ ] casbin ABAC
- [ ] Schema Registry (Apicurio)
- [ ] Qdrant + MinIO tenant isolation

### Фаза 3: Advanced AI (4-6 тижнів)
- [ ] Entity Resolution Engine (повна реалізація з Qdrant)
- [ ] SHAP explanations для кожного CERS сигналу
- [ ] Neo4j щоденні снапшоти
- [ ] Drift Detection для ML моделей
- [ ] Whisper транскрибація

### Фаза 4: Platform Maturity (6-8 тижнів)
- [ ] mTLS між сервісами (Istio або Cilium)
- [ ] Chaos Testing (LitmusChaos)
- [ ] SLA 99.5% підтвердження (k6 load tests)
- [ ] GDPR/Data Retention automation
- [ ] AutoML + нічний retraining

---

## 16. HARD RULES (25 ПРАВИЛ — НЕЗМІННІ)

```
HR-01  Python 3.12 ONLY
HR-02  Mypy strict — жодних Any без # type: ignore[reason]
HR-03  Коментарі / документація / Git commits / UI — ВИКЛЮЧНО українською
HR-04  Англійська в UI = критична помилка
HR-05  Docker: ЗАВЖДИ multi-stage, НІКОЛИ root (USER predator)
HR-06  Секрети: НІКОЛИ в коді (тільки env vars -> Vault Phase 2)
HR-07  SQL: НІКОЛИ SELECT * — тільки конкретні колонки
HR-08  Pod: ЗАВЖДИ resource limits (cpu + memory)
HR-09  Кожна зміна: тести (Pytest для API, Vitest для DOM)
HR-10  Порт UI: 3030 | Core API: 8000/8090 | Mock API: 9080
HR-11  Не читати: .venv, node_modules, dist, __pycache__, .git, coverage/
HR-12  Linter: Ruff (ruff.toml)
HR-13  Формат коміту: feat|fix|chore|docs|test|refactor(scope): опис
HR-14  Залежності без оновлень > 1 року: ЗАБОРОНЕНО
HR-15  Зовнішні SaaS (Sentry, GA, etc.): ЗАБОРОНЕНО
HR-16  WORM таблиці (audit_log, decision_artifacts): UPDATE/DELETE = ERROR
HR-17  Kafka/Redpanda топіки: ТІЛЬКИ tenant.{id}.{category}.{name}
HR-18  NVMe ONLY для production storage
HR-19  GPU GTX 1080: максимум 5.5GB для LLM Pool
HR-20  Autonomous Commit Protocol: add -> commit -> pull --rebase -> push
HR-21  Mock API (mock-api-server.mjs): завжди синхронізований з реальними ендпоінтами
HR-22  Confidence Score — обов'язковий для кожного AI-сигналу
HR-23  Кожне AI-рішення -> decision_artifacts (WORM)
HR-24  UI: без заглушок-зображень (використовувати generate_image)
HR-25  Backend: ТІЛЬКИ async operations (синхронні заборонені у FastAPI handlers)
```

---

## 17. ГЛОСАРІЙ

| Термін | Визначення |
|---|---|
| UEID | Universal Economic ID — унікальний ідентифікатор суб'єкта |
| CERS | Composite Economic Risk Score — індекс ризику (0-100), 5 рівнів |
| BVI | Behavioral Volatility Index |
| AAI | Administrative Asymmetry Index |
| IM | Influence Mass (Neo4j) |
| MCI | Missing Chain Index |
| PFI | Phantom Flow Index |
| ERE | Entity Resolution Engine |
| SCD Type 2 | Slowly Changing Dimension — повна історія змін |
| RAG | Retrieval-Augmented Generation |
| Signal Bus | Шина подій (Redpanda, Kafka-compatible) |
| Decision Artifact | WORM запис кожного AI-рішення |
| TTS | Text-to-Speech — "Артем" |
| SIO | Self-Improvement Orchestrator |
| MCP Router | Model Context Protocol Router — LLM gateway |
| ACP | Autonomous Commit Protocol |
| WRAITH | Design System v58.2+ (rose-crimson) |
| WORM | Write-Once-Read-Many |
| DLQ | Dead Letter Queue |
| Tenant | Ізольований клієнт платформи (UUID) |

---

## 18. ІНДЕКС КЛЮЧОВИХ ФАЙЛІВ

| Файл | Призначення |
|---|---|
| `services/core-api/app/main.py` | FastAPI lifespan, routers, middleware |
| `db/postgres/init.sql` | Повна схема PostgreSQL (RLS + WORM) |
| `services/core-api/app/routers/` | 35 API роутерів |
| `services/core-api/app/services/aml_scoring.py` | AML/CERS engine |
| `services/core-api/app/services/anomaly_detection.py` | SOM + ML anomalies |
| `services/core-api/app/services/neo4j_service.py` | UBO graphs |
| `services/core-api/app/services/kafka_service.py` | Kafka producer/consumer |
| `services/core-api/app/services/guardian.py` | Auto-healing |
| `services/ingestion-worker/app/` | ETL pipeline |
| `services/graph-service/app/` | Neo4j microservice |
| `services/mcp-router/app/` | LLM gateway |
| `apps/predator-analytics-ui/src/App.tsx` | React entry + state machine |
| `apps/predator-analytics-ui/src/AppRoutesNew.tsx` | 50+ маршрутів + RBAC |
| `mock-api-server.mjs` | Mock server (порт 9080) |
| `docker-compose.yml` | Повний стек (590 рядків) |
| `deploy/helm/` | Helm charts для K3s |
| `deploy/argocd/` | ArgoCD applications |
| `services/core-api/alembic/` | DB migrations |
| `pyproject.toml` | Python deps + Mypy + Ruff |
| `AGENTS.md` | Canonical AI agent rules |

---

Документ підготовлено на основі аудиту реального коду Predator_60 (2026-04-21).
Наступне оновлення: після завершення Фази 1 (Event-Driven Pipeline).
© Predator Analytics — Канонічне ТЗ v5.0 | ОБОВ'ЯЗКОВЕ ДО ВИКОНАННЯ
