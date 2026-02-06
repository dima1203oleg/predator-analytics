#!/bin/bash
# 🚀 K3s Installation Script for Predator Server
# installs K3s with NVIDIA GPU support (if configured later) and Traefik enabled

set -e

GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}🔄 Installing K3s (Lightweight Kubernetes)...${NC}"

# Install K3s (Master Node)
# Disabling traefik default to allow custom ingress control if needed,
# but for simplicity enabling it first.
curl -sfL https://get.k3s.io | sh -

# Wait for node readiness
echo -e "${GREEN}⏳ Waiting for K3s readiness...${NC}"
sleep 15
sudo k3s kubectl get node

# Prepare Kubeconfig for user
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
echo "export KUBECONFIG=~/.kube/config" >> ~/.bashrc
source ~/.bashrc

# Check if Helm is installed
if ! command -v helm &> /dev/null; then
    echo -e "${GREEN}🔄 Installing Helm...${NC}"
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi

echo -e "${GREEN}✅ K3s + Helm Installed Successfully!${NC}"
