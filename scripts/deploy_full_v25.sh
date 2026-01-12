#!/bin/bash

# Predator Analytics v25.0 - FULL Autonomous System Deployment
# Deploys Orchestrator, H2O LLM Studio, Backend, and Frontend.

SSH_HOST="predator-server"
REMOTE_DIR="predator-analytics"

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting FULL v25.0 Deployment to NVIDIA Server...${NC}"

# 1. Sync Code
./scripts/sync-to-server.sh

# 2. Remote Deployment
echo -e "${GREEN}🔄 Executing Remote Docker Compose Build & Up...${NC}"

ssh "$SSH_HOST" "
    cd $REMOTE_DIR && \

    # Prune old images to save space
    docker system prune -f && \

    # Clean legacy containers if any
    docker compose down --remove-orphans && \

    # Build and Start FULL Stack using the 'server' profile
    docker compose --profile server up -d --build && \

    echo -e "${GREEN}✅ All v25.0 Services Deployed!${NC}" && \
    docker compose ps
"
