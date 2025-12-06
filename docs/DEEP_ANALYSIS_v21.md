# 🔍 Predator Analytics v21.0 — Глибокий Аналіз Системи

> Документ створено: 2025-12-06  
> Цільове середовище: **NVIDIA GPU Server (production)**

---

## 📊 Загальна Статистика Проекту

| Метрика | Значення |
|---------|----------|
| **Python файлів (backend)** | ~95 |
| **TypeScript файлів (frontend)** | ~55 |
| **Services** | 26 |
| **Views (UI screens)** | 19 |
| **LLM Providers** | 10 |
| **Data Connectors** | 5 |
| **MAS Agents** | 10+ |
| **Docker Services** | 12 |
| **Helm Charts** | 16 |
| **Estimated LOC** | ~20,000+ |

---

## 🏗️ Архітектура Системи

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│              React + TypeScript + TailwindCSS                   │
│         19 Views • Avatar Chat • Real-time Updates              │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI)                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   API Layer (8000)                          ││
│  │  /api/v1/analyze • /api/v1/search • /api/v1/data/upload    ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│  ┌──────────────────────────┴──────────────────────────────────┐│
│  │              NEXUS SUPERVISOR (Orchestrator)                ││
│  │      Modes: auto | fast | precise | council                 ││
│  └──────────────────────────────────────────────────────────────┘│
│            │                │                │                   │
│       ┌────┴────┐      ┌────┴────┐     ┌─────┴─────┐            │
│       │RETRIEVER│      │  MINER  │     │  ARBITER  │            │
│       │  Agent  │      │  Agent  │     │   Agent   │            │
│       └────┬────┘      └────┬────┘     └─────┬─────┘            │
│            │                │                │                   │
│  ┌─────────┴────────────────┴────────────────┴─────────────────┐│
│  │                   SERVICE LAYER                             ││
│  │  LLM Service • Embedding • PII Masking • Risk Engine       ││
│  │  ETL Ingestion • Graph Builder • Deep Scan                 ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │PostgreSQL│ │OpenSearch│ │  Qdrant  │ │  MinIO   │ │ Redis  ││
│  │TimescaleDB│ │ (Search) │ │ (Vector) │ │  (S3)    │ │(Cache) ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 🤖 Multi-Agent System (MAS) — Детальний Аналіз

### Архітектура Агентів

```
                          USER_QUERY
                               │
                               ▼
                    ┌───────────────────┐
                    │  NEXUS SUPERVISOR │
                    │   (Orchestrator)  │
                    └─────────┬─────────┘
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
       ┌────────────┐  ┌────────────┐  ┌────────────┐
       │ RETRIEVER  │  │   MINER    │  │  ARBITER   │
       │   Agent    │  │   Agent    │  │   Agent    │
       │            │  │            │  │            │
       │ - Search   │  │ - Pattern  │  │ - Voting   │
       │ - Retrieve │  │ - Insight  │  │ - Merge    │
       │ - Source   │  │ - Anomaly  │  │ - Decide   │
       └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
             │               │               │
             └───────────────┼───────────────┘
                             ▼
                        RESPONSE
```

### Режими Виконання

| Режим | Швидкість | Точність | Агенти | Use Case |
|-------|-----------|----------|--------|----------|
| **fast** | ⚡⚡⚡ | ⭐⭐ | Retriever | Dashboard widgets, quick lookups |
| **auto** | ⚡⚡ | ⭐⭐⭐ | Retriever → Miner | Standard queries |
| **precise** | ⚡ | ⭐⭐⭐⭐ | Full pipeline | Deep analysis |
| **council** | 🐢 | ⭐⭐⭐⭐⭐ | Multi-model voting | Critical decisions |

### 🔧 Виявлені Проблеми в MAS

| # | Файл | Проблема | Серйозність | Виправлення |
|---|------|----------|-------------|-------------|
| 1 | `retriever_agent.py:2` | Неправильний import path | 🔴 Critical | `from ..core.base_agent` |
| 2 | Всі агенти | Placeholder логіка замість реальних даних | 🟡 High | Інтегрувати з connectors |
| 3 | `supervisor.py` | Немає async error handling | 🟡 Medium | try/except + logging |
| 4 | Агенти | Відсутня persistence стану | 🟢 Low | Redis for state |

---

## 🧠 LLM Service — Multi-Provider Architecture

