# PREDATOR v55.0 — ДЕТАЛЬНІ ЗАДАЧІ ПО ФАЗАХ

**Останнє оновлення:** 2026-03-02 | **Поточна фаза:** 1 (Фундамент)

> **Канонічне ТЗ:** [`V55_TECHNICAL_SPECIFICATION.md`](./V55_TECHNICAL_SPECIFICATION.md) — єдине джерело істини для архітектури, компонентів (238), формул, SLO та заборон.

---

## ФАЗА 0: СТАБІЛІЗАЦІЯ ✅ ЗАВЕРШЕНО

> Усі задачі Фази 0 виконані. Код у кодовій базі.

| # | Задача | Файл | Статус |
|---|--------|------|--------|
| F0-001 | Видалити дублікати docker-compose (neo4j×2, backend×2, celery×2) | `docker-compose.yml` | ✅ |
| F0-002 | Єдина мережа `predator-network` | `docker-compose.yml` | ✅ |
| F0-003 | Hardcoded secrets → `${ENV}` | `docker-compose.yml`, `app/libs/core/config.py` | ✅ |
| F0-004 | Версія 55.0.0 скрізь | `app/main.py`, `config.py`, `.env.example` | ✅ |
| F0-005 | Структура директорій v55 | `app/engines/`, `indices/`, `datasets/`, `api/v2/`, `models/v55/` | ✅ |
| F0-006 | Модулі ядра v55 | `app/core/i18n.py`, `ueid.py`, `confidence.py`, `signal_bus.py` | ✅ |
| F0-007 | 9 індексів | `app/indices/bvi.py` ... `pfi.py` | ✅ |
| F0-008 | 8 двигунів | `app/engines/behavioral.py` ... `cers.py` | ✅ |
| F0-009 | Pydantic моделі v55 | `app/models/v55/ueid.py`, `signal.py`, `cers.py`, `decision_artifact.py` | ✅ |
| F0-010 | API v2 роутери | `app/api/v2/entities.py`, `analytics.py`, `signals.py`, `decisions.py` | ✅ |
| F0-011 | SQL міграція v55 | `migrations/003_v55_decision_artifacts.sql` | ✅ |
| F0-012 | Frontend i18n | `uk.json` (200+ ключів), `en/common.json` | ✅ |
| F0-013 | requirements.txt v55 | Видалено `chromadb`/`openai`, додано `scipy`, `aiokafka`, `neo4j` | ✅ |

---

## ФАЗА 1: ФУНДАМЕНТ (місяці 1-3)

### F1-001: UEID System — DB Persistence

**Що є:** `app/core/ueid.py` (генерація, нормалізація, валідація ЄДРПОУ), `app/api/v2/entities.py` (заглушки).

**Що треба:**
- Підключити `app/libs/core/database.py` для INSERT/SELECT в `v55.entities`
- Реалізувати fuzzy matching через `pg_trgm` (similarity > 0.85)
- Кеш resolved UEID в Redis (TTL 1 година)
- Алембік міграція `versions/001_v55_ueid.py`

**SQL схема:** вже в `migrations/003_v55_decision_artifacts.sql` (таблиця `v55.entities`).

**API endpoints (вже створені, треба підключити DB):**
```
POST /api/v2/entities/resolve   — пошук або створення UEID
GET  /api/v2/entities/{ueid}    — повне досьє
GET  /api/v2/entities/          — пошук за назвою/ЄДРПОУ
```

---

### F1-002: Data Fusion Engine — DB Persistence

**Що є:** `app/engines/data_fusion.py` (нормалізатори для customs/tax/EDR, fingerprint).

**Що треба:**
- Інтеграція з UEID resolve при інгестії
- Pipeline: raw → normalize → fingerprint → resolve UEID → index
- Запис FusedRecord в PostgreSQL
- Відправка `data.ingested` в Signal Bus

---

### F1-003: Behavioral Engine — DB Persistence

**Що є:** `app/engines/behavioral.py`, `app/indices/bvi.py`, `ass.py`, `cp.py`.

**Що треба:**
- Підключити до DB: зберігати BehavioralScore в `v55.behavioral_scores`
- Автоматичне обчислення при `data.ingested` сигналі
- Відправка `signal.behavioral` через Signal Bus

**PostgreSQL таблиця (додати в наступну міграцію):**
```sql
CREATE TABLE IF NOT EXISTS v55.behavioral_scores (
    id BIGSERIAL PRIMARY KEY,
    ueid UUID NOT NULL REFERENCES v55.entities(ueid),
    bvi FLOAT NOT NULL,
    ass FLOAT NOT NULL,
    cp FLOAT NOT NULL,
    inertia_index FLOAT,
    confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_window_start DATE,
    data_window_end DATE
);
CREATE INDEX IF NOT EXISTS idx_behav_ueid ON v55.behavioral_scores(ueid, calculated_at DESC);
```

---

