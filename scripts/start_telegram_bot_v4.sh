#!/bin/bash

# 🚀 Predator Analytics - Telegram Bot V4.0 Launcher
# Скрипт для запуску розширеного бота з AI

set -e

echo "🚀 Starting Telegram Bot V4.0..."

# Перевірка директорії
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

# Перевірка .env файлу
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "📝 Creating .env from template..."

    cat > .env << EOF
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_ADMIN_ID=1020504147

# Redis Configuration
REDIS_URL=redis://localhost:6379/1

# AI API Keys (optional)
GEMINI_API_KEY=
GROQ_API_KEY=

# System Configuration
LOG_LEVEL=INFO
EOF

    echo "✅ .env file created. Please edit it with your tokens!"
    exit 1
fi

# Перевірка віртуального середовища
if [ ! -d "backend/orchestrator/venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv backend/orchestrator/venv
fi

# Активація venv
source backend/orchestrator/venv/bin/activate

# Встановлення залежностей
echo "📦 Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r backend/orchestrator/requirements_telegram_v4.txt

# Перевірка Redis
echo "🔍 Checking Redis..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "⚠️  Redis is not running. Starting Redis..."

    # Спроба запустити Redis
    if command -v redis-server > /dev/null 2>&1; then
        redis-server --daemonize yes
        sleep 2
        echo "✅ Redis started"
    else
        echo "❌ Redis not installed. Installing via Homebrew..."
        if command -v brew > /dev/null 2>&1; then
            brew install redis
            brew services start redis
            echo "✅ Redis installed and started"
        else
            echo "⚠️  Please install Redis manually or the bot will use memory storage"
        fi
    fi
else
    echo "✅ Redis is running"
fi

# Запуск бота
echo "🤖 Starting bot..."
python backend/orchestrator/agents/telegram_bot_v4_advanced.py

# Деактивація venv при виході
deactivate
