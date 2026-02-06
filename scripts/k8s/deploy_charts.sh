#!/bin/bash
# 🚀 FORCE Deploy Predator Analytics to K8s
# This script aggressively cleans up old failed releases and installs fresh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
CHART_PATH="./infrastructure/helm/predator-analytics"
NAMESPACE="predator"

echo -e "${GREEN}🔄 K8s Force Deployment Initiated...${NC}"

# 1. Cleanup previous attempts
echo -e "${YELLOW}🧹 Cleaning up previous installations...${NC}"
helm uninstall predator -n $NAMESPACE --wait || echo "Nothing to uninstall."
kubectl delete namespace $NAMESPACE --ignore-not-found || true
sleep 5 # Give K8s a breath

# 2. Setup Namespace
echo -e "${GREEN}1. Creating Namespace...${NC}"
kubectl create namespace $NAMESPACE

# 3. Dependencies
echo -e "${GREEN}2. Updating Dependencies...${NC}"
helm repo add bitnami https://charts.bitnami.com/bitnami || true
helm repo update
helm dependency build $CHART_PATH

# 4. Install (Async mode for autonomy)
echo -e "${GREEN}3. Installing Release (Sovereign Mode)...${NC}"
# Increased timeout, removed atomic (to inspect failures), added wait=false to return control immediately
helm install predator $CHART_PATH \
  --namespace $NAMESPACE \
  --set global.environment=production \
  --set backend.env.SOVEREIGN_AUTO_APPROVE="true" \
  --set backend.replicaCount=1 \
  --timeout 15m

echo ""
echo -e "${GREEN}✅ Installation Request Sent!${NC}"
echo "Pods are now creating. Monitor them with: kubectl get pods -n predator -w"