### Підтримувані Провайдери (10)

```
┌────────────────────────────────────────────────────────────────┐
│                     MODEL ROUTER                                │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                   CLOUD PROVIDERS                        │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │ │
│  │  │ OpenAI │ │ Gemini │ │ Anthro │ │  Groq  │ │Mistral │ │ │
│  │  │ GPT-4o │ │ 1.5pro │ │ Claude │ │ Llama3 │ │ Large  │ │ │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                   LOCAL (NVIDIA)                         │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │                    OLLAMA                          │ │ │
│  │  │  Gemma 7B • Llama3 70B • Mistral • CodeStral      │ │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                   FALLBACK CHAIN                         │ │
│  │  Ollama → Groq → Gemini → Anthropic → OpenAI            │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### LLM Features

1. **Complexity Assessment** — автоматичний аналіз складності запиту
2. **Council Mode** — 3+ моделі голосують, Arbiter обирає найкращу відповідь
3. **Fallback Chain** — автоматичний failover при помилках
4. **Round-Robin Keys** — ротація кількох API ключів
5. **Cost-Aware Routing** — оптимізація по ціні

### 🔧 Проблеми LLM Service

| Файл | Проблема | Виправлення |
|------|----------|-------------|
| `config.py:57-58` | Дублювання `LLM_MISTRAL_BASE_URL` | Видалити один рядок |
| `model_router.py:92` | Placeholder в `_call_gemini` | Повна імплементація |
| `model_router.py:118` | Placeholder в `_call_openai` | Повна імплементація |
| `llm.py` | Відсутня retry logic | Додати tenacity |

---

## 🔍 Semantic Search Pipeline

### Dual Indexing Architecture

```
                           FILE UPLOAD
                               │
                               ▼
                    ┌───────────────────┐
                    │      MinIO        │
                    │   (Raw Storage)   │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │   ETL Pipeline    │
                    │  - Read CSV/Excel │
                    │  - Validate       │
                    │  - Transform      │
                    │  - PII Mask       │
                    └─────────┬─────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌───────────────────┐         ┌───────────────────┐
    │    PostgreSQL     │         │    OpenSearch     │
    │   (Gold Schema)   │         │ (Text Indexing)   │
    │    + Qdrant       │         │   BM25 Ranking    │
    │ (Vector Indexing) │         └───────────────────┘
    │  Cosine 384-dim   │
    └───────────────────┘
```

### Hybrid Search Flow

```
USER_QUERY: "митні декларації компанії XYZ"
                    │
    ┌───────────────┴───────────────┐
    │               │               │
    ▼               ▼               │
OpenSearch      Qdrant              │
(Keyword)      (Vector)             │
    │               │               │
    │ BM25 Score    │ Cosine Score  │
    │               │               │
    └───────┬───────┘               │
            ▼                       │
     MERGE & RE-RANK                │
            │                       │
            ▼                       │
  Combined Score = keyword_score + (semantic_score × 10)
            │
            ▼
      TOP-K RESULTS
```

### Embedding Configuration

| Parameter | Value |
|-----------|-------|
| Model | `all-MiniLM-L6-v2` |
| Dimensions | 384 |
| Provider | sentence-transformers |
| Distance | Cosine |
| Collection | `documents_vectors` |

---

## 🔐 Security Layer

### Zero-Trust Architecture

```
                         REQUEST
                            │
                            ▼
                    ┌───────────────┐
                    │   KEYCLOAK    │
                    │   (OIDC/JWT)  │
                    └───────┬───────┘
                            │ Token Validation
                            ▼
                    ┌───────────────┐
                    │  AUTH SERVICE │
                    │  - verify_token()
                    │  - get_user_roles()
                    │  - can_access_pii()
                    └───────┬───────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
        ROLE: admin               ROLE: guest
        CAN_VIEW_PII: true        CAN_VIEW_PII: false
              │                           │
              ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐
    │   FULL DATA     │         │  MASKED DATA    │
    │   _restricted   │         │    _safe        │
    └─────────────────┘         └─────────────────┘
