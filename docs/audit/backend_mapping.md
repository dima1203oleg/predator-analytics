# 🔍 BACKEND AUDIT: Маппінг сервісів → COMP-ID v4.2.0

> **Дата аудиту:** 7 березня 2026
> **Файлів проаналізовано:** 116 сервісів, 24 моделі, 57 API файлів, 11 схем
> **Висновок:** ~35% існуючого коду напряму маппиться на MVP COMP-ID

---

## 1. CORE PLATFORM (COMP-001 – COMP-030)

### ✅ Вже відповідають ТЗ (мінімальний рефакторинг)

| COMP-ID | Назва | Існуючий файл | Стан | Дія |
|---------|-------|--------------|------|-----|
| COMP-006 | fastapi-app | `app/main.py` | ✅ Працює | Оновити title на v4.2.0 |
| COMP-007 | config-service | `app/core/config.py` + `app/core/settings.py` | ✅ | Об'єднати в один canonical |
| COMP-013 | ci-pipeline | `.github/workflows/ci.yml` | ✅ | OK |
| COMP-014 | ruff-config | `ruff.toml` | ✅ | OK |
| COMP-015 | pytest-config | `pytest.ini` | ✅ | OK |
| COMP-016 | vite-config | `vite.config.ts` | ✅ | OK |
| COMP-018 | mock-api-server | `mock-api-server.mjs` | ✅ | OK |
| COMP-020 | docker-compose-dev | `docker-compose.yml` | ✅ | OK |
| COMP-023 | pyproject-config | `pyproject.toml` | ✅ | OK |
| COMP-024 | agents-md | `AGENTS.md` | ✅ | OK |

### 🔄 Існують, потребують рефакторингу

| COMP-ID | Назва | Існуючий файл | Проблема | Дія |
|---------|-------|--------------|---------|-----|
| COMP-008 | database-core | `app/core/database.py` | Дві версії Base (в database.py і entities.py) | Об'єднати Base |
| COMP-009 | security-core | `app/core/security.py` | Є JWT, немає RBAC middleware | Додати RBAC |
| COMP-010 | logging-service | `app/core/logging.py` | Є structlog базовий | Додати JSON формат |
| COMP-011 | id-generator (UEID) | `app/core/ueid.py` | ✅ Повноцінний | Мінімальний рефакторинг |
| COMP-017 | api-docs (Swagger) | Автоматично FastAPI | Немає кастомізації | Додати descriptions |
| COMP-019 | migration-tool | `alembic.ini` + `app/migrations/` | Є конфіг, немає canonical env.py | Налаштувати async |
| COMP-027 | health-checks | `app/api/routers/health.py` | Є healthcheck | Додати /ready endpoint |
| COMP-028 | dashboard-api | `app/api/v1/market.py` (overview) | Mock дані | Підключити до БД |
| COMP-029 | search-api | `app/api/routers/search.py` | Є SearchFusion | Рефакторинг під v1 |

### 📋 Відсутні (потрібно створити)

| COMP-ID | Назва | Пріоритет |
|---------|-------|-----------|
| COMP-001 | api-gateway (rate limiting) | MVP — використати middleware |
| COMP-002 | auth-service (Keycloak) | Sprint 6 |
| COMP-003 | user-service | Sprint 6 |
| COMP-005 | audit-logger | Sprint 6 |
| COMP-004 | subscription-manager | Phase 4 |
| COMP-012 | notification-service | Sprint 6 (базовий) |
| COMP-030 | export-service | Phase 4 |

---

## 2. DATA PIPELINE (COMP-031 – COMP-060)

### 🔄 Часткові реалізації

| COMP-ID | Назва | Існуючий файл | Стан | Дія |
|---------|-------|--------------|------|-----|
| COMP-031 | csv-ingest | `app/services/etl_ingestion.py` (~14KB) | 🔄 Є базовий CSV | Рефакторити під canonical |
| COMP-032 | xlsx-ingest | `app/services/etl_ingestion.py` | 🔄 Частково | Виділити окремий модуль |
| COMP-041 | pg-writer | `app/services/etl_ingestion.py` | 🔄 Існує | Batch writer optimization |
| COMP-042 | os-indexer | `app/services/opensearch_indexer.py` (~12KB) | 🔄 Розвинутий | Рефакторити |
| COMP-045 | pipeline-orchestrator | `app/services/unified_pipeline.py` (~29KB) | 🔄 Складний | Спростити для MVP |

### 📋 Відсутні (Sprint 2)

