#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Predator Deployment on NVIDIA Server...${NC}"

# 0. Ensure we are in project root (assuming script is in scripts/)
cd "$(dirname "$0")/.."

# 1. Update Code
echo -e "${GREEN}📥 Pulling latest code...${NC}"
git config pull.rebase false
git stash
git pull origin main
git stash pop || true

# 2. Check Config
if [ ! -f .env ]; then
    echo -e "${RED}⚠️ .env file missing! Creating from example...${NC}"
    cp .env.example .env
    echo "Please edit .env and run this script again."
    exit 1
fi

# 3. Build Services
# Note: Root context is now used, so we build all dependent servicesе
echo -e "${GREEN}🏗️ Building Docker images (with GPU support)...${NC}"
docker compose build backend orchestrator telegram_controller

# 4. Restart Services
echo -e "${GREEN}🔄 Restarting services...${NC}"
docker compose up -d --remove-orphans

# 5. Verify Health
echo -e "${GREEN}🏥 Checking health (waiting 15s)...${NC}"
sleep 15
if curl -s -f http://localhost:8090/health > /dev/null; then
    echo -e "${GREEN}✅ Backend API is Healthy!${NC}"
else
    echo -e "${RED}❌ Backend Health check failed.${NC}"
    echo "Last 20 lines of backend logs:"
    docker compose logs --tail=20 backend
fi

# 6. Check GPU Access (Optional)
if command -v nvidia-smi &> /dev/null; then
    echo -e "${GREEN}GPU Status:${NC}"
    nvidia-smi --query-gpu=name,utilization.gpu,memory.used --format=csv,noheader
fi

echo -e "${GREEN}✅ Deployment Complete!${NC}"