### F1-004: Базова інгестія v55

**Що треба:**
- POST `/api/v2/ingestion/upload` — прийом Excel/CSV/PDF
- Валідація → parse → Data Fusion → UEID → embed → index
- SSE прогрес: GET `/api/v2/ingestion/progress/{job_id}`
- Celery task для фонової обробки
- Kafka event `ingestion.completed`

---

### F1-005: Decision Artifacts — DB Persistence

**Що є:** `app/api/v2/decisions.py` (заглушка), `app/models/v55/decision_artifact.py`.

**Що треба:**
- Підключити INSERT в `v55.decision_artifacts` (SQL вже в міграції 003)
- WORM trigger вже створений — тест: `UPDATE decision_artifacts SET ...` → EXCEPTION
- Інтеграція: кожен CERS розрахунок → Decision Artifact

---

### F1-006: Confidence Score ✅ (модуль створений)

**Файл:** `app/core/confidence.py` — повністю реалізований.

**Що треба:** інтегрувати в кожен engine (behavioral, institutional, ...) — **вже зроблено**.

---

### F1-007: Kafka Signal Bus — Підключення до Redpanda

**Що є:** `app/core/signal_bus.py` (envelope, topics, SignalBus клас з graceful degradation).

**Що треба:**
- Тест підключення до Redpanda (вже в docker-compose)
- Створити topics автоматично при старті
- Consumer для `data.ingested` → trigger engines
- DLQ (Dead Letter Queue) для failed events

---

### F1-008: Alembic конфігурація

**Що треба:**
- `alembic.ini` + `app/migrations/env.py`
- Baseline: `migrations/001_*.sql`, `002_*.sql`, `003_*.sql`
- Тест: `alembic current` працює

---

### F1-009: Competitor Radar UI

**Що треба:**
- Перший v55 React компонент
- Таблиця суб'єктів з CERS рейтингом
- Фільтри за entity_type, CERS level
- Повністю українською

---

**Checkpoint Фази 1:**
- [x] UEID persist в DB, fuzzy matching працює
- [x] BVI/ASS/CP обчислюються з реальних даних
- [x] Excel інгестія → parse → UEID → index
- [x] Decision Artifacts записуються (WORM)
- [x] Signal Bus підключений до Redpanda
- [x] Alembic конфігурація та міграції створені
- [ ] /api/v1 НЕ зламаний
- [x] Competitor Radar UI (F1-009) — ✅ ЗАВЕРШЕНО


---

## ФАЗА 2: РОЗШИРЕННЯ (місяці 4-6)

### F2-001: Institutional Engine

**Що є:** `app/engines/institutional.py`, `app/indices/aai.py`, `pls.py`.

**Що треба:** DB persistence, автоматичний trigger при data.ingested.

---

### F2-002: Influence Engine

**Що є:** `app/engines/influence.py`, `app/indices/im.py`, `hci.py`.

**Що треба:** Інтеграція з Neo4j для centrality metrics (eigenvector, betweenness).

---

### F2-003: Entity Graph (повний)

**Що є:** `app/engines/entity_graph.py` (NodeType, EdgeType, upsert, neighbors).

**Що треба:**
- Підключити до Neo4j (driver вже в stub mode)
- 8 типів вузлів: Company, Person, Broker, CustomsPost, Product, RegulatoryEvent, Tender, MediaMention
- 9 типів ребер: IMPORTS, OWNS, DIRECTS, CERTIFIED_BY, RELATED_TO, MENTIONED_IN, PARTICIPATED, AFFECTS, WORKS_AT
- Louvain community detection
- Daily snapshots → MinIO (03:00, spec 3.12)
- Approximate centrality для top 1000 nodes

---

### F2-004: CERS v1 (3 шари)

**Що є:** `app/engines/cers.py` (повна реалізація з Z-score, min-max, декорреляція, v1/v2 mode).

**Що треба:**
- Автоматичний перерахунок при оновленні будь-якого шару
- Зберігання історії в `v55.cers_scores`
- Telegram alert при level_changed
- SHAP пояснення (Phase 3)

---

### F2-005: Keycloak + Vault

**Що треба:**
- Додати keycloak сервіс в docker-compose (profile: server)
- Feature flag: `AUTH_PROVIDER: str = "legacy" | "keycloak"`
- OIDC інтеграція: `/api/v2/auth/callback`
- Vault для secrets rotation

**Docker Compose:**
```yaml
keycloak:
  image: quay.io/keycloak/keycloak:24.0
  container_name: predator_keycloak
  command: start-dev --import-realm
  environment:
    KC_DB: postgres
    KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak_db
    KC_DB_USERNAME: ${POSTGRES_USER:-admin}
    KC_DB_PASSWORD: ${POSTGRES_PASSWORD}
    KEYCLOAK_ADMIN: ${KEYCLOAK_ADMIN:-admin}
    KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
  ports: ["8080:8080"]
  depends_on: [postgres]
  networks: [predator-network]
  profiles: ["server"]
```

