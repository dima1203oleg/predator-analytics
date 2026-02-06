#!/bin/bash
# 🚀 MASTER MIGRATION SCRIPT
# Syncs code and triggers K8s migration on the server

SSH_HOST="predator-server"
REMOTE_DIR="predator-analytics"

GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}🚀 STARTING MIGRATION TO KUBERNETES${NC}"

# 1. Sync Files
echo -e "${GREEN}1. Syncing files to server...${NC}"
./scripts/sync-to-server.sh

# 2. Execute K3s Install remotely
echo -e "${GREEN}2. Installing K3s on Remote Server...${NC}"
ssh $SSH_HOST "chmod +x ~/$REMOTE_DIR/scripts/k8s/install_k3s.sh && ~/$REMOTE_DIR/scripts/k8s/install_k3s.sh"

# 3. Execute Deployment remotely
echo -e "${GREEN}3. Deploying Helm Charts on Remote Server...${NC}"
ssh $SSH_HOST "cd ~/$REMOTE_DIR && chmod +x scripts/k8s/deploy_charts.sh && ./scripts/k8s/deploy_charts.sh"

echo -e "${GREEN}✅ MIGRATION SEQUENCE COMPLETED!${NC}"
echo "Check server status via: ssh $SSH_HOST 'kubectl get pods -n predator'"
