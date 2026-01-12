#!/bin/bash
# Universal Predator Setup - Works for ANY user on this Mac
# This script configures SSH and environment for new users automatically

set -e

SHARED_DIR="/Users/Shared/Predator"
PREDATOR_PROJECT="/Users/dima-mac/Documents/Predator_21"

echo "🦁 Setting up Universal Predator Access..."

# 1. Create shared directory
sudo mkdir -p "$SHARED_DIR"

# 2. Copy SSH keys to shared location
echo "📁 Copying SSH keys to shared location..."
sudo cp ~/.ssh/id_ed25519_dev "$SHARED_DIR/"
sudo cp ~/.ssh/id_ed25519_dev.pub "$SHARED_DIR/"
sudo cp ~/.ssh/config "$SHARED_DIR/ssh_config"
sudo cp ~/.ssh/known_hosts "$SHARED_DIR/known_hosts" 2>/dev/null || true

# Make readable by all users but secure
sudo chmod 755 "$SHARED_DIR"
sudo chmod 644 "$SHARED_DIR/id_ed25519_dev.pub"
sudo chmod 644 "$SHARED_DIR/ssh_config"
sudo chmod 644 "$SHARED_DIR/known_hosts"
# Private key - readable only by staff group
sudo chmod 640 "$SHARED_DIR/id_ed25519_dev"
sudo chgrp staff "$SHARED_DIR/id_ed25519_dev"

# 3. Create universal setup script that runs on first terminal open
cat << 'SETUP_SCRIPT' | sudo tee "$SHARED_DIR/setup_user.sh" > /dev/null
#!/bin/bash
# Auto-setup for new Predator users

USER_HOME="$HOME"
SHARED_DIR="/Users/Shared/Predator"
PREDATOR_PROJECT="/Users/dima-mac/Documents/Predator_21"

# Check if already configured
if [ -f "$USER_HOME/.predator_configured" ]; then
    return 0 2>/dev/null || exit 0
fi

echo "🦁 First-time Predator setup for $USER..."

# Create .ssh directory
mkdir -p "$USER_HOME/.ssh"
chmod 700 "$USER_HOME/.ssh"

# Copy SSH keys
cp "$SHARED_DIR/id_ed25519_dev" "$USER_HOME/.ssh/"
cp "$SHARED_DIR/id_ed25519_dev.pub" "$USER_HOME/.ssh/"
cp "$SHARED_DIR/ssh_config" "$USER_HOME/.ssh/config"
cp "$SHARED_DIR/known_hosts" "$USER_HOME/.ssh/known_hosts" 2>/dev/null || true

chmod 600 "$USER_HOME/.ssh/id_ed25519_dev"
chmod 644 "$USER_HOME/.ssh/id_ed25519_dev.pub"
chmod 600 "$USER_HOME/.ssh/config"

# Create symlink to project
mkdir -p "$USER_HOME/Documents"
ln -sf "$PREDATOR_PROJECT" "$USER_HOME/Documents/Predator_21" 2>/dev/null || true

# Create Desktop shortcut
mkdir -p "$USER_HOME/Desktop"
cat << 'SHORTCUT' > "$USER_HOME/Desktop/Predator_Start.command"
#!/bin/bash
cd ~/Documents/Predator_21 2>/dev/null || cd /Users/dima-mac/Documents/Predator_21
echo "🦁 Predator Analytics"
echo "====================="
echo ""
echo "📊 Checking server status..."
ssh predator-server 'docker ps --format "table {{.Names}}\t{{.Status}}" | grep predator' 2>/dev/null || echo "Server not accessible"
echo ""
echo "Commands:"
echo "  ssh predator-server              - Connect to server"
echo "  docker logs -f predator_orchestrator  - View AI logs"
echo ""
read -p "Press Enter to exit..."
SHORTCUT
chmod +x "$USER_HOME/Desktop/Predator_Start.command"

# Mark as configured
touch "$USER_HOME/.predator_configured"

echo "✅ Predator setup complete!"
echo "Use: predator, server, logs, deploy"
SETUP_SCRIPT

sudo chmod +x "$SHARED_DIR/setup_user.sh"

# 4. Create global profile that ALL users source
cat << 'PROFILE' | sudo tee /etc/profile.d/predator.sh > /dev/null
# Predator Analytics - Universal Configuration
# This file is sourced by all users on login

export PREDATOR_PROJECT="/Users/dima-mac/Documents/Predator_21"

# Run first-time setup if needed
if [ -f /Users/Shared/Predator/setup_user.sh ] && [ ! -f "$HOME/.predator_configured" ]; then
    source /Users/Shared/Predator/setup_user.sh
fi

# Aliases for all users
alias predator="cd ~/Documents/Predator_21 2>/dev/null || cd /Users/dima-mac/Documents/Predator_21"
alias server="ssh predator-server"
alias logs="ssh predator-server 'docker logs -f predator_orchestrator'"
alias status="ssh predator-server 'docker ps'"
alias deploy="cd /Users/dima-mac/Documents/Predator_21 && ./scripts/deploy_orchestrator.sh"
alias start_orch="ssh predator-server 'cd ~/predator_v25 && docker compose up -d orchestrator'"
alias stop_orch="ssh predator-server 'docker stop predator_orchestrator'"

# Add SSH key
ssh-add ~/.ssh/id_ed25519_dev 2>/dev/null

# Welcome (only in interactive shells)
if [[ $- == *i* ]] && [ ! -f "$HOME/.predator_welcomed" ]; then
    echo ""
    echo "🦁 Predator Analytics Ready!"
    echo "Commands: predator | server | logs | status | deploy"
    echo ""
    touch "$HOME/.predator_welcomed"
fi
PROFILE

# 5. Make sure /etc/profile.d exists and is sourced
sudo mkdir -p /etc/profile.d

# 6. Add sourcing to /etc/zprofile for zsh (default macOS shell)
if ! grep -q "profile.d/predator.sh" /etc/zprofile 2>/dev/null; then
    echo "" | sudo tee -a /etc/zprofile > /dev/null
    echo "# Predator Analytics" | sudo tee -a /etc/zprofile > /dev/null
    echo '[ -f /etc/profile.d/predator.sh ] && source /etc/profile.d/predator.sh' | sudo tee -a /etc/zprofile > /dev/null
fi

# 7. Also add to /etc/bashrc for bash users
if ! grep -q "profile.d/predator.sh" /etc/bashrc 2>/dev/null; then
    echo "" | sudo tee -a /etc/bashrc > /dev/null
    echo "# Predator Analytics" | sudo tee -a /etc/bashrc > /dev/null
    echo '[ -f /etc/profile.d/predator.sh ] && source /etc/profile.d/predator.sh' | sudo tee -a /etc/bashrc > /dev/null
fi

# 8. Set project folder permissions for all users
chmod -R o+rX "$PREDATOR_PROJECT"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Universal Predator Access Configured!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Now ANY user who logs into this Mac will automatically get:"
echo "  ✓ SSH access to the server"
echo "  ✓ Project symlink in Documents"
echo "  ✓ All shortcuts (predator, server, logs, etc.)"
echo "  ✓ Desktop quick-start icon"
echo ""
echo "No manual setup required!"