```

### PII Masking Strategies

| Field Type | Original | Masked |
|------------|----------|--------|
| EDRPOU | 12345678 | `12****78` |
| Email | user@domain.com | `u****@domain.com` |
| Phone | +380501234567 | `+38****67` |
| Company Name | ТОВ Компанія | `Т**** К****` |
| Person Name | Іван Петренко | `І**** П****` |

### 🔴 Critical Security Issues

| Issue | Location | Risk | Fix |
|-------|----------|------|-----|
| Hardcoded SECRET_KEY | `config.py:68` | 🔴 Critical | Use Vault |
| OpenSearch no TLS | `docker-compose.yml` | 🔴 High | Enable TLS in prod |
| MinIO default creds | `docker-compose.yml` | 🟡 High | Vault secrets |
| Hardcoded PII_SALT | `pii_masking.py` | 🟡 Medium | Env variable |

---

## 📦 Data Connectors

### Ukrainian Government Data Sources

| Connector | API Endpoint | Status | Coverage |
|-----------|--------------|--------|----------|
| `NBUFXConnector` | bank.gov.ua | ✅ Full | Exchange rates |
| `ProzorroConnector` | openprocurement.org | ⚠️ Partial | Public procurement |
| `RegistryConnector` | data.gov.ua | ⚠️ Partial | EDR registry |
| `TaxConnector` | tax.gov.ua | 🔧 Placeholder | Tax data |
| `CustomsConnector` | customs.gov.ua | 🔧 Placeholder | Customs data |

### Connector Architecture

```python
class BaseConnector(ABC):
    """
    Abstract base for all connectors
    Features:
    - Automatic retries (max_retries=3)
    - Timeout handling (default 30s)
    - Health check
    - Standard result format
    """
    
    @abstractmethod
    async def search(query, limit=20) -> ConnectorResult
    
    @abstractmethod
    async def get_by_id(record_id) -> ConnectorResult
```

---

## 🖥️ Frontend Architecture

### 19 Views Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         LAYOUT                                   │
│  ┌──────────┐ ┌──────────────────────────────────────────────┐ │
│  │ SIDEBAR  │ │                CONTENT AREA                  │ │
│  │          │ │                                              │ │
│  │ Dashboard│ │  ┌────────────────────────────────────────┐ │ │
│  │ Admin    │ │  │          CURRENT VIEW                  │ │ │
│  │ Data     │ │  │                                        │ │ │
│  │ Agents   │ │  │  DashboardView | AgentsView | LLMView │ │ │
│  │ Security │ │  │  DatabasesView | AnalyticsView | ...  │ │ │
│  │ ETL      │ │  │                                        │ │ │
│  │ LLM      │ │  └────────────────────────────────────────┘ │ │
│  │ Settings │ │                                              │ │
│  │ ...      │ │  ┌────────────────────────────────────────┐ │ │
│  └──────────┘ │  │       AVATAR CHAT WIDGET               │ │ │
│               │  │   (3D Talking Avatar)                   │ │ │
│               │  └────────────────────────────────────────┘ │ │
│               └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Context Providers

```tsx
<ToastProvider>
  <GlobalProvider>
    <AgentProvider>
      <SuperIntelligenceProvider>
        <Layout>
          {children}
          <AvatarChatWidget />
        </Layout>
      </SuperIntelligenceProvider>
    </AgentProvider>
  </GlobalProvider>
</ToastProvider>
```

---

## 🚀 Kubernetes Deployment (NVIDIA Server)

### Helm Umbrella Chart Structure

```
helm/predator-umbrella/
├── Chart.yaml              # Main chart definition
├── values.yaml             # Default values
├── values-dev.yaml         # Development overrides
├── values-prod.yaml        # Production overrides (NVIDIA)
└── charts/                 # Subcharts
    ├── api/                # FastAPI backend
    ├── frontend/           # React frontend
    ├── agents/             # MAS agents
    ├── model-router/       # LLM router
    ├── celery/             # Background workers
    ├── postgres/           # TimescaleDB
    ├── redis/              # Cache
    ├── qdrant/             # Vector store
    ├── opensearch/         # Text search
    ├── minio/              # Object storage
    ├── keycloak/           # Auth
    ├── mlflow/             # ML tracking
    ├── kafka/              # Messaging
    ├── neo4j/              # Graph DB
    ├── voice/              # STT/TTS
    └── observability/      # Prometheus/Grafana
```

### NVIDIA Server Configuration (values-prod.yaml)

```yaml
# GPU-optimized settings
modelRouter:
  providers:
    ollama:
      url: "http://ollama-gpu:11434"
      models:
        - gemma:7b
        - gemma2:9b
        - mistral:7b
        - llama3:70b
        - codestral

