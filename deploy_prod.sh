#!/bin/bash
# ==============================================================================
# 🚀 PREDATOR ANALYTICS v32 - PRODUCTION DEPLOYMENT SCRIPT
# Target: 194.177.1.240 (NVIDIA Server)
# ==============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting Deployment of Predator v32 (AZR Enforced)...${NC}"

# Check for .env
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

# 1. Update Submodules (if any)
# echo -e "${YELLOW}📦 Updating submodules...${NC}"
# git submodule update --init --recursive

# 2. Build Services
echo -e "${YELLOW}🏗️ Building Production Containers (Optimized for NVIDIA)...${NC}"
docker-compose -f docker-compose.prod.yml build --parallel

# 3. Stop old containers (Graceful Shutdown)
echo -e "${YELLOW}🛑 Stopping current deployment...${NC}"
docker-compose -f docker-compose.prod.yml down --remove-orphans

# 4. Start new deployment
echo -e "${GREEN}🚀 Launching v32 Services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# 5. Wait for Health Checks
echo -e "${YELLOW}⏳ Waiting for services to stabilize (30s)...${NC}"
sleep 30

# 6. Validate System Health
echo -e "${YELLOW}🔍 Running Health Checks...${NC}"

# Check Backend
if curl -s -f http://localhost/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend API is HEALTHY${NC}"
else
    echo -e "${RED}❌ Backend API is DOWN${NC}"
fi

# Check AZR Engine Status
AZR_STATUS=$(curl -s http://localhost/api/azr/status | grep "health_score")
if [[ ! -z "$AZR_STATUS" ]]; then
    echo -e "${GREEN}✅ AZR Engine v32 is ACTIVE (Sovereignty Verified)${NC}"
else
    echo -e "${YELLOW}⚠️ AZR Engine returned unexpected response (Check logs)${NC}"
fi

# Check Frontend
if curl -s -f http://localhost > /dev/null; then
    echo -e "${GREEN}✅ Frontend UI is SERVING${NC}"
else
    echo -e "${RED}❌ Frontend UI is DOWN${NC}"
fi

echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
echo -e "🔗 UI: https://predator.analytics.local"
echo -e "📜 Logs: docker-compose -f docker-compose.prod.yml logs -f"
