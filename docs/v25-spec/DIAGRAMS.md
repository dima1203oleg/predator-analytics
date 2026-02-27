# 📊 System Diagrams (Mermaid) — Predator v45 | Neural Analytics.0

> **Версія:** 25.0
> **Оновлено:** 10.01.2026

Інтерактивні діаграми для візуалізації архітектури системи.

---

## 1. High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Dimensional UI<br/>Next.js 14]
        Mobile[Tactical Mobile<br/>PWA]
    end

    subgraph "API Layer"
        Gateway[API Gateway<br/>FastAPI]
        WS[WebSocket Server]
        LiteLLM[LiteLLM Router]
    end

    subgraph "Processing Layer"
        Temporal[Temporal.io<br/>Workflows]
        Celery[Celery Workers]
        Agents[AI Agents<br/>SIGINT/HUMINT/...]
    end

    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL)]
        Redis[(Redis)]
        Qdrant[(Qdrant<br/>Vectors)]
        OpenSearch[(OpenSearch)]
        MinIO[(MinIO<br/>S3)]
        Kafka[Kafka]
    end

    subgraph "External LLMs"
        Groq[Groq Cloud]
        Gemini[Google Gemini]
        Ollama[Ollama Local]
    end

    UI --> Gateway
    Mobile --> Gateway
    UI <--> WS

    Gateway --> Temporal
    Gateway --> LiteLLM
    Gateway --> PostgreSQL
    Gateway --> Redis

    LiteLLM --> Groq
    LiteLLM --> Gemini
    LiteLLM --> Ollama

    Temporal --> Celery
    Temporal --> Agents
    Celery --> Kafka

    Agents --> Qdrant
    Agents --> OpenSearch
    Agents --> MinIO

    Kafka --> PostgreSQL
```

---

## 2. Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Gateway
    participant V as Vault
    participant DB as PostgreSQL

    U->>F: Login (email, password)
    F->>A: POST /api/v1/auth/login
    A->>DB: Verify credentials
    DB-->>A: User record
    A->>A: Validate password (argon2)

    alt Valid credentials
        A->>A: Generate JWT (access + refresh)
        A->>V: Sign with PQC key
        V-->>A: Signed tokens
        A-->>F: { access_token, refresh_token }
        F->>F: Store in secure cookie
        F-->>U: Redirect to dashboard
    else Invalid credentials
        A-->>F: 401 Unauthorized
        F-->>U: Show error
    end

    Note over F,A: Subsequent requests
    F->>A: Request with Bearer token
    A->>A: Verify JWT signature
    A->>A: Check expiration
    A->>A: Extract user context
    A-->>F: Protected resource
```

---

## 3. Hybrid Search Flow

```mermaid
flowchart LR
    subgraph Input
        Q[Query: "APT29 malware"]
    end

    subgraph "Parallel Execution"
        direction TB
        subgraph Keyword
            OS[OpenSearch]
            BM25[BM25 Ranking]
        end

        subgraph Semantic
            EMB[Embedding Model]
            QD[Qdrant]
            SPLADE[SPLADE Vectors]
        end
    end

    subgraph Fusion
        RRF[RRF Fusion<br/>k=60]
        XAI[XAI Explanation<br/>LLM Summary]
    end

    subgraph Output
        R[Ranked Results]
    end

    Q --> OS
    Q --> EMB

    OS --> BM25
    EMB --> SPLADE
    SPLADE --> QD

    BM25 --> RRF
    QD --> RRF

    RRF --> XAI
    XAI --> R
```

---

## 4. Self-Healing Flow

```mermaid
stateDiagram-v2
    [*] --> Healthy

    Healthy --> Degraded: Anomaly detected
    Degraded --> Recovering: Self-healing triggered
    Recovering --> Healthy: Recovery successful
    Recovering --> Critical: Recovery failed

    Critical --> Manual: Human intervention
    Manual --> Healthy: Issue resolved

    state Healthy {
        [*] --> Monitoring
        Monitoring --> Monitoring: Health checks pass
    }

    state Degraded {
        [*] --> Diagnosing
        Diagnosing --> AutoFix: Can auto-fix
        AutoFix --> [*]
    }

    state Recovering {
        [*] --> Restart
        Restart --> Verify
        Verify --> Rollback: Still failing
        Verify --> [*]: OK
        Rollback --> [*]
    }
```

---

## 5. ETL Pipeline

```mermaid
flowchart TD
    subgraph Sources
        S1[CSV Upload]
        S2[API Feed]
        S3[SIEM Stream]
        S4[Scraper]
    end

    subgraph Ingestion
        K[Kafka Topics]
    end

    subgraph Processing
        E[Extract]
        T[Transform]
        L[Load]
    end

    subgraph Storage
        PG[(PostgreSQL<br/>Metadata)]
        OS[(OpenSearch<br/>Full-text)]
        QD[(Qdrant<br/>Vectors)]
        S3[(MinIO<br/>Raw files)]
    end

    subgraph ML
        EMB[Embedding<br/>Generation]
        AD[Anomaly<br/>Detection]
        CL[Classification]
    end

    S1 --> K
    S2 --> K
    S3 --> K
    S4 --> K

    K --> E
    E --> T
    T --> EMB
    T --> L

    EMB --> QD
    EMB --> AD
    AD --> CL
    CL --> PG

    L --> PG
    L --> OS
    L --> S3
```

