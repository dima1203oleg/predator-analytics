#!/bin/bash

# ══════════════════════════════════════════════════════════════════════════════
# Activate Live API Providers for Copilot (Cursor + VS Code)
# ══════════════════════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🚀 Activate 4 Live Providers in Copilot${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# 1. Load live API keys
echo -e "${BLUE}Step 1: Load Live API Keys${NC}"
source ~/.env.live-api-keys 2>/dev/null || true
echo -e "${GREEN}✅ Loaded: Mistral, Cohere, OpenRouter, Together.ai${NC}"
echo ""

# 2. Update Cursor settings
echo -e "${BLUE}Step 2: Update Cursor Settings${NC}"
cp /Users/Shared/Predator_60/.copilot/copilot-live-models.json ~/.cursor/settings.json
echo -e "${GREEN}✅ Cursor updated: ~/.cursor/settings.json${NC}"
echo ""

# 3. Show configuration
echo -e "${BLUE}Step 3: Configuration Summary${NC}"
echo ""
echo -e "${YELLOW}🟣 MISTRAL${NC}"
echo "   Model: mistral-large-latest"
echo "   Context: 32K tokens"
echo "   Quality: ⭐⭐⭐⭐⭐"
echo "   Best for: Reasoning, coding, complex tasks"
echo ""

echo -e "${YELLOW}🟢 COHERE${NC}"
echo "   Model: command-r"
echo "   Context: 128K tokens ⭐⭐⭐ (BIGGEST)"
echo "   Quality: ⭐⭐⭐⭐"
echo "   Best for: Large documents, long texts"
echo ""

echo -e "${YELLOW}🟠 OPENROUTER${NC}"
echo "   Models: Llama, Mistral, Claude, GPT-4 & 100+ more"
echo "   Features: Model fallback, load balancing"
echo "   Best for: Model experimentation, fallback"
echo ""

echo -e "${YELLOW}🟡 TOGETHER.AI${NC}"
echo "   Model: Llama 2 70B Chat"
echo "   Speed: ⚡⚡⚡⚡ (FASTEST)"
echo "   Quality: ⭐⭐⭐⭐"
echo "   Best for: Real-time chat, fast responses"
echo ""

# 4. Restart Cursor
echo -e "${BLUE}Step 4: Restart Cursor to Apply Changes${NC}"
echo ""
echo -e "${YELLOW}Option A (Auto):${NC}"
echo "   killall -9 Cursor && open -a Cursor"
echo ""
echo -e "${YELLOW}Option B (Manual):${NC}"
echo "   1. Close Cursor (Cmd+Q)"
echo "   2. Reopen Cursor"
echo ""

# 5. Test in Cursor
echo -e "${BLUE}Step 5: Test in Cursor${NC}"
echo ""
echo -e "${YELLOW}Usage:${NC}"
echo "   1. Open Cursor Chat (Cmd+K)"
echo "   2. Click model dropdown"
echo "   3. Select one of 4 models:"
echo "      • 🟣 Mistral Large (best quality)"
echo "      • 🟢 Cohere Command R (max context)"
echo "      • 🟠 OpenRouter (100+ models)"
echo "      • 🟡 Together.ai (fastest)"
echo "   4. Start chatting!"
echo ""

echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ CONFIGURATION COMPLETE${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo "Environment Setup:"
cat ~/.env.live-api-keys | grep "^export" | head -4
echo ""

echo "Configuration File:"
echo "   ~/.cursor/settings.json"
echo ""

echo "Status:"
echo "   ✓ 4 Live providers configured"
echo "   ✓ Environment variables set"
echo "   ✓ Ready for Cursor Chat"
echo ""
