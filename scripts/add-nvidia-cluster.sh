#!/bin/bash
# Script to add Remote NVIDIA Kubernetes cluster to local kubeconfig
# Usage: ./scripts/add-nvidia-cluster.sh [ngrok_port] [ngrok_host] [user]

NGROK_PORT=${1:-18105}
NGROK_HOST=${2:-"6.tcp.eu.ngrok.io"}
USER=${3:-"root"}
SSH_KEY="~/.ssh/id_ed25519_ngrok"
LOCAL_KUBECONFIG="/Users/dima-mac/Documents/Predator_21/kubeconfig-mac.yaml"

echo "🔌 Connecting to NVIDIA Server via $NGROK_HOST:$NGROK_PORT as $USER..."

# 1. Fetch remote kubeconfig
echo "   Fetching remote kubeconfig..."
# Try standard locations for k3s, microk8s, or standard kubeconfig
ssh -i $SSH_KEY -p $NGROK_PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $USER@$NGROK_HOST "cat /etc/rancher/k3s/k3s.yaml 2>/dev/null || microk8s config 2>/dev/null || cat ~/.kube/config" > /tmp/nvidia-kubeconfig.yaml

if [ ! -s /tmp/nvidia-kubeconfig.yaml ]; then
    echo "❌ Failed to fetch kubeconfig. Check SSH connection and permissions."
    echo "Debug info:"
    ssh -i $SSH_KEY -p $NGROK_PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -v $USER@$NGROK_HOST "echo Connection Test"
    exit 1
fi

echo "✅ Kubeconfig fetched successfully."

# 2. Setup SSH Tunnel for Kubernetes API
# Usually 6443 for K3s/K8s, 16443 for MicroK8s
REMOTE_API_PORT=$(grep "server:" /tmp/nvidia-kubeconfig.yaml | awk -F':' '{print $3}')
if [ -z "$REMOTE_API_PORT" ]; then
    REMOTE_API_PORT=6443
fi
LOCAL_API_PORT=6444

echo "   Detected remote API port: $REMOTE_API_PORT"
echo "   Setting up context..."

# Replace server URL in the fetched config
# We will use 127.0.0.1:LOCAL_API_PORT
sed -i '' "s|server: https://.*:$REMOTE_API_PORT|server: https://127.0.0.1:$LOCAL_API_PORT|g" /tmp/nvidia-kubeconfig.yaml

# Merge into local config
export KUBECONFIG=$LOCAL_KUBECONFIG:/tmp/nvidia-kubeconfig.yaml
kubectl config view --flatten > /tmp/merged-kubeconfig.yaml
mv /tmp/merged-kubeconfig.yaml $LOCAL_KUBECONFIG
chmod 600 $LOCAL_KUBECONFIG

# Rename the new context to NVIDIA
# Typically context name is 'default' for k3s
kubectl --kubeconfig=$LOCAL_KUBECONFIG config rename-context default "🚀 NVIDIA Server (Remote)" 2>/dev/null || \
kubectl --kubeconfig=$LOCAL_KUBECONFIG config rename-context k3s-default "🚀 NVIDIA Server (Remote)" 2>/dev/null || \
kubectl --kubeconfig=$LOCAL_KUBECONFIG config rename-context microk8s "🚀 NVIDIA Server (Remote)" 2>/dev/null

echo ""
echo "✅ NVIDIA Cluster added to VS Code!"
echo ""
echo "⚠️  IMPORTANT: Starting background SSH tunnel..."
# Kill existing tunnel if any
pkill -f "ssh.*-L $LOCAL_API_PORT" || true
# Start new tunnel
ssh -i $SSH_KEY -f -N -p $NGROK_PORT -L $LOCAL_API_PORT:127.0.0.1:$REMOTE_API_PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $USER@$NGROK_HOST
echo "✅ Tunnel started on port $LOCAL_API_PORT -> $REMOTE_API_PORT"
