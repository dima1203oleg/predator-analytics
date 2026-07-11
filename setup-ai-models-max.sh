#!/bin/bash

# ══════════════════════════════════════════════════════════════════
# PREDATOR AI Models — Setup & Maximize Configuration
# Встановлює максимум моделей: Z.ai + Gemini + GROQ + Ollama
# ══════════════════════════════════════════════════════════════════

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🤖 PREDATOR AI Models — Максимум конфігурація${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 1. Завантажити AI Models Environment
echo ""
echo -e "${BLUE}Step 1: Завантажити AI Models Environment${NC}"
SHELL_RC="$HOME/.zshrc"

if ! grep -q ".env.ai-models" "$SHELL_RC"; then
    echo "Додаючи .env.ai-models до $SHELL_RC..."
    echo "" >> "$SHELL_RC"
    echo "# PREDATOR AI Models (Source on demand)" >> "$SHELL_RC"
    echo "alias load-ai-models='source /Users/Shared/Predator_60/.env.ai-models'" >> "$SHELL_RC"
    echo "source /Users/Shared/Predator_60/.env.ai-models 2>/dev/null || true" >> "$SHELL_RC"
    echo -e "${GREEN}✅ Додано${NC}"
else
    echo -e "${YELLOW}⚠️  Вже в конфігу${NC}"
fi

# 2. Запитати про API ключі
echo ""
echo -e "${BLUE}Step 2: Налаштування API Ключів${NC}"
echo ""

# Gemini
echo -e "${YELLOW}🔵 Gemini API Key${NC}"
echo "   Отримати на: https://aistudio.google.com/app/apikey"
echo "   Free Tier: 2M requests/день, 60 req/хв"
echo "   Поточне значення: ${GOOGLE_API_KEY:-❌ НЕ ВСТАНОВЛЕНО}"
read -p "   Введіть Gemini API Key (або Enter щоб пропустити): " GOOGLE_API_KEY_INPUT

if [ -n "$GOOGLE_API_KEY_INPUT" ]; then
    echo "export GOOGLE_API_KEY=\"$GOOGLE_API_KEY_INPUT\"" >> "$SHELL_RC"
    export GOOGLE_API_KEY="$GOOGLE_API_KEY_INPUT"
    echo -e "${GREEN}✅ Gemini ключ встановлений${NC}"
fi

# GROQ
echo ""
echo -e "${YELLOW}🟢 GROQ API Key (ВІЛЬНІ моделі: Mixtral, Llama, Claude)${NC}"
echo "   Отримати на: https://console.groq.com/"
echo "   Free Tier: Безлімітні запити! 🎉"
echo "   Поточне значення: ${GROQ_API_KEY:-❌ НЕ ВСТАНОВЛЕНО}"
read -p "   Введіть GROQ API Key (або Enter щоб пропустити): " GROQ_API_KEY_INPUT

if [ -n "$GROQ_API_KEY_INPUT" ]; then
    echo "export GROQ_API_KEY=\"$GROQ_API_KEY_INPUT\"" >> "$SHELL_RC"
    export GROQ_API_KEY="$GROQ_API_KEY_INPUT"
    echo -e "${GREEN}✅ GROQ ключ встановлений${NC}"
fi

# 3. Скопіювати Cursor Config
echo ""
echo -e "${BLUE}Step 3: Налаштування Cursor${NC}"

CURSOR_SETTINGS="$HOME/.cursor/settings.json"
mkdir -p "$HOME/.cursor"

if [ -f "$CURSOR_SETTINGS" ]; then
    cp "$CURSOR_SETTINGS" "${CURSOR_SETTINGS}.backup"
    echo -e "${YELLOW}📦 Резервна копія: ${CURSOR_SETTINGS}.backup${NC}"
fi

cp /Users/Shared/Predator_60/.cursor/settings-max-models.json "$CURSOR_SETTINGS"
echo -e "${GREEN}✅ Cursor конфіг оновлений (все 9 моделей)${NC}"

# 4. Завантажити конфіг
echo ""
echo -e "${BLUE}Step 4: Активація конфігу${NC}"
source "$SHELL_RC"
echo -e "${GREEN}✅ Конфіг завантажений у поточну сесію${NC}"

# 5. Перевірка
echo ""
echo -e "${BLUE}Step 5: Перевірка статусу${NC}"
echo ""
echo "📋 Встановлені ключі:"
[ -n "$ZAI_API_KEY" ] && echo "   ✅ Z.ai API Key: $(echo $ZAI_API_KEY | cut -c1-10)..." || echo "   ❌ Z.ai API Key"
[ -n "$GOOGLE_API_KEY" ] && [ "$GOOGLE_API_KEY" != "YOUR_GEMINI_API_KEY_HERE" ] && echo "   ✅ Google Gemini: $(echo $GOOGLE_API_KEY | cut -c1-10)..." || echo "   ❌ Google Gemini"
[ -n "$GROQ_API_KEY" ] && [ "$GROQ_API_KEY" != "YOUR_GROQ_API_KEY_HERE" ] && echo "   ✅ GROQ: $(echo $GROQ_API_KEY | cut -c1-10)..." || echo "   ❌ GROQ"
echo ""

# Summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ SETUP완료!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "🚀 Доступні моделі:"
echo "   📡 Z.ai: glm-5.1, glm-5, glm-4.7"
echo "   🔵 Google: Gemini 2.0 Flash (1M ctx), Thinking, Pro"
echo "   🟢 GROQ (FREE): Mixtral, Llama 3.1, Claude 3.5"
echo "   🟡 Ollama: llama3.2, qwen2.5 (локально на NVIDIA)"
echo ""

echo "⚙️  Наступні кроки:"
echo "   1. Перезавантажити Cursor:"
echo "      ${BLUE}killall -9 Cursor && open -a Cursor${NC}"
echo ""
echo "   2. Відкрити Chat (Cmd+K)"
echo "      Вибрати модель із dropdown"
echo ""
echo "   3. Або завантажити конфіг вручну:"
echo "      ${BLUE}source ~/.zshrc${NC}"
echo ""

echo "📚 Документація:"
echo "   • GLM: /Users/Shared/Predator_60/README_CURSOR_GLM.md"
echo "   • Весь конфіг: /Users/Shared/Predator_60/.env.ai-models"
echo "   • Cursor config: ~/.cursor/settings.json"
echo ""

echo -e "${YELLOW}💡 Tips:${NC}"
echo "   • GLM-5.1: для складних задач (128K context)"
echo "   • Gemini 2.0: найшвидша з великим контекстом (1M)"
echo "   • GROQ моделі: БЕЗПЛАТНІ без лімітів!"
echo "   • Для локального Ollama: не потрібні ключі"
echo ""