voice:
  stt:
    model: whisper-large-v3
    language: uk
  tts:
    engine: sadtalker
    gpu: true

# High availability
api:
  replicaCount: 5
  resources:
    limits:
      cpu: "4"
      memory: "8Gi"

agents:
  replicaCount: 5

# Storage
postgres:
  persistence:
    size: 500Gi
    storageClass: "nvme-ssd"

opensearch:
  persistence:
    size: 1Ti
```

---

## 📋 Виправлення Критичних Багів

### 1. Неправильний import в retriever_agent.py

**Проблема:** `from .base_agent import ...` має бути `from ..core.base_agent`

**Файл:** `/ua-sources/app/agents/data/retriever_agent.py`

```python
# BEFORE (wrong):
from .base_agent import BaseAgent, AgentResponse, AgentConfig

# AFTER (correct):
from ..core.base_agent import BaseAgent, AgentResponse, AgentConfig
```

### 2. Дублювання в config.py

**Файл:** `/ua-sources/app/core/config.py` lines 57-58

```python
# BEFORE (duplicate):
LLM_MISTRAL_BASE_URL: str = "https://api.mistral.ai/v1"
LLM_MISTRAL_BASE_URL: str = "https://api.mistral.ai/v1"  # DELETE THIS

# AFTER:
LLM_MISTRAL_BASE_URL: str = "https://api.mistral.ai/v1"
```

### 3. import os в кінці файлу

**Файл:** `/ua-sources/app/services/pii_masking.py` line 140

```python
# Move to top of file with other imports
```

### 4. Deprecated datetime.utcnow()

**Файли:** `databases.py`, `graph_builder.py`

```python
# BEFORE:
datetime.utcnow()

# AFTER:
datetime.now(timezone.utc)
```

---

## 🛠️ Deployment Script for NVIDIA Server

### Prerequisites on NVIDIA Server

```bash
# 1. Install K3s
curl -sfL https://get.k3s.io | sh -

# 2. Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# 3. Install NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit

# 4. Configure K3s for NVIDIA
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
kubectl apply -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.14.1/nvidia-device-plugin.yml
```

### Deployment Commands

```bash
# 1. Sync code to NVIDIA server
rsync -avz --exclude 'node_modules' --exclude '.venv' \
  -e "ssh -i ~/.ssh/id_ed25519_ngrok -p 14564" \
  /Users/dima-mac/Documents/Predator_21/ \
  dima@5.tcp.eu.ngrok.io:~/predator-analytics/

# 2. SSH to server
ssh -i ~/.ssh/id_ed25519_ngrok dima@5.tcp.eu.ngrok.io -p 14564

# 3. Deploy with Helm
cd ~/predator-analytics
helm dependency update helm/predator-umbrella
helm upgrade --install predator helm/predator-umbrella \
  -f helm/predator-umbrella/values-prod.yaml \
  --namespace predator --create-namespace

# 4. Verify deployment
kubectl get pods -n predator
kubectl get svc -n predator
```

---

## 📊 Моніторинг та Observability

### Prometheus + Grafana Stack

```yaml
observability:
  prometheus:
    enabled: true
    retention: 90d
  grafana:
    dashboards:
      - api-overview
      - agents-status
      - ml-metrics
      - slo-burn-rate
      - security-audit
      - pii-access
      - cost-analysis
  loki:
    enabled: true
    retention: 90d
  tempo:
    enabled: true
    retention: 30d
```

### Alert Configuration

```yaml
alertmanager:
  receivers:
    - telegram    # Critical
    - pagerduty   # Critical (prod)
    - email       # Warnings
  routes:
    critical:
      receiver: pagerduty
      repeatInterval: 1m
    warning:
      receiver: telegram
      repeatInterval: 10m
```

---

## ✅ Next Steps

1. **Виправити критичні баги** (imports, duplicates)
2. **Підключитися до NVIDIA сервера** (оновити ngrok port)
3. **Синхронізувати код** на сервер
4. **Встановити K3s + Helm** на сервері
5. **Розгорнути Helm chart** з `values-prod.yaml`
6. **Налаштувати Ollama** з GPU моделями
7. **Налаштувати моніторинг** (Prometheus + Grafana)
8. **Тестування** API endpoints

---

**Документ створено AI Antigravity Agent**  
**Версія: 1.0**  
**Дата: 2025-12-06**
