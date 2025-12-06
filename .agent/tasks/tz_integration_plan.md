# 🎯 План Інтеграції Технічного Завдання Семантичної Пошукової Платформи

## Стан Проекту: Аналіз та Gaps

### ✅ Що Вже Реалізовано (Predator v21)

| Компонент | Статус | Примітки |
|-----------|--------|----------|
| **Backend (FastAPI)** | ✅ 90% | `ua-sources/`, API endpoints, Celery workers |
| **Frontend (React)** | ✅ 85% | SPA на React+TypeScript+Vite |
| **PostgreSQL** | ✅ 100% | Схеми staging/gold, migrations |
| **OpenSearch** | ✅ 100% | Full-text search, індексація |
| **Qdrant** | ✅ 100% | Vector DB для embeddings |
| **MinIO** | ✅ 100% | S3-compatible object storage |
| **Redis** | ✅ 100% | Cache + Celery broker |
| **ETL Pipeline** | ✅ 90% | Parser → Processor → Indexer |
| **Celery Workers** | ✅ 85% | Background tasks (ETL, ingestion) |
| **Docker Compose** | ✅ 100% | Local dev environment |
| **Kubernetes/Helm** | ✅ 70% | Helm charts, ArgoCD setup |
| **Monitoring** | ✅ 70% | Prometheus + Grafana |

### ❌ Що Потрібно Додати/Вдосконалити

#### 1. ML/AI Компоненти (Priority: HIGH 🔴)

| Компонент | Потрібно | Поточний Стан |
|-----------|----------|---------------|
| **Cross-Encoder Reranker** | ❌ Відсутній | Немає |
| **Summarizer Service** | ❌ Відсутній | Немає |
| **NER (SpaCy/Transformers)** | ⚠️ Частково | Є базова підтримка |
| **H2O LLM Studio** | ❌ Відсутній | Немає |
| **Data Augmentor (NLPAug)** | ❌ Відсутній | Немає |
| **Embedding Service** | ✅ Є | `embedding_service.py` |

#### 2. Інтеграції (Priority: MEDIUM 🟡)

| Інтеграція | Статус | Коментар |
|------------|--------|----------|
| **Notion API** | ❌ Немає | Потрібно реалізувати OAuth2 + export |
| **Slack API** | ⚠️ Частково | Є telegram, треба додати Slack |
| **Google Drive API** | ❌ Немає | Потрібно OAuth2 + import |
| **Keycloak Auth** | ✅ Є | В `docker-compose.yml` |

#### 3. Advanced Features (Priority: MEDIUM 🟡)

| Фіча | Статус | Опис |
|------|--------|------|
| **Гібридний пошук (BM25 + Vector)** | ⚠️ Частково | Є окремо, треба об'єднати |
| **RRF (Reciprocal Rank Fusion)** | ❌ Немає | Для злиття результатів |
| **Query expansion/auto-suggest** | ❌ Немає | Автодоповнення |
| **Click-through tracking** | ❌ Немає | Для аналітики |
| **Rate limiting** | ⚠️ Базово | Потрібно розширити |
| **RBAC (Role-Based Access)** | ⚠️ Базово | Є Auth, треба ролі |

#### 4. Інфраструктура та DevOps (Priority: MEDIUM 🟡)

| Компонент | Статус | Що треба |
|-----------|--------|----------|
| **OpenSearch Dashboards** | ✅ Є | Налаштувати дашборди |
| **Loki + Promtail** | ⚠️ Частково | Централізоване логування |
| **Backup/Restore** | ❌ Немає | Automated backups |
| **Multi-env configs** | ✅ Є | Mac/NVIDIA/Oracle |
| **Zero-downtime deployment** | ⚠️ Частково | Rolling updates |

#### 5. Security & Compliance (Priority: HIGH 🔴)

| Вимога | Статус | Потрібно |
|--------|--------|----------|
| **HTTPS/TLS** | ⚠️ Локально ні | Ingress cert-manager |
| **Secret Management** | ⚠️ Базово | Vault або External Secrets |
| **OWASP Top 10** | ⚠️ Частково | Security audit |
| **GDPR Compliance** | ❌ Немає | Data deletion, consent |
| **Audit Logging** | ⚠️ Частково | Structured logs |