---

### F2-006: RAG Chat через MCP

Ollama + Qdrant + стрімінг SSE. Використовує існуючий MCP Router.

### F2-007: Граф зв'язків UI

Cytoscape.js візуалізація Entity Graph.

### F2-008: Dataset Manager UI

CRUD для датасетів шарів 1-3 (behavioral, institutional, influence).

**Checkpoint Фази 2:**
- [ ] AAI, PLS, IM, HCI обчислюються
- [ ] CERS v1 (3 шари) працює
- [ ] Neo4j граф будується і візуалізується
- [ ] Keycloak auth працює (feature flag)
- [ ] RAG chat через MCP відповідає

---

## ФАЗА 3: ПРОГНОСТИКА (місяці 7-9)

### F3-001: Structural Gaps Engine

**Що є:** `app/engines/structural_gaps.py`, `app/indices/mci.py`, `pfi.py`.

**Що треба:** DB persistence, нові індекси TDI, LGS.

### F3-002: Predictive Engine

**Що є:** `app/engines/predictive.py` (heuristic model).

**Що треба:**
- Online models: LogisticRegression, LightGBM (runtime)
- Offline models: XGBoost, CatBoost, Monte Carlo (nightly batch)
- MLflow model registry інтеграція
- Feast feature store

**Нові залежності (додати при потребі):**
```
xgboost==2.0.3
catboost==1.2.3
lightgbm==4.3.0
shap==0.45.0
feast==0.38.0
```

### F3-003: CERS v2 (повний, 5 шарів)

**Що є:** `app/engines/cers.py` вже підтримує 5-layer mode.

**Що треба:**
- PCA декорреляція (повна, замість proxy)
- SHAP пояснення для кожного компонента
- A/B тестування v1 vs v2

### F3-004: MLflow + Feast

Model Registry + Feature Store інтеграція.

### F3-005: TTS "Артем" + Whisper STT

Coqui/Piper TTS українською, Whisper для транскрипції.

### F3-006: Graph Snapshots

Daily 03:00 → MinIO, approximate centrality для >1000 nodes.

### F3-007: SHAP пояснення

Для кожного сигналу та CERS компонента.

**Checkpoint Фази 3:**
- [ ] Усі 5 аналітичних шарів працюють
- [ ] CERS v2 (5 шарів) коректний
- [ ] Predictive models дають прогнози
- [ ] TTS/STT працює українською
- [ ] SHAP пояснення генеруються
- [ ] p95 latency < 3с

---

## ФАЗА 4: ЕКОСИСТЕМА (місяці 10-12)

| ID | Завдання | Деталі |
|----|----------|--------|
| F4-001 | ArgoCD GitOps | Automated sync, rollback policy |
| F4-002 | Kyverno + Falco | Policy enforcement, runtime security |
| F4-003 | Повний моніторинг | Loki, Tempo, AlertManager, SLO dashboard |
| F4-004 | Public API + SDK | OpenAPI 3.1 docs, Python SDK, rate limiting |
| F4-005 | Документація | MkDocs українською, user guides |
| F4-006 | Ethical Audit | Quarterly audit framework |

**Checkpoint Фази 4:**
- [ ] GitOps працює, Zero Trust
- [ ] Повна документація українською
- [ ] Production-ready

---

## КАРТА ЗАЛЕЖНОСТЕЙ

```
F0 ✅ (Стабілізація — ЗАВЕРШЕНО)
  └── F1-001 UEID persist ← структура v55
       ├── F1-002 Data Fusion persist ← UEID
       │    └── F1-004 Інгестія v55 ← Data Fusion
       ├── F1-003 Behavioral persist ← UEID, Data Fusion
       │    └── F2-004 CERS v1 ← Behavioral
       ├── F1-005 Decision Artifacts persist ← SQL міграція
       ├── F1-006 Confidence ✅ (модуль створений)
       └── F1-007 Signal Bus ← Redpanda

F2 (Розширення)
  ├── F2-001 Institutional persist ← UEID, Data Fusion
  ├── F2-002 Influence persist ← Entity Graph (F2-003)
  ├── F2-003 Entity Graph ← Neo4j, UEID
  ├── F2-004 CERS v1 ← Behavioral + Institutional + Influence
  ├── F2-005 Keycloak ← (незалежний, feature flag)
  ├── F2-006 RAG Chat ← MCP Router, Qdrant
  └── F2-007 Граф UI ← Entity Graph, Cytoscape.js

F3 (Прогностика)
  ├── F3-001 Structural persist ← UEID, Data Fusion
  ├── F3-002 Predictive ML ← усі 4 шари, MLflow, Feast
  ├── F3-003 CERS v2 ← усі 5 шарів
  └── F3-005 TTS/STT ← (незалежний)

F4 (Екосистема) ← F0-F3 завершені
```
