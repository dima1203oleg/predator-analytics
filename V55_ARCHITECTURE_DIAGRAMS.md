# PREDATOR v55.0 — АРХІТЕКТУРНІ ДІАГРАМИ ВПРОВАДЖЕННЯ

## 1. ТРАНСФОРМАЦІЯ: v45 → v55 (Strangler Fig)

```mermaid
graph TB
    subgraph "ПОТОЧНА v45 (ЗБЕРІГАЄМО)"
        A1[app/main.py<br/>FastAPI v45] --> A2[app/routers/<br/>18 роутерів v1]
        A1 --> A3[app/api/routers/<br/>25 роутерів v1]
        A1 --> A4[app/services/<br/>90+ сервісів]
        A4 --> A5[app/libs/core/<br/>60+ модулів]
    end

    subgraph "НОВЕ v55 (ДОДАЄМО ПАРАЛЕЛЬНО)"
        B1[app/api/v2/<br/>6 роутерів v2] --> B2[app/engines/<br/>8 аналітичних двигунів]
        B2 --> B3[app/indices/<br/>9 математичних індексів]
        B2 --> B4[app/datasets/<br/>200 датасетів, 5 шарів]
        B1 --> B5[app/models/v55/<br/>Нові Pydantic моделі]
        B2 --> B6[app/core/ueid.py<br/>Entity Resolution]
        B2 --> B7[app/core/confidence.py<br/>Confidence Score]
        B2 --> B8[app/core/signal_bus.py<br/>Kafka topics]
    end

    A1 -.->|include_router| B1
    B2 -.->|використовує| A4
    B2 -.->|використовує| A5

    style A1 fill:#2d5a27,color:#fff
    style B1 fill:#1a3a5c,color:#fff
    style B2 fill:#1a3a5c,color:#fff
```

## 2. ПОТІК ДАНИХ v55

```mermaid
flowchart LR
    U[Користувач] -->|HTTPS| GW[API Gateway<br/>nginx]
    GW --> FE[Frontend<br/>React+Vite]
    GW --> API[core-api<br/>FastAPI]
    GW --> ING[Ingestion<br/>Engine]

    API --> PG[(PostgreSQL<br/>UEID, CERS,<br/>Decision Artifacts)]
    API --> RD[(Redis<br/>Cache)]
    API --> MCP[MCP Router<br/>→ Ollama]
    API --> NS[(Neo4j<br/>Entity Graph)]
    API --> QD[(Qdrant<br/>Vectors)]
    API --> OS[(OpenSearch<br/>Full-text)]

    ING -->|events| KB{{Kafka/Redpanda<br/>Signal Bus}}
    KB --> W1[Worker CPU<br/>ETL + Indices]
    KB --> W2[Worker GPU<br/>Embeddings + STT]

    W1 --> ENG[Engines:<br/>Behavioral → BVI,ASS,CP<br/>Institutional → AAI,PLS<br/>Influence → IM,HCI<br/>Structural → MCI,PFI<br/>Predictive → XGB,MC]

    ENG -->|scores| PG
    ENG -->|vectors| QD
    ENG -->|graph| NS
    ENG -->|index| OS
    ENG -->|events| KB

    KB -->|cers.updated| CERS[CERS<br/>Meta-Scoring<br/>0-100]
    CERS -->|alert| TG[Telegram Bot]
    CERS --> PG
```

## 3. СЕРВЕР 194.177.1.240 — РОЗПОДІЛ РЕСУРСІВ

```mermaid
pie title RAM розподіл (50Gi доступно з 64Gi)
    "Data Stack (PG+Neo4j+OS+QD+Redis+MinIO+Kafka)" : 20
    "Core Stack (API+Ingestion+Celery+Gateway)" : 18
    "AI/ML Stack (Ollama+MLflow+Feast+Workers)" : 10
    "Security+Obs (Keycloak+Vault+Prom+Grafana+Loki)" : 8
```

## 4. 7 ШАРІВ СИСТЕМИ v55