---

## 📋 IMPLEMENTATION ROADMAP

### 🚀 **MVP Phase (3 місяці) - Поточний Стан → Базовий MVP**

#### **Milestone 1.1: ML Pipeline Foundation (2 тижні)**
- [ ] **Task 1.1.1**: Інтеграція Sentence-BERT Reranker
  - [ ] Створити `services/ml/reranker_service.py`
  - [ ] Додати модель `cross-encoder/ms-marco-MiniLM-L-12-v2`
  - [ ] Endpoint `/api/v1/search/rerank`
  - [ ] Інтеграція в search pipeline
  
- [ ] **Task 1.1.2**: Summarizer Service
  - [ ] Створити `services/ml/summarizer_service.py`
  - [ ] Використати T5-small або BART-large-cnn
  - [ ] Endpoint `/api/v1/documents/{id}/summary`
  - [ ] Async generation + caching

- [ ] **Task 1.1.3**: Базовий NER для Категоризації
  - [ ] Інтеграція SpaCy (uk_core_news_sm)
  - [ ] Автоматична категоризація в Processor
  - [ ] Збереження entities в PostgreSQL

#### **Milestone 1.2: Гібридний Пошук (1 тиждень)**
- [ ] **Task 1.2.1**: Reciprocal Rank Fusion (RRF)
  - [ ] Імплементація RRF алгоритму в `services/search_fusion.py`
  - [ ] Параметр `semantic=true/false` в `/search`
  - [ ] Налаштовуваний α для weighted fusion

- [ ] **Task 1.2.2**: Query Expansion
  - [ ] Автодоповнення через OpenSearch suggestions
  - [ ] Endpoint `/api/v1/search/suggest`

#### **Milestone 1.3: Базові Інтеграції (1 тиждень)**
- [ ] **Task 1.3.1**: Slack Integration
  - [ ] OAuth2 flow для Slack
  - [ ] POST `/integrations/slack/notify`
  - [ ] Webhook handler для incoming commands

- [ ] **Task 1.3.2**: User Tokens Storage
  - [ ] Таблиця `user_tokens` (вже є в ТЗ)
  - [ ] Шифрування токенів (pgcrypto)

#### **Milestone 1.4: Analytics & Dashboards (1 тиждень)**
- [ ] **Task 1.4.1**: Search Logs Index
  - [ ] Таблиця `search_logs` + OpenSearch index
  - [ ] Async logging (не блокує response)
  - [ ] Click-through tracking endpoint

- [ ] **Task 1.4.2**: Grafana Dashboards
  - [ ] Dashboard: API Performance
  - [ ] Dashboard: Search Analytics
  - [ ] Dashboard: ETL Pipeline Status

#### **Milestone 1.5: Security Hardening (1 тиждень)**
- [ ] **Task 1.5.1**: Rate Limiting
  - [ ] Redis-based rate limiter
  - [ ] Тарифні плани (free: 100 req/day, premium: unlimited)

- [ ] **Task 1.5.2**: RBAC Implementation
  - [ ] Ролі: `user`, `premium`, `admin`
  - [ ] Dependency injection для перевірки ролей
  - [ ] Admin endpoints захищені

#### **Milestone 1.6: Testing & QA (1 тиждень)**
- [ ] **Task 1.6.1**: Unit Tests
  - [ ] Покриття ≥70% для backend
  - [ ] pytest fixtures для DB/Redis/OpenSearch

- [ ] **Task 1.6.2**: Integration Tests
  - [ ] E2E тести основних flows (search, ETL, index)
  - [ ] Testcontainers для ізоляції

---

### 🔥 **Phase 2: Advanced Features (2 місяці)**

#### **Milestone 2.1: H2O LLM Studio Integration (3 тижні)**
- [ ] **Task 2.1.1**: H2O LLM Studio Deployment
  - [ ] Docker image для H2O LLM Studio
  - [ ] Kubernetes deployment (GPU node selector для NVIDIA)
  - [ ] API endpoint для fine-tuning запитів

