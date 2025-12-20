# TECH_SPEC.md: Платформа "Predator Analytics" v22.0 (Implementation-Ready)

## 0. Executive Summary

Платформа забезпечує глибокий семантичний пошук, аналітику та повний ML/LLMOps цикл з **вбудованими механізмами автономного вдосконалення**:

*   **Гібридний пошук**: OpenSearch (BM25 з OpenSearch Dashboards для моніторингу логів та query analytics) + Qdrant (dense/sparse/multimodal) з RRF fusion.
*   **Reranking**: Cross-Encoder з інтеграцією Cohere Rerank для підвищеної точності.
*   **XAI**: SHAP/LIME для пояснення топ-результатів, з візуалізацією в UI через ECharts.
*   **Автогенерація датасетів**: AugLy для стратегічної аугментації, закриття coverage-дір та cold-start.
*   **No-code / low-code fine-tuning**: H2O LLM Studio з CLI для автоматизації, підтримка DPO для стабільного навчання.
*   **AutoML для табличних та правил**: H2O AutoML з інтеграцією в пайплайни.
*   **Federated Learning**: Flower для enterprise сценаріїв з TLS-шифруванням.
*   **MLOps артефакти**: DVC + MLflow для трекінгу та версіонування.
*   **FinOps**: Kubecost + KEDA для cost-based autoscaling, з алертами та policy actions.
*   **GitOps**: ArgoCD з App-of-Apps патерном + Helm umbrella.
*   **Контури**: Mac (Dev) → Oracle ARM (Edge/Staging) → NVIDIA GPU (Compute).
*   **Edge AI**: Transformers.js + RxDB для offline vector search в PWA.
*   **Голосовий інтерфейс**: Google Cloud TTS/STT з fallback на Whisper.js/eSpeak-ng для офлайн.
*   **Автоматизації**: Повний набір – ETL пайплайни з Celery/RabbitMQ, auto-reindex jobs, tenant-based A/B, Policy Engine для сигналів, два профілі інференсу (full_quality/cost_saver), Cypress E2E тести в CI/CD.

Ключова ідея v22.0: **“♾️-Self-Improvement Loop”** з чіткими межами між **observability** (включаючи OpenSearch Dashboards) → **data** → **training** → **evaluation** → **GitOps**, інтеграцією Policy Engine та tenant-based A/B.

## 1. Головні цілі та вимірювані KPI/SLA

### 1.1 Search Quality
| Метрика | Ціль | Де вимірюємо | Примітка |
| :--- | :--- | :--- | :--- |
| precision@5 | ≥ 0.85 | offline + A/B | основний продукт-метрик |
| recall@20 | ≥ 0.90 | offline + A/B | критично для enterprise |
| NDCG@10 | ≥ baseline + 3% | offline + staging A/B (з OpenSearch Dashboards analytics) | гейт на промоут |

### 1.2 Performance
| Метрика | Ціль | Примітка |
| :--- | :--- | :--- |
| P95 latency (full pipeline) | ≤ 800 ms | default профіль |
| P95 latency (без XAI) | ≤ 500 ms | fallback режим (cost_saver) |
| ETL backlog | ≤ 60 s | середній лаг по черзі |

### 1.3 Reliability
| Метрика | Ціль |
| :--- | :--- |
| Uptime (Search API) | 99.9% |
| Автоматичний rollback при деградації | 100% для model-promote |

### 1.4 FinOps
| Метрика | Ціль |
| :--- | :--- |
| cost per 1k queries | < $0.05 |
| GPU idle | > 60 хв auto-scale/down або auto-shutdown |
| Kubecost budget breach | алерт + policy action (через Policy Engine) |

## 2. Архітектура системи