| COMP-ID | Назва | Пріоритет |
|---------|-------|-----------|
| COMP-034 | validator (Pydantic) | P0 — створити з нуля |
| COMP-035 | normalizer (УКТЗЕД, валюти) | P0 |
| COMP-036 | deduplicator (SHA-256) | P0 |
| COMP-037 | geo-enricher | P1 |
| COMP-038 | uktzed-enricher | P1 |
| COMP-040 | price-normalizer | P0 |
| COMP-046 | data-quality-report | P1 |

---

## 3. SIGNAL & PATTERN ENGINE (COMP-061 – COMP-080)

| COMP-ID | Назва | Існуючий файл | Стан |
|---------|-------|--------------|------|
| COMP-061 | signal-extractor | `app/core/signal_bus.py` (~10KB) | 🔄 Є signal bus, але не ML signal |
| COMP-064 | cluster-analyzer | — | 📋 Створити |
| COMP-065 | anomaly-detector | `app/services/anomaly_service.py` (~5KB) | 🔄 Є базовий |
| COMP-068 | trend-detector | — | 📋 Створити |

---

## 4. FORECAST ENGINE (COMP-081 – COMP-110)

### 🔄 Часткові реалізації

| COMP-ID | Назва | Існуючий файл | Стан | Дія |
|---------|-------|--------------|------|-----|
| COMP-099 | forecast-api | `app/api/v1/forecast.py` (~84 рядки) | 🔄 Mock | Підключити ML |
| — | forecast schemas | `app/schemas/forecast.py` (~75 рядків) | ✅ Canonical | Готові! |

### 📋 Відсутні (Sprint 4)

| COMP-ID | Назва |
|---------|-------|
| COMP-081 | demand-forecaster |
| COMP-082 | price-forecaster |
| COMP-087 | prophet-model |
| COMP-088 | xgboost-model |
| COMP-094 | ensemble-selector |
| COMP-095 | confidence-scorer |
| COMP-100 | forecast-cache |
| COMP-189 | prediction-interval-calculator |

---

## 5. DECISION ENGINE (COMP-111 – COMP-140)

| COMP-ID | Назва | Існуючий файл | Стан |
|---------|-------|--------------|------|
| COMP-111 | product-recommender | `app/services/recommendation_service.py` (~432B) | 📋 Заглушка |
| COMP-115 | market-simulator | `app/services/simulation_service.py` (~4KB) | 🔄 Базовий |
| COMP-127 | risk-calculator | `app/services/risk_engine.py` (~3.5KB) | 🔄 Базовий |
| COMP-128 | insight-generator | `app/services/insights_engine.py` (~3KB) | 🔄 Базовий |
| COMP-137 | report-generator | `app/services/report_generator.py` (~17KB) | 🔄 Розвинутий |

---

## 6. GRAPH INTELLIGENCE (COMP-141 – COMP-155)

| COMP-ID | Назва | Існуючий файл | Стан |
|---------|-------|--------------|------|
| COMP-142 | graph-analyzer | `app/services/graph_service.py` (~13KB) | 🔄 Без Neo4j |
| — | graph-builder | `app/services/graph_builder.py` (~5KB) | 🔄 in-memory |
| — | knowledge-graph | `app/services/knowledge_graph.py` (~1.5KB) | 📋 Заглушка |

---

## 7. EXISTING API ROUTES MAPPING

### Canonical v1 (підключені до main.py)

| Роутер | Файл | Endpoints | Стан |
|--------|------|-----------|------|
| market | `app/api/v1/market.py` | `/overview`, `/declarations` | 🔄 Mock data |
| forecast | `app/api/v1/forecast.py` | `/demand`, `/models` | 🔄 Mock data |
| diligence | `app/api/v1/diligence.py` | (не переглянуто) | 🔄 |
| copilot | `app/api/v1/copilot.py` | (не переглянуто) | 🔄 |
| navigation | `app/api/v1/navigation.py` | sidebar menu | ✅ |

### Legacy (НЕ підключені до canonical router)

| Файл | К-сть endpoints | Дія |
|------|----------------|-----|
| `app/api/routers/` (25 файлів) | ~50+ | Поступова міграція |
| `app/api/v2/` (8 файлів) | ~15+ | Оцінити, що корисне |
| `app/api/v25_routes.py` (83KB!) | ~40+ | Архівувати |
| `app/api/azr_routes.py` (22KB) | ~15+ | Видалити/архівувати |

---

## 8. SCHEMAS (Pydantic v2)

