# 🦅 PREDATOR ANALYTICS v22.0 - ПОВНЕ ТЕХНІЧНЕ ЗАВДАННЯ
## Production-Ready Implementation Specification

**Версія документа:** 1.0.0
**Дата:** 2025-12-16
**Статус:** PRODUCTION-READY

---

## 📋 ЗМІСТ

1. [Executive Summary](#1-executive-summary)
2. [Архітектура системи](#2-архітектура-системи)
3. [Компоненти Backend](#3-компоненти-backend)
4. [Компоненти Frontend](#4-компоненти-frontend)
5. [Autonomous Orchestrator](#5-autonomous-orchestrator)
6. [Telegram Bot](#6-telegram-bot)
7. [Інфраструктура](#7-інфраструктура)
8. [API Специфікація](#8-api-специфікація)
9. [База даних](#9-база-даних)
10. [Deployment](#10-deployment)
11. [Тестування](#11-тестування)
12. [Безпека](#12-безпека)
13. [Моніторинг](#13-моніторинг)
14. [Roadmap](#14-roadmap)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Опис продукту
**Predator Analytics** — це AI-native платформа семантичного пошуку та аналітики з вбудованим механізмом автономного самовдосконалення. Система працює 24/7 без участі людини, автоматично покращуючи себе через LLM Council.

### 1.2 Ключові особливості
- **♾️ Self-Improvement Loop** — безперервний цикл автоматичного вдосконалення
- **🧠 LLM Council** — 3 AI моделі (Gemini, Groq, DeepSeek) приймають рішення консенсусом
- **🔍 Hybrid Search** — OpenSearch (BM25) + Qdrant (Vector) з RRF fusion
- **📱 Telegram Control Plane** — повне управління через бота
- **💰 100% Free Tier APIs** — використовує тільки безкоштовні сервіси

### 1.3 Цільова аудиторія
- Аналітики державних даних України
- Дослідники корупційних схем
- Журналісти-розслідувачі
- Compliance офіцери

### 1.4 KPI та SLA

| Метрика | Ціль | Примітка |
|---------|------|----------|
| precision@5 | ≥ 0.85 | Основна продуктова метрика |
| recall@20 | ≥ 0.90 | Критично для enterprise |
| P95 latency | ≤ 800 ms | Full pipeline |
| Uptime | 99.9% | Search API |
| cost per 1k queries | < $0.05 | FinOps |

---

## 2. АРХІТЕКТУРА СИСТЕМИ

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React 18)                      │
│            PWA • TypeScript • TailwindCSS • Vite                │
├─────────────────────────────────────────────────────────────────┤
│                      NGINX REVERSE PROXY                         │
├─────────────────────────────────────────────────────────────────┤
│                        BACKEND (FastAPI)                         │
│  REST API • WebSockets • Background Tasks • Multi-Agent System  │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│  OpenSearch  │    Qdrant    │  PostgreSQL  │      Redis        │
│   (BM25)     │   (Vector)   │   (Gold DB)  │    (Cache)        │
├──────────────┴──────────────┴──────────────┴───────────────────┤
│               ML SERVICES (Reranker, XAI, Embeddings)           │
├─────────────────────────────────────────────────────────────────┤
│            AUTONOMOUS ORCHESTRATOR (Self-Improvement)            │
├─────────────────────────────────────────────────────────────────┤
│                   TELEGRAM BOT (Control Plane)                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Потоки даних

#### ETL Pipeline
```
Raw Data → RabbitMQ → ETL Worker → PostgreSQL (Bronze)
         → Augmentor (Silver) → H2O LLM Studio
         → Model Artifact → OpenSearch/Qdrant Indexing
```

#### Search Pipeline
```
Request → Hybrid Search (OS+Qdrant) → RRF Fusion
        → Cross-Encoder Reranker → XAI Explainer → Response
```

### 2.3 Технологічний стек

| Компонент | Технологія | Версія |
|-----------|------------|--------|
| Backend | FastAPI | 0.109.0 |
| Frontend | React + TypeScript | 18.2.0 |
| Database | PostgreSQL + TimescaleDB | 15 |
| Vector DB | Qdrant | latest |
| Search Engine | OpenSearch | 2.11.0 |
| Cache | Redis | 7 |
| Object Storage | MinIO | latest |
| ML Tracking | MLflow | 2.10.0 |
| LLM Training | H2O LLM Studio | latest |
| Container Runtime | Docker | 24+ |
| Orchestration | Docker Compose / K8s | - |

---

## 3. КОМПОНЕНТИ BACKEND

### 3.1 Структура проекту

```
apps/backend/
├── app/
│   ├── main.py                 # FastAPI application entry
│   ├── models.py               # SQLAlchemy models
│   ├── database.py             # DB connection
│   ├── api/
│   │   ├── v1/                 # API версія 1
│   │   │   ├── search.py       # Пошукові ендпоінти
│   │   │   ├── auth.py         # Автентифікація
│   │   │   └── federation.py   # Federated Learning
│   │   └── routers/
│   │       ├── search.py       # Hybrid search router
│   │       ├── council.py      # LLM Council API
│   │       ├── diagnostics_api.py
│   │       ├── e2e.py          # E2E testing
│   │       ├── llm_management.py
│   │       ├── metrics.py      # Prometheus metrics
│   │       └── stats.py        # Analytics stats
│   ├── services/
│   │   ├── llm.py              # Multi-LLM router (38KB)
│   │   ├── embedding_service.py
│   │   ├── qdrant_service.py   # Vector operations
│   │   ├── opensearch_indexer.py
│   │   ├── search_fusion.py    # Hybrid search + RRF
│   │   ├── model_router.py     # LLM routing logic
│   │   ├── diagnostics_service.py
│   │   └── auto_optimizer.py   # Self-improvement
│   ├── core/
│   │   ├── config.py           # Settings
│   │   ├── security.py         # JWT, auth
│   │   ├── celery_app.py       # Task queue
│   │   └── cache.py            # Redis cache
│   └── tasks/
│       ├── etl_tasks.py        # ETL Celery tasks
│       ├── indexing_tasks.py
│       └── maintenance_tasks.py
├── requirements.txt
├── Dockerfile
└── tests/
```

### 3.2 Ключові сервіси

#### 3.2.1 LLM Service (`app/services/llm.py`)
**Відповідальність:** Мультимодельний роутер для LLM запитів

```python
# Підтримувані провайдери
PROVIDERS = ["groq", "gemini", "openai", "anthropic", "mistral", "ollama"]

# Режими роутингу
MODES = {
    "AUTO": "Автоматичний вибір моделі",
    "FAST": "Найшвидша модель (Groq)",
    "PRECISE": "Найточніша модель",
    "COUNCIL": "Консенсус 3 моделей"
}

# Ключові методи
class ModelRouter:
    async def route(query: str, mode: str = "AUTO") -> Response
    async def council_vote(query: str) -> ConsensusResponse
    async def generate_with_fallback(prompt: str) -> str
```

#### 3.2.2 Search Fusion (`app/services/search_fusion.py`)
**Відповідальність:** Гібридний пошук з RRF fusion

```python
async def hybrid_search_with_rrf(
    query: str,
    limit: int = 10,
    alpha: float = 0.5,  # BM25 vs Vector weight
    rerank: bool = True
) -> List[SearchResult]:
    """
    1. BM25 search via OpenSearch
    2. Vector search via Qdrant
    3. RRF fusion of results
    4. Optional Cross-Encoder reranking
    """
```

#### 3.2.3 Embedding Service (`app/services/embedding_service.py`)
**Відповідальність:** Генерація векторних ембедингів

```python
# Модель: sentence-transformers/paraphrase-multilingual-mpnet-base-v2
EMBEDDING_DIM = 768

class EmbeddingService:
    async def embed_text(text: str) -> List[float]
    async def embed_batch(texts: List[str]) -> List[List[float]]
```

#### 3.2.4 Qdrant Service (`app/services/qdrant_service.py`)
**Відповідальність:** Операції з векторною базою

```python
COLLECTION_NAME = "predator_documents"

class QdrantService:
    async def create_collection()
    async def upsert_vectors(docs: List[Document])
    async def search(query_vector: List[float], limit: int) -> List[Hit]
```

### 3.3 API Endpoints

| Endpoint | Method | Опис |
|----------|--------|------|
| `/health` | GET | Health check |
| `/api/v1/search` | GET/POST | Hybrid search |
| `/api/v1/search/semantic` | POST | Pure vector search |
| `/api/v1/documents/{id}` | GET | Get document |
| `/api/v1/documents/{id}/summary` | GET | AI summary |
| `/api/v1/auth/login` | POST | JWT login |
| `/api/v1/auth/register` | POST | User registration |
| `/api/v1/council/vote` | POST | LLM Council decision |
| `/api/v1/llm/chat` | POST | Direct LLM chat |
| `/api/v1/diagnostics` | GET | System diagnostics |
| `/api/v1/stats` | GET | Analytics stats |

### 3.4 Celery Tasks

```python
# Черги
QUEUES = ["etl", "ingestion", "maintenance", "monitoring"]

# Ключові задачі
@celery_app.task(queue="etl")
def process_raw_data(source_id: int)

@celery_app.task(queue="ingestion")
def index_document(doc_id: str)

@celery_app.task(queue="maintenance")
def optimize_opensearch_indices()

@celery_app.task(queue="monitoring")
def collect_metrics()
```

### 3.5 Requirements (ключові залежності)

```txt
# Core
fastapi==0.109.0
uvicorn==0.27.0
pydantic==2.6.0

# Database
asyncpg==0.29.0
sqlalchemy[asyncio]>=2.0.25
alembic>=1.13.1

# Search & Vectors
qdrant-client==1.7.0
opensearch-py==2.4.2
sentence-transformers>=3.0.0

# LLM Providers
google-generativeai>=0.3.0
groq>=0.4.0
openai>=1.12.0

# Task Queue
celery==5.3.6
redis==5.0.1

# ML/NLP
spacy>=3.7.0
nlpaug>=1.1.11
transformers==4.37.0

# Monitoring
prometheus-client>=0.19.0
```

---

## 4. КОМПОНЕНТИ FRONTEND

### 4.1 Структура проекту

```
apps/frontend/
├── src/
│   ├── App.tsx                  # Main app component
│   ├── index.tsx                # Entry point
│   ├── index.css                # Global styles (18KB)
│   ├── types.ts                 # TypeScript types
│   ├── components/
│   │   ├── Layout.tsx           # Main layout
│   │   ├── BootScreen.tsx       # Startup animation
│   │   ├── LoginScreen.tsx      # Auth UI
│   │   ├── CommandCenter.tsx    # Command palette
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Skeleton.tsx         # Loading states
│   │   └── StatusIndicator.tsx
│   ├── views/
│   │   ├── DashboardView.tsx    # Main dashboard (30KB)
│   │   ├── SearchConsole.tsx    # Search UI (42KB)
│   │   ├── AnalyticsView.tsx    # Analytics (52KB)
│   │   ├── LLMView.tsx          # LLM management (40KB)
│   │   ├── AgentsView.tsx       # AI Agents (12KB)
│   │   ├── TestingView.tsx      # E2E testing (32KB)
│   │   ├── IntegrationView.tsx  # Data sources (61KB)
│   │   ├── MonitoringView.tsx   # System monitoring
│   │   ├── SecurityView.tsx     # Security settings
│   │   └── SettingsView.tsx     # User settings
│   ├── services/
│   │   └── api.ts               # API client
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   └── hooks/
│       ├── useAuth.ts
│       └── useSearch.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
└── Dockerfile
```

### 4.2 Ключові views

#### 4.2.1 Dashboard (`DashboardView.tsx`)
- Real-time cluster topology
- Agent swarm visualization
- Threat radar
- System overclock control
- Live metrics charts

#### 4.2.2 Search Console (`SearchConsole.tsx`)
- Hybrid search toggle (BM25/Vector/Hybrid)
- LLM routing mode selector
- Results with XAI explanations
- Document preview modal
- Export functionality

#### 4.2.3 Analytics View (`AnalyticsView.tsx`)
- Search analytics charts
- Query patterns visualization
- Performance metrics
- User behavior analytics
- A/B test results

#### 4.2.4 LLM View (`LLMView.tsx`)
- Model selection UI
- API key management
- Usage statistics per provider
- Council voting history
- Cost tracking

### 4.3 Технології Frontend

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "axios": "^1.6.2",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.294.0",
    "recharts": "^2.10.3",
    "echarts": "^5.5.0",
    "echarts-for-react": "^3.0.2",
    "three": "^0.160.0",
    "@react-three/fiber": "^8.15.12"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "vite": "^5.0.8",
    "tailwindcss": "^3.4.0",
    "@vitejs/plugin-react": "^4.2.1",
    "vite-plugin-pwa": "^0.17.0"
  }
}
```

### 4.4 UI/UX вимоги

1. **Dark Theme** — основна тема (cyberpunk aesthetic)
2. **Responsive** — підтримка mobile/tablet/desktop
3. **PWA** — офлайн режим з Service Worker
4. **Animations** — Framer Motion для плавних переходів
5. **3D Elements** — Three.js для візуалізацій
6. **Accessibility** — WCAG 2.1 AA

---

## 5. AUTONOMOUS ORCHESTRATOR

### 5.1 Архітектура

```
apps/self-improve-orchestrator/
├── main.py                      # Entry point (665 lines)
├── config.py                    # Configuration
├── council/
│   ├── __init__.py
│   ├── chairman.py              # Gemini - Decision maker
│   ├── critic.py                # Groq - Code reviewer
│   ├── analyst.py               # DeepSeek - System analyst
│   ├── consensus.py             # Voting logic
│   └── ultimate_fallback.py     # Multi-model fallback
├── agents/
│   ├── telegram_bot.py          # Telegram V4 (56KB)
│   ├── git_committer.py         # Auto git commits
│   ├── change_observer.py       # File watcher
│   ├── reflexion_agent.py       # Learning from errors
│   ├── self_healing.py          # Auto-recovery
│   ├── performance_predictor.py
│   ├── training_manager.py      # H2O integration
│   └── voice_handler.py         # Voice commands
├── tasks/
│   ├── code_improver.py         # Code generation
│   ├── ui_guardian.py           # UI testing
│   └── data_sentinel.py         # Data validation
├── memory/
│   └── manager.py               # Context memory
└── knowledge/
    └── graph.py                 # Knowledge graph
```

### 5.2 LLM Council

```
┌──────────────────────────────────────────────────────┐
│                    LLM COUNCIL                        │
├──────────────┬──────────────┬────────────────────────┤
│   CHAIRMAN   │    CRITIC    │       ANALYST          │
│   (Gemini)   │    (Groq)    │    (DeepSeek/Ollama)   │
│              │              │                        │
│  Decision    │  Code        │  System                │
│  Making      │  Review      │  Analysis              │
├──────────────┴──────────────┴────────────────────────┤
│                  CONSENSUS                            │
│   2/3 majority required for approval                 │
└──────────────────────────────────────────────────────┘
```

### 5.3 Infinite Loop Flow

```python
while True:
    # 1. GATHER INTELLIGENCE
    metrics = await gather_metrics()  # CPU, memory, error rate

    # 2. ANALYST REVIEW
    analysis = await analyst.analyze(metrics)

    # 3. IDENTIFY TASK
    task = await identify_task(analysis, metrics)
    # Sources: Redis queue (Telegram), auto-generated improvements

    # 4. CODE GENERATION
    proposal = await code_improver.generate_improvement(task)

    # 5. COUNCIL VOTE
    # Chairman, Critic, Analyst vote on proposal
    consensus = await council_vote(task, proposal, metrics)

    # 6. AUTO-APPROVAL (God Mode)
    # Bypass human verification for full autonomy

    # 7. EXECUTION
    success = await execute_task(task, proposal)
    # Write code → Git commit → Deploy

    # 8. NOTIFY
    await broadcast("system", "Task completed", "success")

    await asyncio.sleep(60)  # 1 minute cycles
```

### 5.4 Агенти

| Agent | Функція | Періодичність |
|-------|---------|---------------|
| UIGuardian | Playwright тести UI | кожні 10 хв |
| DataSentinel | Валідація даних OpenSearch | кожні 15 хв |
| CodeImprover | Генерація покращень | кожен цикл |
| GitCommitter | Auto-commit змін | при змінах |
| ChangeObserver | Моніторинг файлів | постійно |
| SelfHealing | Відновлення помилок | при помилках |
| PerformancePredictor | Прогноз навантаження | кожні 5 хв |
| TrainingManager | H2O LLM Studio | при накопиченні даних |

### 5.5 Конфігурація

```python
# config.py

# LLM Council APIs (FREE TIER)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-flash-latest"

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
OLLAMA_BASE_URL = "http://localhost:11434"

# Orchestrator
LOOP_INTERVAL_SECONDS = 60
MAX_ITERATIONS_PER_DAY = 288
REDIS_URL = "redis://redis:6379/0"

# Quality Gates
MIN_TEST_COVERAGE = 0.70
MIN_LIGHTHOUSE_SCORE = 0.85
MAX_DEPLOYMENT_FAILURES = 3
```

---

## 6. TELEGRAM BOT

### 6.1 Функціональність

**Bot V4.0** — повноцінний пульт управління з природною мовою

### 6.2 Структура меню

```
📱 ГОЛОВНЕ МЕНЮ
├── 📊 Dashboard
│   ├── System Status
│   ├── Real-time Metrics
│   ├── Active Agents
│   └── Quick Actions
├── 🤖 AI Assistant
│   ├── Chat with AI
│   ├── Model Selection
│   ├── Council Mode
│   └── Voice Input
├── ⚙️ System Control
│   ├── Start/Stop Services
│   ├── Restart Containers
│   ├── Deploy Updates
│   └── Rollback
├── 📈 Analytics
│   ├── Search Stats
│   ├── Performance
│   ├── User Activity
│   └── Cost Analysis
├── 🔧 Configuration
│   ├── API Keys
│   ├── Model Settings
│   ├── Thresholds
│   └── Notifications
├── 🤖 Automation
│   ├── UI Guardian Toggle
│   ├── Auto-Commit Toggle
│   ├── Self-Improvement
│   └── Scheduled Tasks
├── 💾 Data Management
│   ├── Backup
│   ├── Restore
│   ├── Export
│   └── Import
├── 🔒 Security
│   ├── Audit Logs
│   ├── Access Control
│   ├── API Key Rotation
│   └── Threat Detection
├── 🌐 Network & API
│   ├── Health Checks
│   ├── Rate Limits
│   ├── API Stats
│   └── Integrations
└── 📋 Logs & Reports
    ├── System Logs
    ├── Error Logs
    ├── Daily Report
    └── Generate Report
```

### 6.3 AI Chat Features

```python
class AIController:
    """Контролер AI чату з мультимодельністю"""

    MODELS = {
        "gemini": "gemini-2.0-flash-exp",
        "groq": "llama-3.3-70b-versatile",
        "grok": "grok-beta",
        "mistral": "mistral-large-latest"
    }

    async def chat(self, message: str, context: List) -> str:
        """Основний метод чату з fallback"""

    async def _chat_gemini_advanced(self, message: str) -> str:
        """Tool-use симуляція для Gemini"""
```

### 6.4 Команди

| Команда | Опис |
|---------|------|
| `/start` | Головне меню |
| `/status` | Статус системи |
| `/stop` | Зупинити оркестратор |
| `/stopui` | Зупинити UI Guardian |
| `/resume` | Відновити роботу |
| `/logs` | Останні логи |
| `/deploy` | Деплой оновлень |
| `/rollback` | Відкат змін |

---

## 7. ІНФРАСТРУКТУРА

### 7.1 Docker Compose Services

```yaml
services:
  # Core Application
  backend:           # FastAPI (port 8090)
  frontend:          # React + Nginx (port 8092)

  # Orchestrator
  orchestrator:      # Self-Improvement Loop
  telegram_controller: # Telegram Bot V4

  # Workers
  celery_worker:     # ETL, Ingestion
  celery_beat:       # Scheduled tasks

  # Data & Search
  postgres:          # TimescaleDB (port 5432)
  redis:             # Cache (port 6379)
  qdrant:            # Vector DB (port 6333)
  opensearch:        # BM25 Search (port 9200)
  opensearch-dashboards: # (port 5601)
  minio:             # S3 Storage (port 9000)
  rabbitmq:          # Message Queue (port 5672)

  # ML/Training
  h2o-llm-studio:    # LLM Training (port 10101)
  mlflow:            # Experiment Tracking (port 5001)

  # Observability
  grafana:           # Dashboards (port 3001)
  prometheus:        # Metrics (port 9092)
```

### 7.2 Порти

| Сервіс | Порт | Призначення |
|--------|------|-------------|
| Backend | 8090 | FastAPI REST API |
| Frontend | 8092 | React SPA |
| PostgreSQL | 5432 | Primary DB |
| Redis | 6379 | Cache & Queue |
| OpenSearch | 9200 | Full-text search |
| OpenSearch Dashboards | 5601 | Search UI |
| Qdrant | 6333/6334 | Vector DB |
| MinIO | 9000/9001 | Object Storage |
| RabbitMQ | 5672/15672 | Message Queue |
| H2O LLM Studio | 10101 | Training UI |
| MLflow | 5001 | ML Tracking |
| Grafana | 3001 | Monitoring |
| Prometheus | 9092 | Metrics |

### 7.3 Volumes

```yaml
volumes:
  postgres_data:      # DB persistence
  redis_data:         # Cache persistence
  qdrant_data:        # Vector index
  opensearch_data:    # Search index
  minio_data:         # Object storage
  grafana_data:       # Dashboards
  prometheus_data:    # Metrics history
  orchestrator_logs:  # System logs
  h2o_workspace:      # Training artifacts
```

### 7.4 Networks

```yaml
networks:
  predator-net:
    driver: bridge
```

---

## 8. API СПЕЦИФІКАЦІЯ

### 8.1 Authentication

```
POST /api/v1/auth/login
Content-Type: application/json

{
    "username": "string",
    "password": "string"
}

Response: {
    "access_token": "jwt_token",
    "token_type": "bearer"
}
```

### 8.2 Search API

```
GET /api/v1/search?q={query}&limit=10&mode=hybrid

POST /api/v1/search
{
    "query": "корупція в Укрзалізниці",
    "limit": 10,
    "mode": "hybrid",     // text|vector|hybrid
    "rerank": true,
    "filters": {
        "date_from": "2024-01-01",
        "category": "corruption"
    }
}

Response: {
    "results": [
        {
            "id": "uuid",
            "title": "string",
            "snippet": "string",
            "score": 0.95,
            "explanation": {...}  // XAI
        }
    ],
    "total": 100,
    "took_ms": 245
}
```

### 8.3 LLM Council API

```
POST /api/v1/council/vote
{
    "query": "Проаналізуй ризики компанії",
    "mode": "council"
}

Response: {
    "decision": "approve",
    "consensus": {
        "chairman": {...},
        "critic": {...},
        "analyst": {...}
    },
    "final_answer": "string",
    "reasoning": "string"
}
```

### 8.4 Document API

```
GET /api/v1/documents/{id}

GET /api/v1/documents/{id}/summary?max_length=130

POST /api/v1/documents
{
    "title": "string",
    "content": "string",
    "category": "string"
}
```

---

## 9. БАЗА ДАНИХ

### 9.1 PostgreSQL Schema

```sql
-- Staging Layer (Raw Data)
CREATE TABLE staging.raw_data (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(50) NOT NULL,
    source_url TEXT,
    raw_content JSONB NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    processing_error TEXT,
    retry_count INT DEFAULT 0
);

-- Gold Layer (Cleaned Documents)
CREATE TABLE gold.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    author VARCHAR(255),
    published_date TIMESTAMPTZ,
    source_url TEXT,
    category VARCHAR(100),
    language VARCHAR(10) DEFAULT 'uk',
    raw_id INT REFERENCES staging.raw_data(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    indexed_os BOOLEAN DEFAULT FALSE,
    indexed_vec BOOLEAN DEFAULT FALSE
);

-- Users
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search Logs
CREATE TABLE gold.search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    query TEXT NOT NULL,
    filters JSONB,
    results_count INT,
    search_type VARCHAR(20),
    execution_time_ms FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 9.2 Qdrant Collection

```yaml
name: predator_documents
vectors:
  default:
    size: 768  # sentence-transformers dimension
    distance: Cosine
quantization_config:
  scalar:
    type: int8
```

### 9.3 OpenSearch Index

```json
{
  "mappings": {
    "properties": {
      "title": {"type": "text", "analyzer": "ukrainian"},
      "content": {"type": "text", "analyzer": "ukrainian"},
      "summary": {"type": "text"},
      "category": {"type": "keyword"},
      "published_date": {"type": "date"},
      "author": {"type": "keyword"}
    }
  }
}
```

---

## 10. DEPLOYMENT

### 10.1 Local Development

```bash
# Clone
git clone https://github.com/your-org/predator-analytics.git
cd predator-analytics

# Environment
cp .env.example .env
# Edit .env with your API keys

# Start
docker compose up -d

# Verify
docker compose ps
curl http://localhost:8090/health
```

### 10.2 Production (NVIDIA Server)

```bash
# Connection
ssh dima@194.177.1.240 -p 6666

# Deploy
cd ~/predator-analytics
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build

# Verify
docker compose ps
curl http://localhost:8090/health
```

### 10.3 Environment Variables

```bash
# Required
GEMINI_API_KEY=AIzaSy...
GROQ_API_KEY=gsk_...
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_ADMIN_ID=123456789

# Database
DATABASE_URL=postgresql+asyncpg://predator:password@postgres:5432/predator_db
REDIS_URL=redis://redis:6379/0

# Services
QDRANT_URL=http://qdrant:6333
OPENSEARCH_URL=http://opensearch:9200
MINIO_ENDPOINT=minio:9000

# Optional
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
DEEPSEEK_API_KEY=
```

### 10.4 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Test
        run: pytest

      - name: Build
        run: docker compose build

      - name: Deploy
        uses: appleboy/ssh-action@v1
        with:
          host: 194.177.1.240
          port: 6666
          username: dima
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd ~/predator-analytics
            git pull
            docker compose up -d --build
```

---

## 11. ТЕСТУВАННЯ

### 11.1 Types of Tests

| Тип | Інструмент | Покриття |
|-----|------------|----------|
| Unit | pytest | Services, Utils |
| Integration | pytest-asyncio | API, DB |
| E2E | Playwright | UI flows |
| Load | Locust | Performance |
| Security | Bandit, Safety | Vulnerabilities |

### 11.2 Test Structure

```
tests/
├── unit/
│   ├── test_llm_service.py
│   ├── test_embedding.py
│   └── test_search_fusion.py
├── integration/
│   ├── test_api_search.py
│   ├── test_api_auth.py
│   └── test_qdrant.py
├── e2e/
│   ├── test_search_flow.py
│   ├── test_login_flow.py
│   └── test_dashboard.py
└── conftest.py
```

### 11.3 Running Tests

```bash
# All tests
pytest

# With coverage
pytest --cov=app --cov-report=html

# E2E only
pytest tests/e2e/ --headed

# Specific file
pytest tests/unit/test_llm_service.py -v
```

---

## 12. БЕЗПЕКА

### 12.1 Authentication

- **JWT Tokens** — RS256 algorithm
- **Token Expiry** — 24 hours (configurable)
- **Refresh Tokens** — 7 days

### 12.2 Authorization

- **RBAC** — Role-based access control
- Roles: `admin`, `user`, `viewer`

### 12.3 API Security

- Rate limiting via Redis
- CORS configuration
- Input validation via Pydantic
- SQL injection prevention via SQLAlchemy

### 12.4 Secrets Management

```bash
# Never commit to git
.env
*.key
*.pem

# Use environment variables
export GEMINI_API_KEY=xxx

# Production: Use HashiCorp Vault
```

### 12.5 Network Security

- Firewall rules for open ports
- HTTPS only in production
- Internal network for services

---

## 13. МОНІТОРИНГ

### 13.1 Prometheus Metrics

```python
# Custom metrics
REQUEST_LATENCY = Histogram('request_latency_seconds')
LLM_REQUESTS = Counter('llm_requests_total', ['provider'])
SEARCH_QUERIES = Counter('search_queries_total', ['type'])
ACTIVE_USERS = Gauge('active_users')
```

### 13.2 Grafana Dashboards

1. **System Overview** — CPU, Memory, Network
2. **API Performance** — Latency, Error rate
3. **LLM Usage** — Requests per provider, Costs
4. **Search Analytics** — Queries, Results, Relevance

### 13.3 Alerting

| Метрика | Threshold | Action |
|---------|-----------|--------|
| Error rate | > 5% | Telegram alert |
| Latency P95 | > 2s | Telegram alert |
| CPU usage | > 80% | Auto-scale |
| Memory | > 90% | Restart container |

### 13.4 Logging

```python
# Structured logging
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('logs/system.log')
    ]
)
```

---

## 14. ROADMAP

### Phase 1: Core Platform (Місяці 1-2) ✅
- [x] FastAPI Backend
- [x] React Frontend
- [x] PostgreSQL + Redis
- [x] OpenSearch + Qdrant
- [x] Basic Search API

### Phase 2: AI Integration (Місяці 3-4) ✅
- [x] LLM Council
- [x] Hybrid Search + RRF
- [x] Cross-Encoder Reranking
- [x] Telegram Bot

### Phase 3: Autonomy (Місяці 5-6) 🔄
- [x] Autonomous Orchestrator
- [x] Self-Improvement Loop
- [ ] H2O LLM Studio Integration
- [ ] Automated Training

### Phase 4: Enterprise (Місяці 7+) ⏳
- [ ] Kubernetes Deployment
- [ ] Federated Learning
- [ ] Multi-tenant A/B Testing
- [ ] Advanced XAI
- [ ] FinOps Dashboard

---

## 📎 ДОДАТКИ

### A. Корисні команди

```bash
# Docker
docker compose up -d
docker compose logs -f backend
docker compose exec backend bash

# Server
ssh dima@194.177.1.240 -p 6666
./scripts/server-status.sh
./scripts/sync-to-server.sh

# Database
docker compose exec postgres psql -U predator -d predator_db

# Redis
docker compose exec redis redis-cli
```

### B. Troubleshooting

| Проблема | Рішення |
|----------|---------|
| API Key Invalid | Перевірте .env, без пробілів |
| Council Timeout | Збільшіть timeout в llm.py |
| Semantic No Results | Перевірте Qdrant/OpenSearch |
| UI Guardian Failing | Вимкніть: `redis-cli SET orchestrator:ui_stop 1` |

### C. Контакти

- **Server IP:** 194.177.1.240
- **SSH Port:** 6666
- **User:** dima
- **Project Dir:** ~/predator-analytics

---

**© 2025 Predator Analytics Team**
*Self-Improving AI Platform*
