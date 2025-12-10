#!/bin/bash

# Predator Analytics v21.1 - Server Deployment Script
# This script deploys the Semantic Search Platform to the remote server

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SSH_KEY="$HOME/.ssh/id_ed25519_ngrok"
# Default to what user provided, but allow override via env
SSH_HOST="${SSH_HOST:-6.tcp.eu.ngrok.io}"
SSH_PORT="${SSH_PORT:-18105}"
SSH_USER="${SSH_USER:-dima}"
REMOTE_DIR="~/predator_v21"
ARGOCD_NVIDIA_URL=${ARGOCD_NVIDIA_URL:-}
ARGOCD_NVIDIA_TOKEN=${ARGOCD_NVIDIA_TOKEN:-}
ARGOCD_URL=${ARGOCD_NVIDIA_URL:-${ARGOCD_SERVER:-}}
ARGOCD_TOKEN=${ARGOCD_NVIDIA_TOKEN:-${ARGOCD_TOKEN:-}}
if [[ "${ARGOCD_INSECURE:-false}" =~ ^(1|true|yes)$ ]]; then
    CURL_INSECURE="-k"
else
    CURL_INSECURE=""
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 Deploying Predator v21.1 (Semantic Search Platform)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 1: Check connection
echo -e "${YELLOW}📡 Checking connection to server...${NC}"
if ! ssh -o ConnectTimeout=5 -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "echo 'Connection OK'" > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to server${NC}"
    echo -e "${YELLOW}Please ensure ngrok tunnel is running on server:${NC}"
    echo "   ssh root@SERVER 'ngrok tcp 22'"
    exit 1
fi
echo -e "${GREEN}✅ Connected${NC}"
echo ""

# Step 2: Sync code
echo -e "${YELLOW}📦 Syncing code to server...${NC}"
rsync -avz --progress -e "ssh -i $SSH_KEY -p $SSH_PORT" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.git/' \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    --exclude 'venv' \
    --exclude '.venv' \
    --exclude '.venv/' \
    --exclude 'sample_data' \
    --exclude '*.log' \
    --exclude '*.xlsx' \
    --exclude 'libtorch*' \
    ./ "$SSH_USER@$SSH_HOST:$REMOTE_DIR/"

echo -e "${GREEN}✅ Code synced${NC}"
echo ""

# Step 3: Deploy on server
echo -e "${YELLOW}🐳 Building and starting services on server...${NC}"
if [[ -n "${ARGOCD_URL}" && -n "${ARGOCD_TOKEN}" ]]; then
    echo -e "${YELLOW}🔁 ArgoCD config detected. Triggering sync via ArgoCD API...${NC}"
    curl $CURL_INSECURE -sS -X POST "${ARGOCD_URL}/api/v1/applications/predator-nvidia/sync" \
        -H "Authorization: Bearer ${ARGOCD_TOKEN}" \
        -H "Content-Type: application/json" -d '{}' || echo "ArgoCD sync failed or returned non-200"
    echo "✅ ArgoCD sync requested. Please check ArgoCD UI for status."
else
    ssh -i "$SSH_KEY" -p "$SSH_PORT" -o BatchMode=yes "$SSH_USER@$SSH_HOST" << 'ENDSSH'
cd ~/predator_v21

# Create .env file if missing
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env <<EOL
DATABASE_URL=postgresql://predator:predator_password@postgres:5432/predator_db
REDIS_URL=redis://redis:6379/0
QDRANT_URL=http://qdrant:6333
OPENSEARCH_URL=http://opensearch:9200
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=predator_admin
MINIO_SECRET_KEY=predator_secret_key
# API Keys (Update these manually on server if needed)
GEMINI_API_KEY=
GROQ_API_KEY=
OPENAI_API_KEY=
EOL
fi

# Build backend and frontend
echo "Building services..."
docker compose build backend frontend

# Start full stack
echo "Starting services..."
docker compose up -d postgres redis qdrant opensearch minio keycloak backend frontend

# Wait for services
echo "Waiting for services to initialize..."
sleep 15

# Check health
echo "Checking health..."
curl -s http://localhost:8000/health || echo "Backend not yet ready"

echo "✅ Deployment complete"
ENDSSH

fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}🌐 To access services, run:${NC}"
echo "   ./scripts/server-tunnel.sh start"
echo ""
echo -e "${YELLOW}📊 Then open:${NC}"
echo "   http://localhost:9082  (Frontend)"
echo "   http://localhost:9000  (Backend API)"
echo "   http://localhost:9000/api/v1/search?q=test  (Semantic Search)"
echo ""
