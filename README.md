# 🦅 Predator Analytics v22.0

**AI-Native Semantic Search & Analytics Platform**

> Self-Improving • GitOps-Native • Enterprise-Ready

---

## 🚀 Quick Start

### Local Development (Docker Compose)
```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f backend
```

### NVIDIA Server
```bash
# Connect to server
./scripts/server-connect.sh

# Check status
./scripts/server-status.sh

# Sync code
./scripts/sync-to-server.sh
```

---

## 📦 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React 18)                  │
├─────────────────────────────────────────────────────────┤
│                    Backend (FastAPI)                    │
├──────────────┬──────────────┬──────────────┬───────────┤
│  OpenSearch  │    Qdrant    │  PostgreSQL  │   Redis   │
│    (BM25)    │   (Vector)   │   (Gold DB)  │  (Cache)  │
├──────────────┴──────────────┴──────────────┴───────────┤
│              ML Services (Reranker, XAI)               │
├─────────────────────────────────────────────────────────┤
│           Orchestrator (Self-Improvement Loop)          │
└─────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
predator-analytics/
├── backend/           # FastAPI backend + ML services
│   ├── app/           # Main application
│   ├── orchestrator/  # Self-improvement system
│   └── Dockerfile
├── frontend/          # React 18 + TypeScript
│   ├── src/           # Source code
│   └── Dockerfile
├── scripts/           # Deployment & utility scripts
├── infra/             # Infrastructure configs
│   ├── postgres/      # Database migrations
│   ├── grafana/       # Dashboards
│   └── prometheus/    # Monitoring
├── helm/              # Kubernetes charts
├── docs/              # Documentation
├── docker-compose.yml # Local development
└── TECH_SPEC.md       # Technical specification v22.0
```

---

## 🔧 Configuration

### Environment Variables
```bash
cp .env.example .env
# Edit .env with your API keys
```

### Key Services (docker-compose.yml)
| Service | Port | Description |
|---------|------|-------------|
| Backend | 8000 | FastAPI REST API |
| Frontend | 3000 | React SPA |
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Cache & queues |
| OpenSearch | 9200 | Full-text search |
| Qdrant | 6333 | Vector database |
| Grafana | 3001 | Monitoring dashboards |

---

## 🎯 Key Features

### ✅ Implemented
- **Hybrid Search**: OpenSearch (BM25) + Qdrant (Vector)
- **Cross-Encoder Reranking**: Semantic result ranking
- **XAI**: SHAP/LIME explanations for search results
- **LLM Council**: Multi-model AI decision making
- **Data Augmentation**: NLPAug + AugLy
- **Telegram Bot**: Full control panel
- **Monitoring**: Prometheus + Grafana

### 🔄 In Progress
- MLflow integration
- DVC data versioning
- H2O AutoML

---

## 📍 Server Connection

| Parameter | Value |
|-----------|-------|
| **IP** | 194.177.1.240 |
| **Port** | 6666 |
| **User** | dima |
| **Directory** | ~/predator-analytics |

---

## 📚 Documentation

- [TECH_SPEC.md](TECH_SPEC.md) — Full technical specification v22.0
- [QUICK_START.md](QUICK_START.md) — Getting started guide
- [docs/](docs/) — Additional documentation

---

## 🛠 Useful Commands

```bash
# Backend health check
curl http://localhost:8000/health

# Search API
curl "http://localhost:8000/api/v1/search?q=example"

# Server status
./scripts/server-status.sh

# Deploy via Git
./scripts/git_deploy.sh
```

---

## 📄 License

Proprietary — All rights reserved.

---

*Predator Analytics v22.0 — Self-Improving AI Platform*
