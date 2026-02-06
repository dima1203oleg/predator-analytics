#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 PREDATOR SYSTEM LAUNCHER${NC}"
echo "==========================================="

# 1. Install k9s if missing
if ! command -v k9s &> /dev/null; then
    echo -e "${YELLOW}📦 Installing k9s...${NC}"
    if command -v brew &> /dev/null; then
        brew install k9s || echo -e "${RED}Brew install failed, trying manual...${NC}"
    fi

    if ! command -v k9s &> /dev/null; then
        echo "   Downloading binary..."
        curl -L -o k9s.tar.gz https://github.com/derailed/k9s/releases/download/v0.32.7/k9s_Darwin_arm64.tar.gz
        tar -xzf k9s.tar.gz
        chmod +x k9s
        sudo mv k9s /usr/local/bin/ || mkdir -p ~/bin && mv k9s ~/bin/
        rm k9s.tar.gz
    fi
else
    echo -e "${GREEN}✓ k9s is already installed${NC}"
fi

# 2. Fetch Kubeconfig
echo -e "${YELLOW}🔑 Configuring Kubernetes Access...${NC}"
./scripts/fetch-kubeconfig.sh || echo -e "${RED}⚠️  Could not fetch kubeconfig (SSH error?)${NC}"

# 3. Start Tunnel
echo -e "${YELLOW}🚇 Starting Server Tunnel...${NC}"
./scripts/server-connect.sh > /dev/null 2>&1 &
PID_TUNNEL=$!
echo -e "${GREEN}✓ Tunnel started (PID: $PID_TUNNEL)${NC}"

# 4. Open K9s in a new tab (if using iTerm or Terminal)
echo -e "${YELLOW}🐺 Launching k9s...${NC}"
# We can't easily launch a new tab from script without AppleScript,
# so we just tell the user to run it.
echo "   👉 Run 'k9s' in a new terminal tab to manage the cluster."

# 5. Launch Local Frontend
echo -e "${YELLOW}🖥️  Launching Local Frontend...${NC}"
cd apps/predator-analytics-ui
if [ -d "node_modules" ]; then
    npm run dev
else
    echo -e "${RED}❌ node_modules missing. Run 'npm install' first.${NC}"
fi
