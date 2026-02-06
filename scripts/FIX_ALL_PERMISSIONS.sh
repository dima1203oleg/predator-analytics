#!/bin/bash
set -e

echo "🔧 PREDATOR SYSTEM REPAIR - Auto-Fix Permissions"
echo "==============================================="

USER=$(whoami)
GROUP=$(id -gn)

echo "👉 1. Fixing Homebrew Permissions..."
# Fix Homebrew directories
DIRS_TO_FIX=(
    "/Users/$USER/Library/Caches/Homebrew"
    "/Users/$USER/Library/Logs/Homebrew"
    "/opt/homebrew"
)

for dir in "${DIRS_TO_FIX[@]}"; do
    if [ -d "$dir" ]; then
        echo "   Fixing $dir..."
        sudo chown -R "$USER:$GROUP" "$dir"
        sudo chmod -R u+w "$dir"
    fi
done

echo "👉 2. Fixing Project Permissions (node_modules)..."
PROJECT_DIR="/Users/$USER/Documents/Predator_21"
if [ -d "$PROJECT_DIR" ]; then
    echo "   Fixing $PROJECT_DIR..."
    sudo chown -R "$USER:$GROUP" "$PROJECT_DIR"
    # Ensure node_modules are accessible
    find "$PROJECT_DIR" -name "node_modules" -type d -exec sudo chown -R "$USER:$GROUP" {} +
fi

echo "👉 3. Fixing Network/SSH Permissions..."
# Sometimes macOS network permissions get stuck. Flushing DNS and resetting might help,
# but usually 'Operation not permitted' on SSH is an App Sandbox issue or Firewall.
# We will ensure the .ssh directory is correct.
mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"
if [ -f "$HOME/.ssh/id_ed25519_dev" ]; then
    chmod 600 "$HOME/.ssh/id_ed25519_dev"
fi

echo ""
echo "✅ Repairs Complete! Please retry the deployment command."
