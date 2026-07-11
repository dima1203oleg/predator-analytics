#!/bin/bash
# Script to configure local kubectl to use the NVIDIA server cluster

SERVER_IP="194.177.1.240"
SERVER_PORT="6666"
USER="dima"

echo "📡 Fetching kubeconfig from server..."
KUBECONFIG_CONTENT=$(ssh -p $SERVER_PORT -o StrictHostKeyChecking=no $USER@$SERVER_IP "sudo cat /etc/rancher/k3s/k3s.yaml")

if [ -z "$KUBECONFIG_CONTENT" ]; then
    echo "❌ Failed to fetch kubeconfig"
    exit 1
fi

# Modify the server address
MODIFIED_CONFIG=$(echo "$KUBECONFIG_CONTENT" | sed "s|https://127.0.0.1:6443|https://$SERVER_IP:6443|g")

# Save to a dedicated file
mkdir -p ~/.kube
echo "$MODIFIED_CONFIG" > ~/.kube/predator-config

echo "✅ Kubeconfig saved to ~/.kube/predator-config"
echo "🚀 To use this context, run:"
echo "   export KUBECONFIG=~/.kube/predator-config"
echo "   kubectl get pods -n predator-nvidia"

# Optional: switch current context
# kubectl config --kubeconfig=$HOME/.kube/predator-config use-context default
