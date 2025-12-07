# 🚀 Predator Analytics v21.0 - Deployment Summary

## Quick Start

```bash
# Start all services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## Services Overview

| Service | Port | URL | Credentials |
|---------|------|-----|-------------|
| **Frontend** | 8082 | http://localhost:8082 | — |
| **Backend API** | 8000 | http://localhost:8000/docs | — |
| **Grafana** | 3001 | http://localhost:3001 | admin / predator123 |
| **Prometheus** | 9090 | http://localhost:9090 | — |
| **MLflow** | 5001 | http://localhost:5001 | — |
| **Keycloak** | 8080 | http://localhost:8080 | admin / admin |
| **MinIO Console** | 9001 | http://localhost:9001 | predator_admin / predator_secret_key |
| **OpenSearch Dashboards** | 5601 | http://localhost:5601 | — |
| **PostgreSQL** | 5432 | — | predator / predator_password |
| **Redis** | 6379 | — | — |
| **Qdrant** | 6333 | http://localhost:6333 | — |
| **OpenSearch** | 9200 | http://localhost:9200 | — |

## Required Databases

The following databases are created automatically:
- `predator_db` - Main application database
- `mlflow` - MLflow tracking store
- `keycloak` - Keycloak identity store

If databases are missing, create them manually:
```bash
docker exec predator_postgres psql -U predator -d predator_db -c "CREATE DATABASE mlflow;"
docker exec predator_postgres psql -U predator -d predator_db -c "CREATE DATABASE keycloak;"
```

## MinIO Buckets

Create required bucket for MLflow artifacts:
```bash
docker exec predator_minio mc alias set local http://localhost:9000 predator_admin predator_secret_key
docker exec predator_minio mc mb local/mlflow --ignore-existing
```

## Health Checks

```bash
# Backend
curl http://localhost:8000/health

# Grafana
curl http://localhost:3001/api/health

# Prometheus
curl http://localhost:9090/-/healthy

# Qdrant
curl http://localhost:6333/collections

# OpenSearch
curl http://localhost:9200/_cluster/health

# MLflow
curl http://localhost:5001/
```

## Remote Deployment

### Using auto_deploy.sh

The `auto_deploy.sh` script automatically:
1. Checks if remote server is available
2. If available: syncs code via rsync and triggers remote deployment
3. If unavailable: falls back to local Docker Compose

```bash
./auto_deploy.sh
```

### Manual Remote Deployment

```bash
# Connect to server
./scripts/server-connect.sh

# Or deploy directly
./scripts/server-connect.sh "docker-compose up -d --build"
```

## Troubleshooting

### MLflow "database does not exist"
```bash
docker exec predator_postgres psql -U predator -d predator_db -c "CREATE DATABASE mlflow;"
docker-compose restart mlflow
```

### Backend slow startup
The backend loads ML models on startup (reranker, summarizer, embeddings). This can take 2-5 minutes on first run.

### Keycloak not starting
```bash
docker exec predator_postgres psql -U predator -d predator_db -c "CREATE DATABASE keycloak;"
docker-compose restart keycloak
```

### Port conflicts
```bash
# Find process using port
lsof -i :8000
# Kill process
kill -9 <PID>
```

### Rebuild from scratch
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Monitoring

- **Grafana Dashboards**: Pre-configured dashboards available at http://localhost:3001
- **Prometheus Metrics**: Scraping backend, redis, opensearch, qdrant at http://localhost:9090
- **MLflow Experiments**: Track ML experiments at http://localhost:5001

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│  PostgreSQL │
│   (React)   │     │  (FastAPI)  │     │   (Data)    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   ┌──────────┐      ┌──────────┐      ┌──────────┐
   │  Qdrant  │      │OpenSearch│      │   Redis  │
   │ (Vector) │      │  (Text)  │      │  (Cache) │
   └──────────┘      └──────────┘      └──────────┘
```

---
Generated: 2024-12-07
Version: v21.0