- [ ] **Task 2.1.2**: Integration з Indexer
  - [ ] Експорт datasets з `gold.documents` в H2O format
  - [ ] Fine-tune Sentence-BERT на domain data
  - [ ] MLflow tracking для моделей

- [ ] **Task 2.1.3**: UI для ML Management
  - [ ] Frontend сторінка `/ml/models`
  - [ ] Перегляд моделей, метрик, деплой

#### **Milestone 2.2: Data Augmentation (1 тиждень)**
- [ ] **Task 2.2.1**: NLPAug Integration
  - [ ] `services/ml/data_augmentor.py`
  - [ ] Synonym replacement, back-translation
  - [ ] Таблиця `augmented_datasets`

- [ ] **Task 2.2.2**: Auto-generation Pipeline
  - [ ] Celery task для aug-генерації
  - [ ] POST `/datasets/augment`

#### **Milestone 2.3: Extended Integrations (2 тижні)**
- [ ] **Task 2.3.1**: Notion API
  - [ ] OAuth2 flow
  - [ ] POST `/integrations/notion/export`
  - [ ] Create Notion page з results

- [ ] **Task 2.3.2**: Google Drive API
  - [ ] OAuth2 flow
  - [ ] POST `/integrations/drive/import`
  - [ ] PDF/DOCX parsing (pdfplumber, python-docx)

#### **Milestone 2.4: Analytics Advanced (1 тиждень)**
- [ ] **Task 2.4.1**: OpenSearch Dashboards Setup
  - [ ] Import predefined dashboards (JSON)
  - [ ] Top queries, error rate, latency graphs
  - [ ] Document growth, category distribution

- [ ] **Task 2.4.2**: Business Metrics API
  - [ ] GET `/analytics/kpi` (MAU, retention, conversion)
  - [ ] GET `/analytics/documents/stats`

---

### 🎨 **Phase 3: Optimization & Production-Ready (1 місяць)**

#### **Milestone 3.1: Performance Optimization (2 тижні)**
- [ ] **Task 3.1.1**: Caching Strategy
  - [ ] Redis cache для popular queries (TTL 60s)
  - [ ] Cache warming для trending searches

- [ ] **Task 3.1.2**: Bulk Indexing Optimization
  - [ ] OpenSearch bulk API (100 docs/batch)
  - [ ] Qdrant batch upsert

- [ ] **Task 3.1.3**: Database Query Optimization
  - [ ] Indexes на hot columns (category, date, source)
  - [ ] Connection pooling (asyncpg)

#### **Milestone 3.2: Security & Compliance (1 тиждень)**
- [ ] **Task 3.2.1**: Penetration Testing
  - [ ] OWASP ZAP scan
  - [ ] Fix vulnerabilities

- [ ] **Task 3.2.2**: GDPR Features
  - [ ] DELETE `/auth/profile` (Right to be forgotten)
  - [ ] Data export endpoint
  - [ ] Consent management

#### **Milestone 3.3: Monitoring & Observability (1 тиждень)**
- [ ] **Task 3.3.1**: Distributed Tracing
  - [ ] Jaeger або Tempo integration
  - [ ] Trace context through services

- [ ] **Task 3.3.2**: Alerting Rules
  - [ ] Prometheus alerts (CPU, latency, errors)
  - [ ] Slack notifications via Alertmanager

#### **Milestone 3.4: Backup & DR (3 дні)**
- [ ] **Task 3.4.1**: Automated Backups
  - [ ] PostgreSQL pg_dump (daily cron)
  - [ ] OpenSearch snapshots (S3/MinIO)
  - [ ] Retention policy (7 days)

- [ ] **Task 3.4.2**: Disaster Recovery Plan
  - [ ] Restore scripts (`scripts/restore_*.sh`)
  - [ ] Test on staging

---## 🛠️ TECHNICAL DEBT & IMPROVEMENTS

### Code Quality
- [ ] Ruff/Black для Python (CI enforcement)
- [ ] ESLint strict mode для TypeScript
- [ ] Pre-commit hooks

