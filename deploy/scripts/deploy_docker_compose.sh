#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$DEPLOY_DIR")"

echo "🐳 PREDATOR Analytics Frontend Docker Compose Deployment"
echo "========================================================"
echo ""

# Step 1: Build frontend image
echo "🏗️  [Step 1/4] Building frontend Docker image..."
cd "$PROJECT_ROOT/apps/predator-analytics-ui"

if docker build -t predator-analytics-ui:v55.0.0 .; then
    echo "✅ Frontend image built successfully"
else
    echo "❌ Frontend image build failed"
    exit 1
fi

echo ""

# Step 2: Create docker-compose.yml for frontend
echo "📝 [Step 2/4] Creating docker-compose configuration..."

cat > "$PROJECT_ROOT/docker-compose.frontend.yml" << 'EOF'
version: '3.8'

services:
  frontend:
    image: predator-analytics-ui:v55.0.0
    container_name: predator-frontend
    ports:
      - "3030:3030"
    environment:
      - API_UPSTREAM=http://host.docker.internal:9080
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3030/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
    networks:
      - predator-network

networks:
  predator-network:
    driver: bridge
EOF

echo "✅ Docker Compose configuration created"

echo ""

# Step 3: Start frontend container
echo "🚀 [Step 3/4] Starting frontend container..."

cd "$PROJECT_ROOT"
docker-compose -f docker-compose.frontend.yml up -d

echo "✅ Frontend container started"

echo ""

# Step 4: Verify deployment
echo "✅ [Step 4/4] Verifying deployment..."

sleep 3

if docker ps | grep -q "predator-frontend"; then
    echo "✅ Frontend container is running"
else
    echo "❌ Frontend container failed to start"
    docker logs predator-frontend
    exit 1
fi

echo ""
echo "======================================================"
echo "🎉 Frontend deployed successfully!"
echo "======================================================"
echo ""
echo "📍 Frontend URL:"
echo "   http://localhost:3030"
echo ""
echo "📊 View logs:"
echo "   docker logs -f predator-frontend"
echo ""
echo "🛑 To stop the container:"
echo "   docker-compose -f docker-compose.frontend.yml down"
echo ""
echo "🗑️  To remove the container:"
echo "   docker-compose -f docker-compose.frontend.yml down -v"
echo ""
