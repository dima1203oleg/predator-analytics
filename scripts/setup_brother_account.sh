#!/bin/bash
# Setup script to enable Predator Analytics access for another user account
# Run this ONCE from dima-mac account before switching users

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🔧 Setting up Predator Analytics for Brother${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Get brother's username
echo -e "${YELLOW}Enter your brother's macOS username:${NC}"
read BROTHER_USER

if [ -z "$BROTHER_USER" ]; then
    echo -e "${RED}Error: Username cannot be empty${NC}"
    exit 1
fi

BROTHER_HOME="/Users/$BROTHER_USER"

if [ ! -d "$BROTHER_HOME" ]; then
    echo -e "${RED}Error: User home directory $BROTHER_HOME does not exist${NC}"
    echo -e "${YELLOW}Available users:${NC}"
    ls /Users/ | grep -v Shared
    exit 1
fi

echo -e "${GREEN}Setting up for user: $BROTHER_USER${NC}"

# 1. Create .ssh directory for brother
echo -e "${YELLOW}📁 Setting up SSH...${NC}"
sudo mkdir -p "$BROTHER_HOME/.ssh"
sudo cp ~/.ssh/id_ed25519_dev "$BROTHER_HOME/.ssh/"
sudo cp ~/.ssh/id_ed25519_dev.pub "$BROTHER_HOME/.ssh/"
sudo cp ~/.ssh/config "$BROTHER_HOME/.ssh/"
sudo cp ~/.ssh/known_hosts "$BROTHER_HOME/.ssh/" 2>/dev/null || true
sudo chown -R "$BROTHER_USER:staff" "$BROTHER_HOME/.ssh"
sudo chmod 700 "$BROTHER_HOME/.ssh"
sudo chmod 600 "$BROTHER_HOME/.ssh/id_ed25519_dev"
sudo chmod 644 "$BROTHER_HOME/.ssh/id_ed25519_dev.pub"
sudo chmod 600 "$BROTHER_HOME/.ssh/config"
echo -e "${GREEN}✅ SSH keys copied${NC}"

# 2. Create symlink to project (shared access)
echo -e "${YELLOW}📂 Creating project symlink...${NC}"
sudo mkdir -p "$BROTHER_HOME/Documents"
sudo ln -sf "/Users/dima-mac/Documents/Predator_21" "$BROTHER_HOME/Documents/Predator_21"
sudo chown -h "$BROTHER_USER:staff" "$BROTHER_HOME/Documents/Predator_21"
echo -e "${GREEN}✅ Project linked${NC}"

# 3. Create .zshrc with environment variables
echo -e "${YELLOW}⚙️ Setting up environment...${NC}"
cat << 'EOF' | sudo tee "$BROTHER_HOME/.zshrc" > /dev/null
# Predator Analytics Environment
export PATH="$HOME/bin:/usr/local/bin:$PATH"

# SSH Agent
eval "$(ssh-agent -s)" > /dev/null 2>&1
ssh-add ~/.ssh/id_ed25519_dev 2>/dev/null

# Predator shortcuts
alias predator="cd ~/Documents/Predator_21"
alias server="ssh predator-server"
alias logs="ssh predator-server 'docker logs -f predator_orchestrator'"
alias status="ssh predator-server 'docker ps'"
alias deploy="cd ~/Documents/Predator_21 && ./scripts/deploy_orchestrator.sh"

# Welcome message
echo "🦁 Predator Analytics ready!"
echo "Commands: predator, server, logs, status, deploy"
EOF

sudo chown "$BROTHER_USER:staff" "$BROTHER_HOME/.zshrc"
echo -e "${GREEN}✅ Environment configured${NC}"

# 4. Create quick-start script on Desktop
echo -e "${YELLOW}🖥️ Creating desktop shortcut...${NC}"
sudo mkdir -p "$BROTHER_HOME/Desktop"
cat << 'EOF' | sudo tee "$BROTHER_HOME/Desktop/Predator_Start.command" > /dev/null
#!/bin/bash
cd ~/Documents/Predator_21
echo "🦁 Predator Analytics"
echo "====================="
echo ""
echo "📊 Checking server status..."
ssh predator-server 'docker ps --format "table {{.Names}}\t{{.Status}}" | grep predator'
echo ""
echo "📜 Recent orchestrator logs:"
ssh predator-server 'docker logs predator_orchestrator --tail 10'
echo ""
echo "Press Enter to exit..."
read
EOF

sudo chmod +x "$BROTHER_HOME/Desktop/Predator_Start.command"
sudo chown "$BROTHER_USER:staff" "$BROTHER_HOME/Desktop/Predator_Start.command"
echo -e "${GREEN}✅ Desktop shortcut created${NC}"

# 5. Grant folder permissions
echo -e "${YELLOW}🔐 Setting permissions...${NC}"
chmod -R o+rX /Users/dima-mac/Documents/Predator_21
echo -e "${GREEN}✅ Permissions set${NC}"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}When your brother logs in, he should:${NC}"
echo "1. Open Terminal"
echo "2. Type: predator (to go to project)"
echo "3. Type: server (to connect to NVIDIA server)"
echo "4. Type: logs (to see orchestrator logs)"
echo ""
echo -e "${GREEN}Or just double-click 'Predator_Start.command' on Desktop${NC}"