| Файл | Стан | Маппінг |
|------|------|---------|
| `app/schemas/market.py` | ✅ Canonical | Sprint 3 |
| `app/schemas/forecast.py` | ✅ Canonical | Sprint 4 |
| `app/schemas/diligence.py` | ✅ | Phase 2 |
| `app/schemas/etl.py` | 🔄 | Sprint 2 |
| `app/schemas/base.py` | ✅ | Shared |
| `app/schemas/canonical.py` | ✅ | Shared |
| `app/schemas/analytics.py` | 🔄 | Sprint 3 |
| `app/schemas/events.py` | 🔄 | Phase 2 |
| `app/schemas/integration.py` | 🔄 | Phase 2 |
| `app/schemas/sources.py` | 🔄 | Sprint 2 |
| `app/schemas/portal.py` | ❓ | Оцінити |

---

## 9. ORM MODELS

### Canonical (використовуються)

| Модель | Файл | Таблиця | Стан |
|--------|------|---------|------|
| Base | `app/core/database.py` | — | ✅ DeclarativeBase |
| Base (legacy) | `app/models/entities.py` | — | ⚠️ Дублікат! |
| Declaration | `app/models/declaration.py` | `declarations` | ✅ Повна |
| Company | `app/models/company.py` | `companies` | ✅ Повна |
| CompanyPerson | `app/models/company.py` | `company_persons` | ✅ Для UBO |
| Product | `app/models/product.py` | `products` | ✅ Повна |
| Source | `app/models/entities.py` | `sources` | ✅ |
| Dataset | `app/models/entities.py` | `datasets` | ✅ |
| Job | `app/models/entities.py` | `jobs` | ✅ |
| Index | `app/models/entities.py` | `indices` | ✅ |
| Artifact | `app/models/entities.py` | `artifacts` | ✅ |
| User | `app/models/user.py` | `users` | 🔄 |
| Alert | `app/models/alert.py` | `alerts` | 🔄 |
| Document | `app/models/document.py` | `documents` | 🔄 |

### v55 Models (потенційно корисні)

| Модель | Файл | Маппінг v4.2.0 |
|--------|------|---------------|
| CERSScore | `app/models/v55/orm/cers_score.py` | COMP-127 (risk-calculator) |
| Entity | `app/models/v55/orm/entity.py` | COMP-180 (entity-resolver) |
| Signal | `app/models/v55/orm/signal.py` | COMP-061 (signal-extractor) |
| FusedRecord | `app/models/v55/orm/fused_record.py` | COMP-036 (deduplicator concept) |

### ⚠️ КРИТИЧНА ПРОБЛЕМА: Два різних Base

```
app/core/database.py:   class Base(DeclarativeBase)  ← Canonical v4.1
app/models/entities.py: Base = declarative_base()     ← Legacy v45

Declaration, Company, Product → використовують Legacy Base!
```

**Рішення (Sprint 1):** Мігрувати всі моделі на `app/core/database.Base`

---

## 10. СЕРВІСИ — КЛАСИФІКАЦІЯ ЗА КОРИСНІСТЮ

### 🟢 Зберегти та рефакторити (23 сервіси)

| Сервіс | Розмір | Маппінг | Спринт |
|--------|--------|---------|--------|
| customs_service.py | 16KB | Market Intelligence | 3 |
| etl_ingestion.py | 14KB | COMP-031,032,041 | 2 |
| opensearch_indexer.py | 12KB | COMP-042 | 2 |
| unified_pipeline.py | 29KB | COMP-045 | 2 |
| graph_service.py | 13KB | COMP-142 | Phase 2 |
| report_generator.py | 17KB | COMP-137 | Phase 2 |
| search_fusion.py | 7KB | COMP-029 | 3 |
| anomaly_service.py | 5KB | COMP-065 | Phase 2 |
| risk_engine.py | 3.5KB | COMP-127 | Phase 2 |
| simulation_service.py | 4KB | COMP-115 | Phase 2 |
| audit_service.py | 6KB | COMP-005 | 6 |
| pipeline_service.py | 23KB | COMP-045 support | 2 |
| health_aggregator.py | 6KB | COMP-027 | 1 |
| monitoring_service.py | 6KB | COMP-175 concept | Phase 2 |
| qdrant_service.py | 9KB | COMP-044 | Phase 2 |
| embedding_service.py | 6KB | COMP-044 support | Phase 2 |
| pii_masking.py | 5KB | Security | 6 |
| auth_service.py | 0.3KB | COMP-002 | 6 (розширити) |
| data_hub_service.py | 18KB | Data Pipeline | 2 |
| analytical_service.py | 6KB | Analytics | 3 |
| detection_service.py | 7KB | Signal Engine | Phase 2 |
| insights_engine.py | 3KB | COMP-128 | Phase 2 |
| ingestion_service.py | 4KB | COMP-031 support | 2 |

