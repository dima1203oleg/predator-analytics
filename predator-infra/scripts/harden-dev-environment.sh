#!/bin/bash
# harden-dev-environment.sh - Production-safe environment hardening

set -e

echo "=== HARDENING REMOTE DEV ENVIRONMENT ==="

# 1. Ensure correct group permissions for docker
echo "[1] Configuring Docker group permissions..."
if ! groups | grep -q docker; then
    sudo usermod -aG docker $USER
fi
# Also ensure devuser is in correctly
if id "devuser" &>/dev/null; then
    sudo usermod -aG docker devuser
fi

# 2. Reset docker.sock to safe permissions (660)
echo "[2] Resetting docker.sock permissions to 660..."
sudo chmod 660 /var/run/docker.sock
sudo chown root:docker /var/run/docker.sock

# 3. Clean up stale IDE servers (VS Code, Antigravity, etc.)
echo "[3] Cleaning up stale IDE server processes..."
sudo pkill -f "vscode-server" || true
sudo pkill -f "antigravity-server" || true

# 4. Remove potentially corrupted extension caches
echo "[4] Clearing extension caches..."
# We don't delete everything, just the specific problematic ones if needed
# rm -rf ~/.antigravity-server/extensions/ms-vscode-remote.remote-containers* 

# 5. Verify system limits for high-performance dev
echo "[5] Verifying system limits..."
if grep -q "max_map_count=262144" /etc/sysctl.conf; then
    echo "  ✓ vm.max_map_count is correct"
else
    echo "  ! vm.max_map_count needs update"
    sudo sysctl -w vm.max_map_count=262144
fi

echo ""
echo "=== HARDENING COMPLETE ==="
echo "Note: If 'No data provider registered' persists, please ensure 'Dev Containers' extension is installed on the SSH-host via the Extensions panel."
