#!/bin/bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🧪 Тестування CLI Tools Integration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Перевіряє встановлення та функціональність:
# 1. Gemini SDK (планування)
# 2. Mistral CLI (генерація коду)
# 3. Aider (перевірка коду - безплатна альтернатива Copilot)
# 4. Ollama + моделі (локальна генерація)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 Тестування CLI Tools v25.0${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Додаємо pipx та Python bin до PATH
export PATH="$PATH:/home/dima/.local/bin:$HOME/.local/bin:$HOME/Library/Python/3.9/bin"

TESTS_PASSED=0
TESTS_FAILED=0

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. Тест Gemini SDK
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${YELLOW}[1/4] Тест Gemini SDK...${NC}"
if python3 -c "import google.generativeai; print('✅ Gemini SDK:', google.generativeai.__version__)" 2>/dev/null; then
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Gemini SDK не працює${NC}"
    ((TESTS_FAILED++))
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2. Тест Mistral CLI
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${YELLOW}[2/4] Тест Mistral CLI...${NC}"
export MISTRAL_API_KEY="wAp8islIU7ZK24G7cRDrfttvYBIfMKKc"

python3 << 'PYEOF'
import os
from mistralai import Mistral

try:
    client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])
    models = client.models.list()
    print(f"✅ Mistral CLI: {len(models.data)} моделей доступно")
    print(f"   Топ модель: {models.data[0].id if models.data else 'N/A'}")
except Exception as e:
    print(f"❌ Mistral помилка: {e}")
    exit(1)
PYEOF

if [ $? -eq 0 ]; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3. Тест Aider (безплатна альтернатива GitHub Copilot)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${YELLOW}[3/4] Тест Aider...${NC}"
AIDER_BIN=$(which aider || echo "$HOME/Library/Python/3.9/bin/aider" || echo "$HOME/.local/bin/aider")
if [[ -f "$AIDER_BIN" ]] || command -v aider &> /dev/null; then
    VERSION=$($AIDER_BIN --version 2>&1 | head -n1 || aider --version 2>&1 | head -n1)
    echo -e "${GREEN}✅ Aider знайдено: $VERSION${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Aider не знайдено${NC}"
    ((TESTS_FAILED++))
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4. Тест Ollama
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${YELLOW}[4/4] Тест Ollama...${NC}"
if command -v ollama &> /dev/null; then
    VERSION=$(ollama --version 2>&1 | head -n1)
    echo -e "${GREEN}✅ Ollama: $VERSION${NC}"

    # Перевіряємо чи Ollama сервер запущений
    if pgrep -x "ollama" > /dev/null; then
        echo -e "${GREEN}   ✓ Ollama сервер запущений${NC}"
    else
        echo -e "${YELLOW}   ⚠ Ollama сервер не запущений, запускаємо...${NC}"
        ollama serve > /tmp/ollama.log 2>&1 &
        sleep 3
    fi

    # Перевіряємо доступні моделі
    MODELS=$(ollama list 2>/dev/null | tail -n +2 | wc -l)
    if [ $MODELS -gt 0 ]; then
        echo -e "${GREEN}   ✓ Встановлено моделей: $MODELS${NC}"
        ollama list | tail -n +2 | head -3 | while read line; do
            echo -e "${GREEN}     - $line${NC}"
        done
    else
        echo -e "${YELLOW}   ⚠ Моделі не завантажені${NC}"
        echo -e "${YELLOW}   Запустіть: ollama pull codellama:7b${NC}"
    fi

    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Ollama не встановлено${NC}"
    ((TESTS_FAILED++))
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Підсумок
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Результати тестів:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Пройдено: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Не пройдено: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 Всі CLI інструменти працюють!${NC}"
    echo -e "\n${YELLOW}📝 Наступні кроки:${NC}"
    echo -e "   1. Тестуйте Triple CLI Chain:"
    echo -e "      ${BLUE}python3 scripts/triple_cli.py \"Створи Hello World скрипт\"${NC}"
    echo -e ""
    echo -e "   2. Тестуйте ML CLI:"
    echo -e "      ${BLUE}python3 scripts/ml_cli.py train --task \"test\" --framework h2o${NC}"
    echo -e ""
    echo -e "   3. Завантажте Ollama моделі (якщо потрібно):"
    echo -e "      ${BLUE}ollama pull codellama:7b${NC}"
    echo -e "      ${BLUE}ollama pull llama3.2:3b${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Деякі інструменти потребують налаштування${NC}"
    exit 1
fi