---

## 6. Agent Orchestration

```mermaid
flowchart TB
    subgraph Supervisor
        SUP[SuperIntelligence<br/>Orchestrator]
    end

    subgraph Intelligence Agents
        SIGINT[SIGINT Agent<br/>Network Traffic]
        HUMINT[HUMINT Agent<br/>Text Analysis]
        TECHINT[TECHINT Agent<br/>Tech Logs]
        CYBINT[CYBINT Agent<br/>Threat Intel]
        OSINT[OSINT Agent<br/>Public Sources]
    end

    subgraph Processing Agents
        LLM[LLM Agent<br/>Generation]
        CRITIC[Critic Agent<br/>Validation]
        REFINER[Refiner Agent<br/>Improvement]
        EXEC[Executor Agent<br/>Actions]
    end

    subgraph Outputs
        REPORT[Threat Report]
        ACTION[Automated Action]
        ALERT[Alert]
    end

    SUP --> SIGINT
    SUP --> HUMINT
    SUP --> TECHINT
    SUP --> CYBINT
    SUP --> OSINT

    SIGINT --> LLM
    HUMINT --> LLM
    TECHINT --> LLM
    CYBINT --> LLM
    OSINT --> LLM

    LLM --> CRITIC
    CRITIC --> REFINER
    REFINER --> EXEC

    EXEC --> REPORT
    EXEC --> ACTION
    EXEC --> ALERT
```

---

## 7. Deployment Pipeline (GitOps)

```mermaid
gitGraph
    commit id: "feature"
    branch feature/new-component
    checkout feature/new-component
    commit id: "impl"
    commit id: "test"
    checkout main
    merge feature/new-component id: "PR merged"
    commit id: "CI: lint, test, scan"
    commit id: "Build Docker image"
    branch staging
    checkout staging
    commit id: "Deploy to staging"
    commit id: "E2E tests"
    checkout main
    merge staging id: "Approved"
    commit id: "ArgoCD sync"
    commit id: "Canary 10%"
    commit id: "Canary 50%"
    commit id: "Production 100%"
```

---

## 8. Database Schema (ERD)

```mermaid
erDiagram
    USER ||--o{ SESSION : has
    USER ||--o{ AUDIT_LOG : creates
    USER }o--|| ROLE : has

    SOURCE ||--o{ DATASET : produces
    DATASET ||--o{ JOB : triggers
    JOB ||--o{ ARTIFACT : creates

    AGENT ||--o{ MISSION : executes
    MISSION ||--o{ JOB : contains

    THREAT ||--o{ INDICATOR : has
    THREAT }o--|| SEVERITY : classified

    USER {
        uuid id PK
        string email UK
        string password_hash
        string role FK
        timestamp created_at
        boolean mfa_enabled
    }

    SOURCE {
        uuid id PK
        string name
        enum type
        jsonb config
        timestamp last_sync
    }

    DATASET {
        uuid id PK
        uuid source_id FK
        string name
        enum status
        jsonb schema
        int record_count
    }

    JOB {
        uuid id PK
        uuid dataset_id FK
        enum type
        enum status
        jsonb params
        timestamp started_at
        timestamp finished_at
    }

    THREAT {
        uuid id PK
        string title
        text description
        enum severity
        jsonb indicators
        timestamp detected_at
    }

    AGENT {
        uuid id PK
        string name
        enum type
        jsonb config
        boolean active
    }
```

---

## 9. Dimensional UI States

```mermaid
stateDiagram-v2
    [*] --> Boot: App loads
    Boot --> Login: Not authenticated
    Boot --> Dashboard: Authenticated

    Login --> Dashboard: Success
    Login --> Login: Failed

    state Dashboard {
        [*] --> Explorer: Default role
        Explorer --> Operator: Switch role
        Operator --> Commander: Switch role
        Commander --> Architect: Switch role
        Architect --> Explorer: Switch role
    }

    Dashboard --> Settings: User menu
    Settings --> Dashboard: Close

    Dashboard --> Logout: Sign out
    Logout --> Login
```

---

## Як використовувати

1. **GitHub/GitLab** — автоматично рендерить Mermaid
2. **VS Code** — плагін "Markdown Preview Mermaid Support"
3. **Confluence** — вбудована підтримка Mermaid
4. **Online** — [mermaid.live](https://mermaid.live)

---

*© 2026 Predator Analytics. Усі права захищено.*
