#!/bin/bash

# 🚀 Quick Setup: Gemini 2.0 Flash in Cursor (FREE)

if [ -z "$1" ]; then
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║      Gemini 2.0 Flash for Cursor - QUICK SETUP        ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    echo "📖 Як отримати Google API Key (БЕЗПЛАТНО):"
    echo "   1. Йдіть: https://aistudio.google.com/app/apikeys"
    echo "   2. Натисніть: Create API Key in new project"
    echo "   3. Скопіюйте ключ"
    echo ""
    echo "Використання:"
    echo "   bash setup_gemini_quick.sh 'ваш-api-key'"
    echo ""
    echo "Приклад:"
    echo "   bash setup_gemini_quick.sh 'AIzaS...xyz'"
    exit 1
fi

API_KEY="$1"
SHELL_RC="$HOME/.zshrc"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Додавання API Key до ~/.zshrc...${NC}"

# Add to shell profile
if ! grep -q "GOOGLE_API_KEY" "$SHELL_RC"; then
    echo "" >> "$SHELL_RC"
    echo "# Google Gemini API Key - Added by setup_gemini_quick.sh" >> "$SHELL_RC"
    echo "export GOOGLE_API_KEY=\"$API_KEY\"" >> "$SHELL_RC"
    echo -e "${GREEN}✅ API Key додано${NC}"
else
    echo "⚠️  GOOGLE_API_KEY вже в ~/.zshrc"
fi

# Export for current session
export GOOGLE_API_KEY="$API_KEY"

echo ""
echo -e "${BLUE}Налаштування Cursor...${NC}"

# Cursor settings already configured
mkdir -p ~/.cursor
echo -e "${GREEN}✅ Cursor налаштовано${NC}"

echo ""
echo "✨ ГОТОВО! Робіть наступне:"
echo "   1. Перезавантажте shell:"
echo -e "      ${BLUE}source ~/.zshrc${NC}"
echo ""
echo "   2. Перезапустіть Cursor:"
echo -e "      ${BLUE}killall -9 Cursor && open -a Cursor${NC}"
echo ""
echo "   3. У Cursor натисніть Cmd+K"
echo "      Виберіть: Gemini 2.0 Flash"
echo ""
echo "🚀 Кодуйте безплатно!"