### 🟡 Оцінити на Phase 2+ (15 сервісів)

| Сервіс | Розмір | Потенційний маппінг |
|--------|--------|-------------------|
| llm_gateway.py | 9KB | AI Copilot |
| llm/ (6 providers) | ~30KB | AI Copilot |
| llm_council/ (9 файлів) | ~40KB | AI Copilot |
| rag.py | 0.8KB | COMP-124 |
| document_processor.py | 18KB | Data Pipeline |
| media_processor.py | 20KB | Data Pipeline |
| batch_embedder.py | 4KB | Feature Store |
| model_router.py | 11KB | COMP-094 |
| training_service.py | 15KB | ML Pipeline |
| crawler_service.py | 5KB | OSINT |
| opponent_engine.py | 3KB | Competitor Radar |
| wagon_service.py | — | Data Enrichment |
| deep_scan.py | 4KB | Due Diligence |
| minio_service.py | 1.5KB | Storage |
| vault_service.py | 3.5KB | COMP-172 |

### 🔴 Архівувати/видалити (30+ сервісів)

| Сервіс | Причина |
|--------|---------|
| azr_engine.py (27KB) | Legacy AZR, не в ТЗ v4.2.0 |
| azr_engine_v32.py (46KB) | Legacy AZR v32 |
| autonomous_intelligence_v2.py (26KB) | Перестроїти для v4.2.0 |
| autonomous_optimizer.py (15KB) | Не в MVP |
| auto_optimizer.py (15KB) | Дублікат |
| triple_agent_service.py (10KB) | Legacy concept |
| sovereign_memory.py (4KB) | Legacy |
| si_orchestrator.py (9KB) | Legacy |
| evolution_service.py (10KB) | Legacy NAS |
| h2o_manager.py (14KB) | H2O AutoML — не в стеку |
| chaos_tester.py (6KB) | Dev tool |
| code_quality_analyzer.py (6KB) | Dev tool |
| shadow_service.py (4KB) | Legacy |
| federation_service.py (3KB) | Legacy |
| self_healer.py (6KB) | Legacy |
| test_runner.py, test_data_generator.py | Dev tools |
| mock_generator.py | Dev tool |
| state_derivation.py (11KB) | Legacy |
| telegram_*.py (8 файлів, ~250KB) | Окремий проєкт |
| audio_*.py, voice_service.py | Не в ТЗ |
| morning_newspaper_service.py | Legacy |
| avatar_service.py | UI-specific |

---

## 11. ЗВЕДЕНА СТАТИСТИКА

```
BACKEND AUDIT SUMMARY
═════════════════════════════════════════
Загалом файлів (services):         116
  🟢 Зберегти і рефакторити:        23 (20%)
  🟡 Оцінити на Phase 2+:           15 (13%)
  🔴 Архівувати/видалити:            30+ (26%)
  ⬜ Telegram (окремий проєкт):       8 (7%)
  ⬜ LLM/Council (Phase 2):          15 (13%)
  ⬜ Інше/утиліти:                  ~25 (21%)

Загалом ORM моделей:                24
  ✅ Canonical (використовуються):   14
  🔄 v55 (потенційно корисні):        4
  ⬜ NAS/Legacy (архів):              6

API файлів:                          57
  ✅ Canonical v1:                    5
  🔴 Legacy (routers/, v25, azr):   ~40
  🔄 v2 (оцінити):                    8

Schemas:                             11
  ✅ Canonical:                       6
  🔄 Потребує оновлення:              5
═════════════════════════════════════════
```

---

## 12. РЕКОМЕНДАЦІЇ ДЛЯ SPRINT 1

**Негайні дії:**
1. ⚠️ Об'єднати `Base` з `entities.py` і `database.py` → один canonical Base
2. Створити `app/models/__init__.py` з re-export всіх моделей
3. Налаштувати `alembic/env.py` з async engine
4. Видалити `*.bak` файли (`main.py.bak`, `mock-api-server.mjs.bak`)
5. Додати `Country` та `Shipment` моделі (є в Neo4j схемі ТЗ, немає в ORM)
