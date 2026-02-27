#!/bin/bash

echo "🚀 Setting up Predator Analytics v45.0 (Local Dev Mode)"

# 1. Create .env if missing
if [ ! -f .env ]; then
    echo "⚠️ .env not found. Creating from example..."
    cat > .env <<EOL
DATABASE_URL=postgresql://predator:predator_password@localhost:5432/predator_db
REDIS_URL=redis://localhost:6379/0
QDRANT_URL=http://localhost:6333
OPENSEARCH_URL=http://localhost:9200
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=predator_admin
MINIO_SECRET_KEY=predator_secret_key
# API Keys (Fill these in)
GEMINI_API_KEY=
GROQ_API_KEY=
OPENAI_API_KEY=
EOL
    echo "✅ .env created. Please fill in API keys later."
fi

# 2. Check dependencies
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop."
    exit 1
fi

# 3. Start Infrastructure
echo "🐳 Starting Semantic Search Platform (v45.1)..."
# Build backend to ensure latest Semantic Search code is used
docker compose build backend
# Start infra + backend + db migration helper
docker compose up -d postgres redis qdrant minio opensearch keycloak backend db-migrate

# 4. Wait for DB
echo "⏳ Waiting for stack initialization..."
sleep 10

# 5. Instructions
echo "✅ Semantic Search Platform started!"
echo ""
echo "🔗 Access Points:"
echo "  Backend API:    http://localhost:8000"
echo "  Search API:     http://localhost:8000/api/v1/search"
echo "  Grafana:        http://localhost:3001 (admin/admin)"
echo "  MinIO:          http://localhost:9001 (predator_admin/predator_secret_key)"
echo "  Keycloak:       http://localhost:8080 (admin/admin)"
echo ""
echo "💻 To start Frontend (if not running):"
echo "  npm run dev"
echo ""
echo "🚀 To verify Semantic Search:"
echo "  curl 'http://localhost:8000/api/v1/search?q=test&semantic=true'"
