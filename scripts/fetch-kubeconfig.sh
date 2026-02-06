#!/bin/bash
set -e

# Configuration
SERVER_IP="194.177.1.240"
SSH_PORT="6666"
SSH_USER="dima"
SSH_KEY="$HOME/.ssh/id_ed25519_dev"
LOCAL_KUBE_CONFIG="$HOME/.kube/config"

echo "🚀 Fetching Kubernetes config from NVIDIA server..."

# Create .kube directory if it doesn't exist
mkdir -p "$HOME/.kube"

# Backup existing config if it exists
if [ -f "$LOCAL_KUBE_CONFIG" ]; then
    echo "📦 Backing up existing kubeconfig to $LOCAL_KUBE_CONFIG.bak"
    mv "$LOCAL_KUBE_CONFIG" "$LOCAL_KUBE_CONFIG.bak"
fi

# Fetch the config
# We try ~/.kube/config first (standard), then /etc/rancher/k3s/k3s.yaml (k3s)
echo "📥 Downloading config..."
if scp -P $SSH_PORT -i "$SSH_KEY" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$SSH_USER@$SERVER_IP:~/.kube/config" "$LOCAL_KUBE_CONFIG"; then
    echo "✅ Config downloaded successfully (from ~/.kube/config)."
elif scp -P $SSH_PORT -i "$SSH_KEY" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$SSH_USER@$SERVER_IP:/etc/rancher/k3s/k3s.yaml" "$LOCAL_KUBE_CONFIG"; then
    echo "✅ Config downloaded successfully (from k3s location)."
else
    echo "❌ Failed to download config. Ensure ~/.kube/config exists on the server."
    exit 1
fi

# Set correct permissions
chmod 600 "$LOCAL_KUBE_CONFIG"

echo "🔧 Adjusting config to work with SSH tunnel..."
# We assume the server config uses 127.0.0.1 or the local IP.
# Since we will use an SSH tunnel on port 6443, we ensure the config points to https://127.0.0.1:6443
# Mac's sed requires '' for inplace edits
sed -i '' 's|server: https://.*:6443|server: https://127.0.0.1:6443|g' "$LOCAL_KUBE_CONFIG"
# Just in case it's k3s which uses port 6443 by default too usually, but sometimes different.
# If it's a different port on the server, we might need manual adjustment, but 6443 is standard.

echo "✅ Kubeconfig setup complete!"
echo ""
echo "👉 IMPORTANT: You must run the SSH tunnel for this to work."
echo "   Run: ./scripts/server-connect.sh"
