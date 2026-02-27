#!/bin/bash
# Deploy Orchestrator v45.0 to NVIDIA Server with auto-approval mode

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SSH_KEY="$HOME/.ssh/id_ed25519_dev"
SSH_HOST="${SSH_HOST:-predator-server}"
SSH_USER="${SSH_USER:-dima}"
REMOTE_DIR="~/predator_v45"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 Deploying Orchestrator v45.0 (GOD MODE)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 1. Sync code
echo -e "${YELLOW}📦 Syncing orchestrator code...${NC}"
rsync -avz --progress \
    backend/orchestrator/ \
    "$SSH_USER@$SSH_HOST:$REMOTE_DIR/backend/orchestrator/"

rsync -avz --progress \
    backend/Dockerfile.orchestrator \
    "$SSH_USER@$SSH_HOST:$REMOTE_DIR/backend/"

rsync -avz --progress \
    docker-compose.yml \
    "$SSH_USER@$SSH_HOST:$REMOTE_DIR/"

echo -e "${GREEN}✅ Code synced${NC}"

# 2. Deploy
echo -e "${YELLOW}🐳 Building and starting Orchestrator on server...${NC}"
ssh "$SSH_HOST" << 'ENDSSH'
cd ~/predator_v45

# Build orchestrator image
docker compose build orchestrator

# Start orchestrator
docker compose up -d orchestrator

# Wait and check logs
sleep 5
docker logs predator_orchestrator --tail 20

echo "✅ Orchestrator deployed!"
ENDSSH

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📊 Check status:${NC}"
echo "   ssh $SSH_HOST 'docker logs -f predator_orchestrator'"
