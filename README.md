# Predator Analytics v21.0

![Status](https://img.shields.io/badge/Status-Development-blue)
![Architecture](https://img.shields.io/badge/Architecture-FastAPI%20%2B%20React%20%2B%20OpenSearch-green)

Enterprise-grade Semantic Search & Analytics Platform.
Provides Hybrid Search (Text + Vector), Automated ETL Pipelines, and Interactive UI.

## 🚀 Quick Start

### Local Development (Mac)
```bash
# Start everything locally
make up

# View Logs
make logs
```
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Search**: http://localhost:8000/api/v1/search?q=test

### Deployment (Oracle/Server)
```bash
# Deploy to Dev Cluster
make helm-dev

# Deploy to Prod Cluster
make helm-prod
```

## 📚 Documentation

- [**Launch Guide**](docs/LAUNCH_GUIDE.md) - How to run on Mac, Oracle, and Server.
- [**Technical Specification**](docs/TECHNICAL_SPECIFICATION_FULL.md) - Full architecture, release map, and schemas.
- [**Platform Components**](docs/PLATFORM_COMPONENTS.md) - Detailed component breakdown.
- [**API Specification**](docs/api/openapi.yaml) - OpenAPI 3.1 contract.

## 🏗 Architecture

**Core Stack:**
- **Backend**: FastAPI (Python 3.11)
- **Frontend**: React + TypeScript + Vite
- **Search**: OpenSearch (Text) + Qdrant (Vector)
- **Database**: PostgreSQL 15
- **Infrastructure**: Docker, K3s, Helm, ArgoCD

**Environment Matrix:**
| Env | Location | Tech Stack |
|-----|----------|------------|
| Local | Mac | Docker Compose |
| Dev | Oracle Cloud | K3s + Helm (Dev Values) |
| Prod | Main Server | K3s + ArgoCD |

---
© 2025 Predator Analytics