```mermaid
graph TB
    L1[ШАР 1: CONTROL PLANE<br/>Git, ArgoCD, Schema Registry]
    L2[ШАР 2: INTELLIGENCE<br/>RTB Engine, MCP Router, RAG]
    L3[ШАР 3: AUTONOMY<br/>SIO Controller, Drift Detector]
    L4[ШАР 4: EXECUTION & DATA<br/>PostgreSQL, Neo4j, Qdrant, OpenSearch<br/>Redis, MinIO, Kafka, MLflow, Feast]
    L5[ШАР 5: OBSERVABILITY<br/>Prometheus, Grafana, Loki]
    L6[ШАР 6: SECURITY<br/>Keycloak, Vault, Kyverno]
    L7[ШАР 7: APPLICATION<br/>API, UI, Ingestion, TTS]

    L1 --- L2 --- L3 --- L4 --- L5 --- L6 --- L7

    style L1 fill:#4a0e4e,color:#fff
    style L2 fill:#0d47a1,color:#fff
    style L3 fill:#1565c0,color:#fff
    style L4 fill:#2e7d32,color:#fff
    style L5 fill:#ef6c00,color:#fff
    style L6 fill:#c62828,color:#fff
    style L7 fill:#37474f,color:#fff
```

## 5. CERS PIPELINE

```mermaid
flowchart LR
    subgraph "5 Аналітичних Шарів"
        B[Behavioral<br/>BVI+ASS+CP<br/>вага: 0.25]
        I[Institutional<br/>AAI+PLS<br/>вага: 0.20]
        INF[Influence<br/>IM+HCI<br/>вага: 0.20]
        S[Structural<br/>MCI+PFI<br/>вага: 0.15]
        P[Predictive<br/>XGB+MC<br/>вага: 0.20]
    end

    B & I & INF & S & P --> NORM[Z-score →<br/>Min-Max<br/>0-100]
    NORM --> DECOR[Декорреляція<br/>PCA якщо<br/>corr > 0.6]
    DECOR --> CERS[CERS<br/>Composite<br/>Score]
    CERS --> LVL{Рівень?}
    LVL -->|0-20| ST[Стабільний]
    LVL -->|21-40| WL[Під спостереженням]
    LVL -->|41-60| EL[Підвищений]
    LVL -->|61-80| HA[Висока загроза]
    LVL -->|81-100| CR[Критичний]

    CERS --> CONF[Confidence<br/>Score]
    CERS --> SHAP[SHAP<br/>Пояснення]
    CERS --> DA[Decision<br/>Artifact]
```

## 6. ІНГЕСТІЯ PIPELINE

```mermaid
flowchart TD
    UP[Завантаження файлу<br/>POST /api/v2/ingestion/upload] --> VAL{Тип?}
    VAL -->|Excel/CSV| EX[validate → chunk →<br/>parse → enrich]
    VAL -->|PDF| PDF[detect_type →<br/>text/OCR → tables]
    VAL -->|Audio| AU[Whisper STT →<br/>diarization → segments]
    VAL -->|Image| IM[OCR →<br/>text extraction]
    VAL -->|Telegram| TG[classify →<br/>text/photo/audio/video]

    EX & PDF & AU & IM & TG --> EMB[Embed<br/>Ollama embeddings]
    EMB --> IDX[Index:<br/>OpenSearch + Qdrant]
    IDX --> UEID[UEID<br/>Entity Resolution]
    UEID --> KB{{Kafka:<br/>data.ingested}}
    KB --> ENG[Engines<br/>обчислення індексів]

    UP -.->|SSE| PROG[Прогрес:<br/>GET /progress/job_id]

    subgraph "Job Lifecycle"
        J1[accepted] --> J2[queued]
        J2 --> J3[running]
        J3 --> J4[completed]
        J3 --> J5[failed → DLQ]
    end
```

## 7. ENTITY GRAPH (Neo4j)

```mermaid
graph LR
    C1((Company<br/>UEID)) -->|IMPORTS| P1((Product))
    C1 -->|OWNS| C2((Company))
    C1 -->|DIRECTS| PE((Person))
    C1 -->|CERTIFIED_BY| BR((Broker))
    BR -->|WORKS_AT| CP((CustomsPost))
    C1 -->|MENTIONED_IN| MM((MediaMention))
    C1 -->|PARTICIPATED| TE((Tender))
    RE((RegulatoryEvent)) -->|AFFECTS| C1

    style C1 fill:#1565c0,color:#fff
    style C2 fill:#1565c0,color:#fff
    style PE fill:#2e7d32,color:#fff
    style BR fill:#ef6c00,color:#fff
    style CP fill:#c62828,color:#fff
    style P1 fill:#6a1b9a,color:#fff
    style MM fill:#37474f,color:#fff
    style TE fill:#4e342e,color:#fff
    style RE fill:#b71c1c,color:#fff
```

