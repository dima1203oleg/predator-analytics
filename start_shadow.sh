
#!/bin/bash

# Назва віртуального середовища
VENV_NAME=".shadow_env_fixed"

echo "💀 INITIALIZING SHADOW AGENT PROTOCOL..."

# 1. Перевірка наявності venv. Якщо немає - створюємо.
if [ ! -d "$VENV_NAME" ]; then
    echo "📦 Creating isolated environment ($VENV_NAME)..."
    # Sudo-fix for ensurepip issues
    if ! python3 -m venv "$VENV_NAME"; then
        echo "⚠️  Standard venv creation failed. Using fallback (without-pip)..."
        python3 -m venv --without-pip "$VENV_NAME"
        source "$VENV_NAME/bin/activate"
        echo "📥 Bootstrapping pip..."
        curl -sS https://bootstrap.pypa.io/get-pip.py -o get-pip.py
        python get-pip.py > /dev/null
        rm get-pip.py
    fi
fi

# 2. Активація середовища (це перемикає нас з системного Python на локальний)
source "$VENV_NAME/bin/activate" || exit 1

# 3. Тиха установка залежностей
echo "⬇️ Checking dependencies..."
pip install google-generativeai python-dotenv > /dev/null 2>&1

# 4. Перевірка API ключа
if [ -z "$GEMINI_API_KEY" ]; then
    # Fallback: Check .env file
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs)
    fi
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ ERROR: GEMINI_API_KEY is missing!"
    echo "Run with: GEMINI_API_KEY='your_key' ./start_shadow.sh"
    exit 1
fi

# 5. Запуск Тіньового Агента
echo "🚀 AGENT LAUNCHED via SSH/Terminal Wrapper."
python3 shadow_agent.py
