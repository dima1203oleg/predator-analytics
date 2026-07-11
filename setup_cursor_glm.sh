#!/bin/bash

# 🚀 Cursor + GLM Models Auto-Setup Script
# Usage: bash setup_cursor_glm.sh

set -e

echo "🎯 Setting up Cursor with GLM-5.1, GLM-5, GLM-4.7 models..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Set API Key
echo -e "${BLUE}Step 1: Setting up API Key${NC}"
API_KEY="bd39ed3a72b54632a98eb50515578272.F3D34MOPpAfbP7vg"

# Check if API key is already in shell profile
SHELL_RC="$HOME/.zshrc"
if ! grep -q "ZAI_API_KEY" "$SHELL_RC"; then
    echo "Adding API key to $SHELL_RC..."
    echo "" >> "$SHELL_RC"
    echo "# Z.ai GLM API Key (Added by setup_cursor_glm.sh)" >> "$SHELL_RC"
    echo "export ZAI_API_KEY=\"$API_KEY\"" >> "$SHELL_RC"
    echo -e "${GREEN}✅ API Key added to $SHELL_RC${NC}"
else
    echo -e "${YELLOW}⚠️  API Key already exists in $SHELL_RC${NC}"
fi

# Export for current session
export ZAI_API_KEY="$API_KEY"

# 2. Create Cursor Settings Directory
echo ""
echo -e "${BLUE}Step 2: Creating Cursor Configuration${NC}"

CURSOR_SETTINGS="$HOME/.cursor/settings.json"
mkdir -p "$HOME/.cursor"

# Backup existing settings if they exist
if [ -f "$CURSOR_SETTINGS" ]; then
    cp "$CURSOR_SETTINGS" "${CURSOR_SETTINGS}.bak"
    echo "📦 Backed up existing settings to ${CURSOR_SETTINGS}.bak"
fi

# Create new settings with GLM models
cat > "$CURSOR_SETTINGS" << 'EOF'
{
  "customModels": [
    {
      "id": "glm-5.1",
      "name": "GLM-5.1 (Coding Plan)",
      "provider": "openai",
      "baseURL": "https://api.z.ai/api/coding/paas/v4",
      "model": "glm-5.1",
      "apiKey": "${env.ZAI_API_KEY}",
      "contextWindow": 128000,
      "maxTokens": 4096
    },
    {
      "id": "glm-5",
      "name": "GLM-5 (Standard)",
      "provider": "openai",
      "baseURL": "https://api.z.ai/api/coding/paas/v4",
      "model": "glm-5",
      "apiKey": "${env.ZAI_API_KEY}",
      "contextWindow": 128000,
      "maxTokens": 4096
    },
    {
      "id": "glm-4.7",
      "name": "GLM-4.7 (Fast)",
      "provider": "openai",
      "baseURL": "https://api.z.ai/api/coding/paas/v4",
      "model": "glm-4-plus",
      "apiKey": "${env.ZAI_API_KEY}",
      "contextWindow": 128000,
      "maxTokens": 4096
    }
  ],
  "defaultModel": "glm-5.1",
  "aiSettings": {
    "language": "uk",
    "responseFormat": "markdown"
  }
}
EOF

echo -e "${GREEN}✅ Cursor settings configured${NC}"
echo "   Location: $CURSOR_SETTINGS"

# 3. Verify Configuration
echo ""
echo -e "${BLUE}Step 3: Verifying Configuration${NC}"

echo "📋 API Key: ${API_KEY:0:10}...${API_KEY: -10}"

echo -n "🌐 Testing Z.ai API connectivity... "
RESPONSE=$(curl -s -X POST https://api.z.ai/api/coding/paas/v4/chat/completions \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"glm-5.1","messages":[{"role":"user","content":"test"}]}' 2>/dev/null)

if echo "$RESPONSE" | grep -q "error"; then
    if echo "$RESPONSE" | grep -q "Insufficient balance"; then
        echo -e "${YELLOW}⚠️  API Key valid, but account has insufficient balance${NC}"
        echo "   Action: Recharge at https://z.ai/dashboard"
    else
        echo -e "${YELLOW}⚠️  API Error: $(echo $RESPONSE | head -c 50)${NC}"
    fi
else
    echo -e "${GREEN}✅ API connection OK${NC}"
fi

# 4. Summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "📝 Next Steps:"
echo "1. Reload shell configuration:"
echo "   ${BLUE}source ~/.zshrc${NC}"
echo ""
echo "2. Restart Cursor completely:"
echo "   ${BLUE}killall -9 Cursor && open -a Cursor${NC}"
echo ""
echo "3. In Cursor, open AI Chat (Cmd+K)"
echo "   You should see GLM models in the selector:"
echo "   • GLM-5.1 (Coding Plan) ← Recommended for complex tasks"
echo "   • GLM-5 (Standard)"
echo "   • GLM-4.7 (Fast)"
echo ""
echo "🚀 Available Models:"
echo "   • glm-5.1  → Max 128K input, 4K output (complex analysis)"
echo "   • glm-5    → Max 128K input, 4K output (standard tasks)"
echo "   • glm-4.7  → Max 128K input, 4K output (quick responses)"
echo ""

if echo "$RESPONSE" | grep -q "Insufficient balance"; then
    echo -e "${YELLOW}⚠️  IMPORTANT: Account balance is LOW${NC}"
    echo "   Visit: https://z.ai/dashboard"
    echo "   Add payment method → Purchase resource package"
    echo ""
fi

echo "📚 Documentation:"
echo "   Full guide: /Users/Shared/Predator_60/CURSOR_SETUP_FINAL.md"
echo "   Rules: /Users/Shared/Predator_60/.cursorrules"
echo ""
echo "Need help? Check CURSOR_SETUP_FINAL.md for troubleshooting."