## 8. ФАЗИ ВПРОВАДЖЕННЯ — ТАЙМЛАЙН

```mermaid
gantt
    title Predator v55.0 — Дорожня карта (12 місяців)
    dateFormat  YYYY-MM-DD
    axisFormat  %b %Y

    section Фаза 0: Стабілізація
    Docker/secrets cleanup       :f0a, 2026-03-03, 7d
    Entrypoint консолідація      :f0b, 2026-03-03, 7d
    Структура v55 каталогів      :f0c, 2026-03-10, 7d

    section Фаза 1: Фундамент
    UEID System                  :f1a, 2026-03-17, 21d
    Data Fusion Engine           :f1b, 2026-03-24, 28d
    Behavioral Engine (BVI/ASS/CP):f1c, 2026-04-07, 28d
    Інгестія v55 (Excel/PDF)     :f1d, 2026-04-14, 21d
    Decision Artifacts + Confidence:f1e, 2026-04-21, 14d
    Kafka Signal Bus             :f1f, 2026-04-28, 14d
    Competitor Radar UI          :f1g, 2026-05-12, 21d

    section Фаза 2: Розширення
    Institutional Engine         :f2a, 2026-06-01, 21d
    Influence Engine             :f2b, 2026-06-15, 21d
    Entity Graph (повний)        :f2c, 2026-06-22, 28d
    CERS (3 шари)                :f2d, 2026-07-06, 14d
    Keycloak + Vault             :f2e, 2026-07-13, 21d
    RAG Chat + MCP               :f2f, 2026-07-20, 21d
    Граф зв'язків UI             :f2g, 2026-08-03, 21d

    section Фаза 3: Прогностика
    Structural Gaps Engine       :f3a, 2026-09-01, 21d
    Predictive Engine            :f3b, 2026-09-15, 28d
    CERS (5 шарів, повний)       :f3c, 2026-10-06, 14d
    MLflow + Feast               :f3d, 2026-10-13, 14d
    TTS Артем + Whisper STT      :f3e, 2026-10-20, 21d
    SHAP пояснення               :f3f, 2026-11-03, 14d

    section Фаза 4: Екосистема
    ArgoCD GitOps                :f4a, 2026-12-01, 14d
    Kyverno + Falco              :f4b, 2026-12-08, 14d
    Loki + Tempo + AlertManager  :f4c, 2026-12-15, 14d
    Public API + SDK             :f4d, 2027-01-01, 21d
    Документація + спільнота     :f4e, 2027-01-15, 14d
```

## 9. УКРАЇНІЗАЦІЯ — АРХІТЕКТУРА i18n

```mermaid
flowchart TB
    subgraph "Frontend (React)"
        FE_I18N[react-i18next] --> UK[locales/uk/*.json<br/>Українська - primary]
        FE_I18N --> EN[locales/en/*.json<br/>English - secondary]
        UK --> COMP[100+ React компонентів]
    end

    subgraph "Backend (FastAPI)"
        BE_I18N[app/core/i18n.py] --> CERS_L[CERS рівні<br/>Стабільний...Критичний]
        BE_I18N --> SIG_L[Типи сигналів<br/>Аномалія, Тривога...]
        BE_I18N --> ENT_L[Типи суб'єктів<br/>Компанія, Особа...]
        BE_I18N --> ERR_L[Повідомлення помилок<br/>українською]
    end

    subgraph "Інші"
        GR[Grafana дашборди<br/>українською]
        KC[Keycloak theme<br/>українською]
        TG_BOT[Telegram бот<br/>українською]
        DOC[MkDocs<br/>українською]
    end
```

## 10. MAC ↔ СЕРВЕР СИНХРОНІЗАЦІЯ

```mermaid
sequenceDiagram
    participant Mac as Mac (тонкий клієнт)
    participant Git as GitHub
    participant ARGO as ArgoCD (сервер)
    participant K8S as K8s (сервер)

    Note over Mac: VS Code + Remote SSH
    Mac->>Git: git push (код)
    Git->>ARGO: webhook
    ARGO->>K8S: sync manifests
    K8S->>K8S: rolling update

    Note over Mac: Фронтенд dev
    Mac->>Mac: Vite HMR (локально)
    Mac->>Git: git push (фронтенд)
    Git->>ARGO: webhook
    ARGO->>K8S: rebuild frontend pod

    Note over Mac: Перевірка
    Mac->>K8S: браузер → 194.177.1.240:80
    Mac->>K8S: SSH → моніторинг
```