### Documentation
- [ ] OpenAPI 3.1 повна схема (Swagger UI)
- [ ] Architecture diagrams (Draw.io або Mermaid)
- [ ] API usage examples + tutorials

### DevOps
- [ ] Multi-arch Docker images (amd64/arm64)
- [ ] Helm chart improvements (CRDs, Jobs)
- [ ] ArgoCD sync waves для порядку деплою

---

## 📊 SUCCESS METRICS

### Technical KPIs
| Metric | Target | Current | Gap |
|--------|--------|---------|-----|
| Search Latency (P95) | <800ms | ~1200ms | -400ms |
| Indexing Throughput | 10k docs/hr | ~3k docs/hr | -7k |
| API Uptime | 99.9% | 98% (local) | -1.9% |
| Unit Test Coverage | ≥70% | ~30% | -40% |
| OpenSearch Precision@5 | ≥80% | N/A | N/A |
| Vector Search Recall@100 | ≥90% | N/A | N/A |

### Business KPIs (for Phase 3+)
- [ ] MAU tracking implemented
- [ ] Conversion tracking (free→premium)
- [ ] NPS survey integration
- [ ] Cost per query calculated

---

## 🎯 NEXT IMMEDIATE ACTIONS

### **Sprint 1 (Week 1-2): ML Foundation**
1. ✅ **Day 1-3**: Setup Reranker Service
   - Create microservice scaffold
   - Download pre-trained model
   - Write unit tests

2. ✅ **Day 4-6**: Integrate into Search
   - Modify `/search` endpoint
   - Add `rerank=true` param
   - Benchmark performance

3. ✅ **Day 7-10**: Summarizer Service
   - T5-small setup
   - Async endpoint
   - Cache in Redis

4. ✅ **Day 11-14**: Testing & Docs
   - Integration tests
   - Update OpenAPI spec
   - Write usage guide

---

## 📦 NEW DEPENDENCIES TO ADD

### Python (requirements.txt)
```txt
# ML & NLP
transformers==4.37.0  # ✅ Вже є
sentence-transformers>=3.0.0  # ✅ Вже є
spacy>=3.7.0  # ❌ Додати
spacy-ukrainian-langmodel  # ❌ Додати
nlpaug>=1.1.11  # ❌ Додати

# Integrations
slack-sdk>=3.27.0  # ❌ Додати
google-api-python-client>=2.100.0  # ❌ Додати
google-auth>=2.25.0  # ❌ Додати
notion-client>=2.2.0  # ❌ Додати

# Security
python-jose[cryptography]>=3.3.0  # ✅ Вже є
argon2-cffi>=23.1.0  # ❌ Додати

# Monitoring
jaeger-client>=4.8.0  # ❌ Додати (опціонально)
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",  // ❌ Додати (data fetching)
    "recharts": "^2.10.0",  // ⚠️ Перевірити версію
    "react-i18next": "^14.0.0"  // ❌ Додати (i18n)
  }
}
```

---

## 🗂️ NEW FILE STRUCTURE

```
predator_21/
├── ua-sources/
│   └── app/
│       ├── services/
│       │   ├── ml/  # 🆕
│       │   │   ├── reranker_service.py
│       │   │   ├── summarizer_service.py
│       │   │   ├── data_augmentor.py
│       │   │   └── h2o_client.py
│       │   ├── integrations/  # 🆕
│       │   │   ├── slack_service.py
│       │   │   ├── notion_service.py
│       │   │   └── gdrive_service.py
│       │   └── search_fusion.py  # 🆕
│       ├── api/
│       │   └── v1/
│       │       ├── ml.py  # 🆕 (ML endpoints)
│       │       └── integrations.py  # ✅ Вже є
│       └── models/
│           └── ml_models.py  # 🆕 (Pydantic schemas)
├── infra/
│   ├── h2o-llm-studio/  # 🆕
│   │   ├── Dockerfile
│   │   └── deployment.yaml
│   ├── opensearch/
│   │   └── dashboards/  # 🆕
│   │       ├── search-analytics.ndjson
│   │       └── system-metrics.ndjson
│   └── postgres/
│       └── migrations/  # ✅ Розширити
│           ├── 005_add_user_tokens.sql
│           ├── 006_add_search_logs.sql
│           └── 007_add_embeddings_table.sql
├── scripts/
│   ├── restore_postgres.sh  # 🆕
│   ├── restore_opensearch.sh  # 🆕
│   └── benchmark_search.py  # 🆕 (performance testing)
└── docs/
    ├── api/
    │   └── openapi_full.yaml  # ✅ Розширити
    ├── ml/
    │   ├── reranker_guide.md  # 🆕
    │   └── h2o_setup.md  # 🆕
    └── integrations/
        ├── slack.md  # 🆕
        ├── notion.md  # 🆕
        └── gdrive.md  # 🆕
```