```mermaid
graph TD
    subgraph "External"
        User(User Web/App)
    end

    subgraph "Frontend (PWA/React)"
        UI[SPA: Search + XAI + Dataset Studio + Admin]
        Offline[Offline Vector Search (Transformers.js)]
    end

    subgraph "Ingress/API"
        Gateway[NGINX Ingress]
        API[Backend FastAPI]
    end

    subgraph "Storage & Search"
        Postgres[(PostgreSQL + pgvector)]
        Redis[(Redis Cache)]
        MinIO[(MinIO S3)]

        Qdrant[(Qdrant Vector DB)]
        OpenSearch[(OpenSearch + BM25)]
    end

    subgraph "Observability + FinOps"
        OD[OpenSearch Dashboards]
        Prom[Prometheus]
        Graf[Grafana]
        Cost[Kubecost]
        Policy[Policy Engine]
    end

    subgraph "Training & Self-Improve"
        Orch[Self-Improve Orchestrator]
        Aug[Augmentor (AugLy)]
        H2O[H2O LLM Studio]
        MLflow[MLflow Tracking]
        DVC[DVC Pipelines]
    end

    subgraph "Queue & Workers"
        RMQ[RabbitMQ]
        Celery[Celery Workers]
    end

    User --> UI
    UI --> Gateway
    Gateway --> API

    API --> Postgres
    API --> Redis
    API --> Qdrant
    API --> OpenSearch
    API --> RMQ

    RMQ --> Celery
    Celery --> Aug
    Celery --> Qdrant
    Celery --> OpenSearch

    Orch --> Policy
    Orch --> H2O
    H2O --> MLflow
    H2O --> MinIO

    Prom --> Policy
    Cost --> Policy
    OD --> Policy

    OpenSearch --> OD
```

OpenSearch Dashboards інтегровано як основний інструмент для моніторингу логів, query analytics та візуалізації пошукових патернів. Він доступний через embedded iframe в Admin Console або окремий ingress, з RBAC-контролем.

## 3. Потоки даних

### 3.1 ETL → Augment → Train → Index
`Raw Data` -> `RabbitMQ` -> `ETL Worker` -> `PostgreSQL (Bronze)` -> `Augmentor (Silver)` -> `H2O LLM Studio` -> `Model Artifact` -> `OpenSearch/Qdrant Indexing`

### 3.2 Search → Rerank → XAI
`Request` -> `Hybrid Search (OS+Qdrant)` -> `RRF Fusion` -> `Reranker` -> `XAI Explainer` -> `Response`

## 4. Каталог баз даних та їх ролі

*   **PostgreSQL**: System of record (User, Tenant, Documents, ML Jobs).
*   **OpenSearch**: BM25 Text Search, Logs, Analytics.
*   **OpenSearch Dashboards**: Візуалізація.
*   **Qdrant**: Vector Search (Dense/Sparse/Multimodal).
*   **Redis**: Caching, Rate Limiting.
*   **MinIO**: S3-compatible object storage for artifacts, DVC.

## 5. Безмежне самоудосконалення системи (Self-Improvement Loop ♾️)

1.  **Policy Engine**: Окремий мікросервіс (або модуль) для обробки сигналів. Приймає `signal + context` -> `allow/deny` + план дій.
2.  **Два профілі інференсу**: `full_quality` (rerank+XAI) та `cost_saver` (без XAI/з дешевшим reranker). Авто-перемикання при Kubecost spike.
3.  **Авто-реіндексація**: Окремий контрольований Celery job.
4.  **Тенантний A/B**: Ізоляція тестів по `tenant_id`.
5.  **Автоматичний Fine-Tuning**: Orchestrator тригерить H2O LLM Studio CLI при накопиченні даних.

## 10. Мінімальні робочі конфіги (Приклади)

### 10.1 Qdrant collection
```yaml
name: multimodal_search
vectors:
  default:
    size: 512
    distance: Cosine
quantization_config:
  scalar:
    type: int8
```

### 10.2 H2O LLM Studio (docker-compose)
```yaml
  h2o-llm-studio:
    image: h2oairelease/h2oai-llmstudio-app:latest
    ports:
      - "10101:10101"
    volumes:
      - ./h2o-data:/workspace
      - ./configs/h2o:/configs
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

## 11. Project Structure (Implementation-Ready)

```text
predator-analytics/
├── TECH_SPEC.md                  # Single Source of Truth
├── README.md
├── docker-compose.yml            # Local Dev (Mac)
├── Makefile                      # Make dev-up, etc.
├── apps/                         # Monorepo services
│   ├── backend/                  # FastAPI Backend
│   ├── frontend/                 # React PWA
│   ├── workers/                  # Celery Workers
│   └── self-improve-orchestrator/# The Infinite Loop Coordinator
├── infra/                        # GitOps (Helm/ArgoCD)
│   ├── helm/
│   └── argocd/
├── configs/                      # Config-as-code
│   ├── qdrant/
│   ├── opensearch/
│   └── h2o/
└── scripts/                      # Utils
```

## 13. Roadmap (Implementation-Focused)

*   **Місяці 1–2**: Базова інфраструктура, ETL pipelines, OpenSearch Dashboards.
*   **Місяці 3–4**: Hybrid Search, Reranker, Policy Engine.
*   **Місяці 5–6**: H2O LLM Studio automation, AutoML rules.
*   **Місяці 7+**: Повний Orchestrator, Flower FL, XAI.
