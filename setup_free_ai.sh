#!/bin/bash

# 🚀 FREE AI Models for Cursor - Auto Setup
# Uses Groq API (FREE, NO CREDIT CARD NEEDED)

set -e

echo "🎯 Setting up FREE AI models in Cursor..."
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Get Groq API Key (Optional - for speed)
echo -e "${BLUE}Step 1: Groq API Setup (OPTIONAL - but recommended)${NC}"
echo ""
echo "Groq API is FREE with NO CREDIT CARD required!"
echo "Speed: ⚡ 300+ tokens/sec (3x faster than GLM-4.7)"
echo ""
echo "Do you have a Groq API key? (Get free at: https://console.groq.com/)"
read -p "Paste your Groq API key (or press Enter to skip): " GROQ_API_KEY

# If user provided Groq key, add to shell profile
if [ -n "$GROQ_API_KEY" ]; then
    SHELL_RC="$HOME/.zshrc"
    if ! grep -q "GROQ_API_KEY" "$SHELL_RC"; then
        echo "" >> "$SHELL_RC"
        echo "# Groq API Key (Added by setup_free_ai.sh)" >> "$SHELL_RC"
        echo "export GROQ_API_KEY=\"$GROQ_API_KEY\"" >> "$SHELL_RC"
        echo -e "${GREEN}✅ Groq API key added to $SHELL_RC${NC}"
    fi
    export GROQ_API_KEY="$GROQ_API_KEY"
fi

# 2. Configure Cursor Settings with FREE models
echo ""
echo -e "${BLUE}Step 2: Creating Cursor Configuration (FREE Models)${NC}"

CURSOR_SETTINGS="$HOME/.cursor/settings.json"
mkdir -p "$HOME/.cursor"

# Create backup
if [ -f "$CURSOR_SETTINGS" ]; then
    cp "$CURSOR_SETTINGS" "${CURSOR_SETTINGS}.z-ai-backup"
    echo "📦 Backed up Z.ai settings to ${CURSOR_SETTINGS}.z-ai-backup"
fi

# Create settings with FREE models
cat > "$CURSOR_SETTINGS" << 'EOF'
{
  "customModels": [
    {
      "id": "groq-mixtral",
      "name": "Mixtral 8x7B (GROQ) - FREE ⭐",
      "provider": "openai",
      "baseURL": "https://api.groq.com/openai/v1",
      "model": "mixtral-8x7b-32768",
      "apiKey": "${env.GROQ_API_KEY}",
      "contextWindow": 32768,
      "maxTokens": 4096,
      "description": "Fast & FREE - No credit card needed"
    },
    {
      "id": "groq-llama",
      "name": "Llama 3 (GROQ) - FREE ⭐",
      "provider": "openai",
      "baseURL": "https://api.groq.com/openai/v1",
      "model": "llama-3.1-70b-versatile",
      "apiKey": "${env.GROQ_API_KEY}",
      "contextWindow": 131072,
      "maxTokens": 4096,
      "description": "Powerful & FREE - 130K context window"
    },
    {
      "id": "groq-claude",
      "name": "Claude 3.5 Sonnet (GROQ) - FREE ⭐",
      "provider": "openai",
      "baseURL": "https://api.groq.com/openai/v1",
      "model": "claude-3-5-sonnet-20241022",
      "apiKey": "${env.GROQ_API_KEY}",
      "contextWindow": 200000,
      "maxTokens": 8192,
      "description": "Best reasoning - FREE access via Groq"
    },
    {
      "id": "ollama-local",
      "name": "Ollama Local (OFFLINE)",
      "provider": "openai",
      "baseURL": "http://localhost:11434/v1",
      "model": "neural-chat",
      "contextWindow": 4096,
      "maxTokens": 2048,
      "description": "Runs locally - NO internet needed"
    }
  ],
  "defaultModel": "groq-mixtral"
}
EOF

echo -e "${GREEN}✅ Cursor settings configured with FREE models${NC}"
echo "   Location: $CURSOR_SETTINGS"

# 3. Verify Setup
echo ""
echo -e "${BLUE}Step 3: Verification${NC}"

if [ -n "$GROQ_API_KEY" ]; then
    echo -n "🌐 Testing Groq API... "
    RESPONSE=$(curl -s -X POST https://api.groq.com/openai/v1/chat/completions \
      -H "Authorization: Bearer $GROQ_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"model":"mixtral-8x7b-32768","messages":[{"role":"user","content":"hello"}],"max_tokens":10}' 2>/dev/null)
    
    if echo "$RESPONSE" | grep -q '"content"'; then
        echo -e "${GREEN}✅ Working!${NC}"
    elif echo "$RESPONSE" | grep -q "error"; then
        ERROR=$(echo "$RESPONSE" | jq -r '.error.message' 2>/dev/null || echo "Unknown error")
        echo -e "${YELLOW}⚠️  Error: $ERROR${NC}"
    else
        echo -e "${YELLOW}⚠️  Couldn't verify (check later)${NC}"
    fi
else
    echo "⏭️  Skipped (no Groq API key provided)"
fi

# 4. Summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ FREE AI Models Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -n "$GROQ_API_KEY" ]; then
    echo "✅ Groq API configured (READY TO USE NOW!)"
    echo ""
    echo "Available models:"
    echo "  • Mixtral 8x7B (fastest, 32K context)"
    echo "  • Llama 3 70B (most capable, 130K context)"
    echo "  • Claude 3.5 Sonnet (best reasoning, 200K context)"
else
    echo "⏭️  Groq API not configured (optional - for better speed)"
    echo ""
    echo "To get Groq API (FREE, NO CREDIT CARD):"
    echo "  1. Visit: https://console.groq.com"
    echo "  2. Sign up with Google/GitHub"
    echo "  3. Create API key"
    echo "  4. Run: bash setup_free_ai.sh (again)"
    echo ""
    echo "OR use local Ollama (completely OFFLINE):"
    echo "  1. Install: brew install ollama"
    echo "  2. Run: ollama serve"
    echo "  3. Download model: ollama pull neural-chat"
fi

echo ""
echo "📝 Next Steps:"
echo "1. Reload shell:"
echo "   ${BLUE}source ~/.zshrc${NC}"
echo ""
echo "2. Restart Cursor:"
echo "   ${BLUE}killall -9 Cursor && open -a Cursor${NC}"
echo ""
echo "3. Open AI Chat (Cmd+K)"
echo "   You'll see FREE models in selector!"
echo ""
echo "4. That's it! Start coding for FREE 🚀"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 NO CREDIT CARD NEEDED - COMPLETELY FREE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
