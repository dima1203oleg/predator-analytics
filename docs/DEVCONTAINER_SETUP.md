# 🚀 DevContainer Setup Guide

## Quick Start

1. **Open in VS Code**:
   ```bash
   code /Users/dima-mac/Documents/Predator_21
   ```

2. **Reopen in Container**:
   - Press `Cmd+Shift+P`
   - Select "Dev Containers: Reopen in Container"
   - Wait for container build (~5 minutes first time)

3. **Verify Services**:
   ```bash
   make start
   docker-compose ps
   ```

## What Gets Installed

### VS Code Extensions
- Python (Pylance, linting)
- Docker
- GitHub Copilot + Chat
- Prettier, ESLint
- Makefile Tools

### Services (Auto-started)
- PostgreSQL (TimescaleDB) - Port 5432
- Redis - Port 6379
- Qdrant - Port 6333
- OpenSearch - Port 9200
- MinIO - Ports 9000, 9001
- Grafana - Port 3001
- Prometheus - Port 9090
- MLflow - Port 5000

### Development Tools
- Python 3.9+ with all dependencies
- Node.js 18
- Docker CLI
- kubectl + Helm
- Make

## MCP Integration (GitHub Copilot)

The DevContainer includes MCP server integration for enhanced AI assistance.

**Location**: `.vscode/mcp.json` (create manually if needed)

```json
{
  "servers": [
    {
      "name": "Predator AI Assistant",
      "url": "http://localhost:8000/mcp"
    }
  ]
}
```

## Common Commands

```bash
# Install dependencies
make install

# Start all services
make start

# View logs
make logs

# Run tests
make test

# Stop everything
make stop

# Clean up
make clean
```

## Port Forwarding

All ports are automatically forwarded to localhost:

| Service | Port | URL |
|---------|------|-----|
| Backend API | 8000 | http://localhost:8000 |
| Frontend | 3000 | http://localhost:3000 |
| MinIO Console | 9001 | http://localhost:9001 |
| Grafana | 3001 | http://localhost:3001 |
| Prometheus | 9090 | http://localhost:9090 |
| OpenSearch | 9200 | http://localhost:9200 |

## Troubleshooting

### Container won't start
```bash
# Rebuild container
docker-compose build --no-cache
```

### Services not accessible
```bash
# Check service status
docker-compose ps

# Restart services
make restart
```

### Python dependencies missing
```bash
# Reinstall
make install
```

## Environment Variables

Create `.env` file in project root:

```bash
DATABASE_URL=postgresql://predator:predator_password@localhost:5432/predator_db
REDIS_URL=redis://localhost:6379/0
QDRANT_URL=http://localhost:6333
OPENSEARCH_URL=http://localhost:9200
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=predator_admin
MINIO_SECRET_KEY=predator_secret_key

# API Keys (optional)
GEMINI_API_KEY=
GROQ_API_KEY=
OPENAI_API_KEY=
```

## Next Steps

1. Start backend: `python3 ua-sources/app/main_v21.py`
2. Start frontend: `npm run dev`
3. Access API docs: http://localhost:8000/docs
4. Test upload: `curl -X POST http://localhost:8000/api/v1/data/upload -F "file=@test.csv"`