---

## ⚠️ COMPATIBILITY NOTES

### Існуючий Код
- ✅ **Зберігаємо**: Всю поточну архітектуру (FastAPI, Celery, OpenSearch, Qdrant)
- ✅ **Розширюємо**: Додаємо нові сервіси без breaking changes
- ⚠️ **Міграція**: Деякі endpoints потребують версіонування (v1 → v2)

### Backward Compatibility
- `/api/v1/search` залишається сумісним (додаємо опціональні параметри)
- Нові фічі доступні через feature flags (`ENABLE_RERANKER=true`)

---

## 📅 TIMELINE SUMMARY

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **MVP (Phase 1)** | 3 months | Reranker, Summarizer, Hybrid Search, Basic Analytics, Security |
| **Advanced (Phase 2)** | 2 months | H2O LLM Studio, Augmentation, Full Integrations |
| **Production (Phase 3)** | 1 month | Optimization, Compliance, Monitoring, DR |
| **Total** | **6 months** | Full Platform Launch-Ready |

---

## 🚦 DECISION LOG

### Key Architectural Decisions

1. **ML Models Strategy**:
   - ✅ Use pre-trained models (no training from scratch)
   - ✅ Fine-tune via H2O LLM Studio (Phase 2)
   - ✅ Deploy models as separate microservices

2. **Search Fusion**:
   - ✅ RRF (Reciprocal Rank Fusion) замість weighted average
   - ✅ Parameter α=0.7 (text) vs 0.3 (vector) за замовчуванням

3. **Integrations Auth**:
   - ✅ OAuth2 для Slack/Notion/Drive
   - ✅ Tokens encryption в PostgreSQL (pgcrypto)

4. **Monitoring**:
   - ✅ Prometheus + Grafana для метрик
   - ✅ OpenSearch для логів (замість EFK)
   - ⚠️ Jaeger - опціонально (Phase 3)

---

## 📌 PRIORITY MATRIX

```
High Impact, Quick Win │ High Impact, Long Term
══════════════════════════════════════════════════
• Reranker           │ • H2O LLM Studio
• Hybrid Search      │ • GDPR Compliance
• Rate Limiting      │ • Multi-region Deploy
──────────────────────┼───────────────────────────
Low Impact, Quick    │ Low Impact, Long Term
• UI Tweaks          │ • Custom Analytics
• Docs Updates       │ • A/B Testing
```

**Focus**: Top-right quadrant для MVP, потім top-left.

---

## ✅ ГОТОВНІСТЬ ДО СТАРТУ

### Prerequisites (Must Have Before Starting)
- [x] Existing codebase analyzed
- [x] Docker Compose working locally
- [x] PostgreSQL schemas (staging/gold) confirmed
- [x] OpenSearch + Qdrant operational
- [x] Celery workers functional

### Team Readiness
- [ ] Backend dev familiar with transformers library
- [ ] Frontend dev ready for analytics UI
- [ ] DevOps ready for Helm chart updates
- [ ] QA plan for ML model testing

---

**NEXT STEP**: Приступаємо до **Milestone 1.1: ML Pipeline Foundation** 🚀

*Estimated Start: Immediately*  
*First Deliverable: Reranker Service (2 weeks)*  

---

*Generated: 2025-12-06*  
*Version: 1.0*  
*Status: READY FOR IMPLEMENTATION* ✅
