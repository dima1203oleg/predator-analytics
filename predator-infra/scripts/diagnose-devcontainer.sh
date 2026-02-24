#!/bin/bash
# diagnose-devcontainer.sh - Production-safe diagnostics

echo "=== PREDATOR INFRA DIAGNOSTICS (Production-Safe) ==="
echo ""

# 1. Groups & Permissions
echo "[1] USER PERMISSIONS"
echo "------------------------"
echo "Current user: $USER"
echo "Groups: $(groups)"
ls -l /var/run/docker.sock | awk '{print "Socket permissions: "$1" Owner: "$3" Group: "$4}'
echo ""

# 2. Docker Status
echo "[2] DOCKER STATUS"
echo "------------------------"
if docker ps &>/dev/null; then
    echo "Docker connectivity: OK (Headed/Headless mode ready)"
    echo "Running containers: $(docker ps -q | wc -l)"
else
    echo "Docker connectivity: FAILED (Check group membership or socket permissions)"
fi
echo ""

# 3. K8s/K3s Status
echo "[3] KUBERNETES STATUS (K3s)"
echo "------------------------"
if kubectl get nodes &>/dev/null; then
    echo "K8s API: OK"
    echo "Node status: $(kubectl get nodes --no-headers | awk '{print $1" is "$2}')"
else
    echo "K8s API: FAILED (Check k3s service)"
fi
echo ""

# 4. Dev Container Config
echo "[4] DEV CONTAINER CONFIG"
echo "------------------------"
CONFIG_PATH="/opt/dev/infra/devcontainer/.devcontainer/devcontainer.json"
if [ -f "$CONFIG_PATH" ]; then
    echo "Config found: $CONFIG_PATH"
    # Basic validation
    grep -q "nvidia.com/gpu" /opt/dev/infra/helm/dev-env/templates/deployment.yaml && echo "  ✓ GPU Resource Limits detected in Helm"
else
    echo "Config NOT FOUND at $CONFIG_PATH"
fi

# 5. IDE Extension Audit (Antigravity Server)
echo ""
echo "[5] IDE EXTENSIONS (Antigravity Server)"
echo "------------------------"
EXT_DIR="$HOME/.antigravity-server/extensions"
if [ -d "$EXT_DIR" ]; then
    ls -1 "$EXT_DIR" | grep -E "containers|docker|python" | sed 's/^/  ✓ /'
else
    echo "Antigravity server extensions directory not found at $EXT_DIR."
fi

echo ""
echo "=== SUMMARY ==="
echo "If VS Code shows 'No data provider registered', verify the 'Dev Containers' extension is installed on the Remote Host in the Extensions side panel."
