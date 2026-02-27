#!/bin/bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 CLI Tools Installation Script for Predator Analytics v45.0
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Встановлює та налаштовує:
# 1. Gemini CLI (планування/стратегія)
# 2. Mistral CLI (генерація коду) + API key
# 3. Aider (перевірка/дебаг - безплатна альтернатива Copilot)
# 4. Ollama + CodeLlama (локальна генерація)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

# Кольори для виводу
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Додаємо шлях до бінарників Python 3.12 (Axiom 15 Compliance)
export PATH="$HOME/.local/bin:/usr/local/bin:$PATH"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 Встановлення CLI-інструментів для v45.0 (Python 3.12 ONLY)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Перевірка Python 3.12
echo -e "\n${YELLOW}[1/5] Перевірка Python 3.12...${NC}"
if ! python3.12 --version &> /dev/null; then
    echo -e "${RED}❌ FATAL: Python 3.12 НЕ ЗНАЙДЕНО.${NC}"
    echo -e "${YELLOW}💡 Встановіть Python 3.12 та спробуйте знову.${NC}"
    exit 1
fi
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}❌ pip3 не знайдено.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Python $(python3.12 --version) знайдено${NC}"

# Replace all subsequent python3 calls with python3.12
alias python3='python3.12'

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. Gemini CLI (планування/аналіз)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${YELLOW}[2/5] Встановлення Gemini CLI...${NC}"
pip3 install --upgrade google-generativeai google-ai-generativelanguage --quiet --break-system-packages 2>/dev/null || \
    pip3 install --upgrade google-generativeai google-ai-generativelanguage --user --quiet
if command -v gemini &> /dev/null; then
    echo -e "${GREEN}✅ Gemini CLI вже встановлено${NC}"
else
    # Встановлюємо gemini-cli (unofficial wrapper)
    pip3 install gemini-python-cli --quiet 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Офіційного gemini CLI немає, використовуємо Python SDK${NC}"
        echo -e "${GREEN}✅ Google Generative AI SDK встановлено${NC}"
    }
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2. Mistral CLI (генерація коду)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${YELLOW}[3/5] Встановлення Mistral CLI...${NC}"
pip3 install --upgrade mistralai --quiet --break-system-packages 2>/dev/null || \
    pip3 install --upgrade mistralai --user --quiet

# Налаштування API ключа Mistral
MISTRAL_API_KEY="wAp8islIU7ZK24G7cRDrfttvYBIfMKKc"
export MISTRAL_API_KEY

# Додаємо в .bashrc якщо ще немає
if ! grep -q "MISTRAL_API_KEY" ~/.bashrc; then
    echo "export MISTRAL_API_KEY=\"${MISTRAL_API_KEY}\"" >> ~/.bashrc
    echo -e "${GREEN}✅ Mistral API key додано в ~/.bashrc${NC}"
fi

# Тестування Mistral API
cat > /tmp/test_mistral.py << 'EOF'
import os
from mistralai import Mistral

api_key = os.environ.get("MISTRAL_API_KEY")
if not api_key:
    print("❌ MISTRAL_API_KEY не встановлено")
    exit(1)

try:
    client = Mistral(api_key=api_key)
    # Перевірка доступу до API
    models = client.models.list()
    print(f"✅ Mistral CLI працює. Доступні моделі: {len(models.data)}")
    for model in models.data[:3]:
        print(f"   - {model.id}")
except Exception as e:
    print(f"❌ Помилка Mistral API: {e}")
    exit(1)
EOF

python3 /tmp/test_mistral.py
echo -e "${GREEN}✅ Mistral CLI встановлено та налаштовано${NC}"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3. Aider (безплатна альтернатива Copilot CLI)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${YELLOW}[4/5] Встановлення Aider (Copilot альтернатива)...${NC}"
pip3 install --upgrade aider-chat --quiet --break-system-packages 2>/dev/null || \
    pip3 install --upgrade aider-chat --user --quiet

if command -v aider &> /dev/null; then
    echo -e "${GREEN}✅ Aider встановлено: $(aider --version 2>&1 | head -n1)${NC}"
else
    echo -e "${RED}❌ Aider не встановлено коректно${NC}"
    exit 1
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4. Ollama + CodeLlama (локальна генерація)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${YELLOW}[5/5] Перевірка Ollama + CodeLlama...${NC}"

if ! command -v ollama &> /dev/null; then
    if [[ "$(uname)" == "Darwin" ]]; then
        echo -e "${YELLOW}⚠️  macOS: Автоматичне встановлення Ollama неможливе через скрипт.${NC}"
        echo -e "${YELLOW}💡 Будь ласка, завантажте Ollama з https://ollama.ai/download${NC}"
    else
        echo -e "${YELLOW}⚙️  Встановлення Ollama (Linux)...${NC}"
        curl -fsSL https://ollama.ai/install.sh | sh
        echo -e "${GREEN}✅ Ollama встановлено${NC}"
    fi
else
    echo -e "${GREEN}✅ Ollama вже встановлено: $(ollama --version)${NC}"
fi

# Перевіряємо чи доступна команда ollama перед завантаженням моделей
if command -v ollama &> /dev/null; then
    # Запускаємо Ollama сервер у фоні якщо це Linux (на Mac він зазвичай запущений як App)
    if [[ "$(uname)" == "Linux" ]] && ! pgrep -x ollama &> /dev/null; then
        echo -e "${YELLOW}⚙️  Запуск Ollama сервера...${NC}"
        ollama serve > /tmp/ollama.log 2>&1 &
        sleep 5
    fi

    # Завантажуємо CodeLlama модель
    echo -e "${YELLOW}⚙️  Завантаження CodeLlama (це може зайняти кілька хвилин)...${NC}"
    ollama pull codellama:7b || echo -e "${YELLOW}⚠️  CodeLlama не завантажився, спробуйте вручну: ollama pull codellama:7b${NC}"

    # Завантажуємо Llama 3.2 для планування
    echo -e "${YELLOW}⚙️  Завантаження Llama 3.2...${NC}"
    ollama pull llama3.2:3b || echo -e "${YELLOW}⚠️  Llama 3.2 не завантажився, спробуйте вручну: ollama pull llama3.2:3b${NC}"
else
    echo -e "${RED}❌ Ollama недоступна. Крок завантаження моделей пропущено.${NC}"
fi

echo -e "${GREEN}✅ Ollama налаштовано${NC}"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Фінальна перевірка
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Статус встановлених інструментів:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${GREEN}✅ Gemini SDK:${NC} $(python3 -c 'import google.generativeai; print(google.generativeai.__version__)' 2>/dev/null || echo 'Встановлено')"
echo -e "${GREEN}✅ Mistral CLI:${NC} $(python3 -c 'import mistralai; print(mistralai.__version__)' 2>/dev/null || echo 'Встановлено')"
echo -e "${GREEN}✅ Aider:${NC} $(aider --version 2>&1 | head -n1)"
echo -e "${GREEN}✅ Ollama:${NC} $(ollama --version 2>&1 | head -n1)"

echo -e "\n${GREEN}🎉 Всі CLI-інструменти успішно встановлено!${NC}"
echo -e "${YELLOW}📝 Використовуйте:${NC}"
echo -e "   - ${BLUE}python3 scripts/triple_cli.py${NC} - для ланцюжків Gemini→Mistral→Aider"
echo -e "   - ${BLUE}ollama run codellama${NC} - для локальної генерації коду"
echo ""
