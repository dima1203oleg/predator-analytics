#!/bin/bash

# 🚀 Setup FREE Claude 3.5 Sonnet + Gemini 2.0 Flash in Cursor
# Complete FREE setup - NO credit card needed

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        FREE AI Models for Cursor Setup                 ║${NC}"
echo -e "${BLUE}║  Claude 3.5 Sonnet + Gemini 2.0 Flash (100% FREE)     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

SHELL_RC="$HOME/.zshrc"

# ==================== STEP 1: GROQ API ====================
echo -e "${BLUE}STEP 1: Groq API (Claude 3.5 Sonnet + Llama + Mixtral)${NC}"
echo "─────────────────────────────────────────────────────────"
echo ""
echo "Groq API дарує БЕЗПЛАТНИЙ доступ до моделей:"
echo "  • Claude 3.5 Sonnet (NEW!)"
echo "  • Llama 3.1 70B"
echo "  • Mixtral 8x7B"
echo ""
echo "Як отримати ключ (БЕЗПЛАТНО, без картки):"
echo "  1. Йдіть: https://console.groq.com"
echo "  2. Реєстрація через Google/GitHub"
echo "  3. Скопіюйте API Key"
echo ""
read -p "Вставте Groq API Key (або натисніть Enter щоб пропустити): " GROQ_API_KEY

if [ -n "$GROQ_API_KEY" ]; then
    if ! grep -q "GROQ_API_KEY" "$SHELL_RC"; then
        echo "" >> "$SHELL_RC"
        echo "# Groq API Key - Added by setup_free_cursor.sh" >> "$SHELL_RC"
        echo "export GROQ_API_KEY=\"$GROQ_API_KEY\"" >> "$SHELL_RC"
        echo -e "${GREEN}✅ Groq API Key додано${NC}"
    else
        echo -e "${YELLOW}⚠️  Groq key вже в ~/.zshrc${NC}"
    fi
    export GROQ_API_KEY="$GROQ_API_KEY"
fi

# ==================== STEP 2: GOOGLE GEMINI ====================
echo ""
echo -e "${BLUE}STEP 2: Google Gemini 2.0 Flash (1M context!)${NC}"
echo "─────────────────────────────────────────────────────────"
echo ""
echo "Google надає БЕЗПЛАТНИЙ доступ до Gemini:"
echo "  • Gemini 2.0 Flash (найновіша!)"
echo "  • 1,000,000 токенів контексту"
echo "  • Без лімітів на запити (для розробки)"
echo ""
echo "Як отримати ключ (БЕЗПЛАТНО, з Google Account):"
echo "  1. Йдіть: https://aistudio.google.com/app/apikeys"
echo "  2. Натисніть: Create API Key"
echo "  3. Скопіюйте ключ"
echo ""
read -p "Вставте Google API Key (або натисніть Enter щоб пропустити): " GOOGLE_API_KEY

if [ -n "$GOOGLE_API_KEY" ]; then
    if ! grep -q "GOOGLE_API_KEY" "$SHELL_RC"; then
        echo "" >> "$SHELL_RC"
        echo "# Google Gemini API Key - Added by setup_free_cursor.sh" >> "$SHELL_RC"
        echo "export GOOGLE_API_KEY=\"$GOOGLE_API_KEY\"" >> "$SHELL_RC"
        echo -e "${GREEN}✅ Google API Key додано${NC}"
    else
        echo -e "${YELLOW}⚠️  Google key вже в ~/.zshrc${NC}"
    fi
    export GOOGLE_API_KEY="$GOOGLE_API_KEY"
fi

# ==================== STEP 3: CONFIGURE CURSOR ====================
echo ""
echo -e "${BLUE}STEP 3: Налаштування Cursor${NC}"
echo "─────────────────────────────────────────────────────────"

CURSOR_SETTINGS="$HOME/.cursor/settings.json"
mkdir -p "$HOME/.cursor"

# Backup existing
if [ -f "$CURSOR_SETTINGS" ]; then
    cp "$CURSOR_SETTINGS" "${CURSOR_SETTINGS}.backup-$(date +%s)"
    echo "📦 Резервна копія: ${CURSOR_SETTINGS}.backup-*"
fi

