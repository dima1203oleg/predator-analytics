#!/bin/bash
# Setup script for the Developer (Current User)
# Adds useful aliases to .zshrc

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Configuring Developer Environment...${NC}"

ALIASES=$(cat << 'EOF'

# Predator Analytics Shortcuts
alias predator="cd ~/Documents/Predator_21"
alias server="ssh predator-server"
alias logs="ssh predator-server 'docker logs -f predator_orchestrator'"
alias status="ssh predator-server 'docker ps'"
alias deploy="cd ~/Documents/Predator_21 && ./scripts/deploy_orchestrator.sh"
alias start_orch="ssh predator-server 'cd ~/predator_v25 && docker compose up -d orchestrator'"
alias stop_orch="ssh predator-server 'docker stop predator_orchestrator'"
EOF
)

if grep -q "Predator Analytics Shortcuts" ~/.zshrc; then
    echo -e "${GREEN}✅ Aliases already present in ~/.zshrc${NC}"
else
    echo "$ALIASES" >> ~/.zshrc
    echo -e "${GREEN}✅ Aliases added to ~/.zshrc${NC}"
fi

echo -e "${BLUE}💡 Run 'source ~/.zshrc' to apply changes immediately.${NC}"
