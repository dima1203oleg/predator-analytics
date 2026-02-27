#!/bin/bash
set -e

# Predator v45 | Neural AnalyticsLocal E2E Smoke Test
# Usage: ./run-e2e.sh

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 [E2E] Starting Local Smoke Tests${NC}"

# Check docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found"
    exit 1
fi

# Start minimal stack
echo "➡️  Starting Backend & Dependencies..."
# We use the main docker-compose.yml
docker-compose up -d backend postgres redis

# Wait loop
echo "⏳ Waiting for service readiness..."
READY=false
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null; then
        echo -e "${GREEN}✅ Backend is UP!${NC}"
        READY=true
        break
    fi
    echo "   ...waiting ($i/30)"
    sleep 2
done

if [ "$READY" = false ]; then
    echo -e "${RED}❌ Backend failed to start within timeout${NC}"
    docker-compose logs backend --tail=50
    exit 1
fi

# Validate specific endpoints
echo "🧪 Testing Monitoring Endpoint (v45)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v45/monitoring/queues)

# We accept 200 (OK) or 401/403 (Auth required) as proof of life
if [[ "$HTTP_CODE" =~ ^(200|401|403)$ ]]; then
    echo -e "${GREEN}✅ /api/v45/monitoring/queues responded with $HTTP_CODE${NC}"
else
    echo -e "${RED}❌ /api/v45/monitoring/queues failed with $HTTP_CODE${NC}"
    docker-compose logs backend --tail=50
    exit 1
fi

# Success
echo -e "${GREEN}✅ All E2E smoke tests passed!${NC}"