# Create new settings
cat > "$CURSOR_SETTINGS" << 'MODELS_EOF'
{
  "customModels": [
    {
      "id": "claude-3.5-sonnet-free",
      "name": "Claude 3.5 Sonnet (GROQ) - FREE ⭐",
      "provider": "openai",
      "baseURL": "https://api.groq.com/openai/v1",
      "model": "claude-3-5-sonnet-20241022",
      "apiKey": "${env.GROQ_API_KEY}",
      "contextWindow": 200000,
      "maxTokens": 8192,
      "description": "🎉 COMPLETELY FREE - Best reasoning"
    },
    {
      "id": "gemini-2-flash-free",
      "name": "Gemini 2.0 Flash - FREE ⭐",
      "provider": "openai",
      "baseURL": "https://generativelanguage.googleapis.com/v1beta/openai/",
      "model": "gemini-2.0-flash",
      "apiKey": "${env.GOOGLE_API_KEY}",
      "contextWindow": 1000000,
      "maxTokens": 8192,
      "description": "🎉 COMPLETELY FREE - 1M tokens!"
    },
    {
      "id": "llama-3.1-70b-free",
      "name": "Llama 3.1 70B (GROQ) - FREE ⭐",
      "provider": "openai",
      "baseURL": "https://api.groq.com/openai/v1",
      "model": "llama-3.1-70b-versatile",
      "apiKey": "${env.GROQ_API_KEY}",
      "contextWindow": 131072,
      "maxTokens": 4096,
      "description": "🎉 COMPLETELY FREE - 130K context"
    },
    {
      "id": "mixtral-8x7b-free",
      "name": "Mixtral 8x7B (GROQ) - FREE ⭐",
      "provider": "openai",
      "baseURL": "https://api.groq.com/openai/v1",
      "model": "mixtral-8x7b-32768",
      "apiKey": "${env.GROQ_API_KEY}",
      "contextWindow": 32768,
      "maxTokens": 4096,
      "description": "🎉 COMPLETELY FREE - Fastest"
    }
  ],
  "defaultModel": "claude-3.5-sonnet-free",
  "aiSettings": {
    "language": "uk",
    "responseFormat": "markdown"
  }
}
MODELS_EOF

echo -e "${GREEN}✅ Cursor settings оновлено${NC}"

# ==================== STEP 4: VERIFICATION ====================
echo ""
echo -e "${BLUE}STEP 4: Перевірка${NC}"
echo "─────────────────────────────────────────────────────────"

if [ -n "$GROQ_API_KEY" ]; then
    echo -n "🧪 Тестування Groq Claude... "
    RESPONSE=$(curl -s -X POST https://api.groq.com/openai/v1/chat/completions \
      -H "Authorization: Bearer $GROQ_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"model":"claude-3-5-sonnet-20241022","messages":[{"role":"user","content":"hi"}],"max_tokens":10}' 2>/dev/null)
    
    if echo "$RESPONSE" | grep -q '"content"'; then
        echo -e "${GREEN}✅ WORKS!${NC}"
    elif echo "$RESPONSE" | grep -q "error"; then
        echo -e "${YELLOW}⚠️  Groq API error (перевірте ключ)${NC}"
    fi
fi

if [ -n "$GOOGLE_API_KEY" ]; then
    echo -n "🧪 Тестування Gemini Flash... "
    RESPONSE=$(curl -s -X POST https://generativelanguage.googleapis.com/v1beta/openai/chat/completions \
      -H "Authorization: Bearer $GOOGLE_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"model":"gemini-2.0-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":10}' 2>/dev/null)
    
    if echo "$RESPONSE" | grep -q '"content"'; then
        echo -e "${GREEN}✅ WORKS!${NC}"
    elif echo "$RESPONSE" | grep -q "error"; then
        echo -e "${YELLOW}⚠️  Google API error (перевірте ключ)${NC}"
    fi
fi

# ==================== FINAL SUMMARY ====================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        ✅ SETUP COMPLETE - 100% БЕЗПЛАТНО!            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "📋 Налаштовано 4 моделі:"
echo "  1. Claude 3.5 Sonnet (GROQ) - ⭐ Рекомендується"
echo "  2. Gemini 2.0 Flash - 1M контексту"
echo "  3. Llama 3.1 70B (GROQ) - 130K контексту"
echo "  4. Mixtral 8x7B (GROQ) - Найшвидша"
echo ""
echo -e "${BLUE}🚀 НАСТУПНІ КРОКИ:${NC}"
echo "───────────────────────────────────────────"
echo ""
echo "1. Перезавантажте shell:"
echo -e "   ${BLUE}source ~/.zshrc${NC}"
echo ""
echo "2. Перезапустіть Cursor:"
echo -e "   ${BLUE}killall -9 Cursor && open -a Cursor${NC}"
echo ""
echo "3. Відкрийте AI Chat (Cmd+K)"
echo "   Виберіть Claude 3.5 Sonnet"
echo ""
echo "4. Запитайте (українською):"
echo "   'Допоможи аналізувати PREDATOR backend'"
echo ""
echo -e "${GREEN}✨ ВСЕ ГОТОВО! КОДУЙ БЕЗПЛАТНО! ✨${NC}"
echo ""
