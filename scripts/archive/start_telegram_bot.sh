#!/bin/bash
# Швидкий запуск Telegram Bot - TEST MODE

echo "🤖 Запуск Telegram Bot V2.0 (Test Mode)..."
echo ""

# Перевірка TELEGRAM_BOT_TOKEN
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN не встановлений!"
    echo ""
    echo "Щоб отримати токен:"
    echo "1. Відкрий Telegram → @BotFather"
    echo "2. Надішли: /newbot"
    echo "3. Дай ім'я боту"
    echo "4. Скопіюй токен"
    echo ""
    echo "Потім запусти:"
    echo "export TELEGRAM_BOT_TOKEN='your_token_here'"
    echo "export TELEGRAM_ADMIN_ID='your_telegram_id'"
    echo "./scripts/start_telegram_bot.sh"
    exit 1
fi

# Перевірка TELEGRAM_ADMIN_ID
if [ -z "$TELEGRAM_ADMIN_ID" ]; then
    echo "⚠️  TELEGRAM_ADMIN_ID не встановлений (використовую 0)"
    echo ""
    echo "Щоб отримати свій ID:"
    echo "1. Відкрий Telegram → @userinfobot"
    echo "2. Скопіюй свій ID"
    echo ""
    echo "Потім встанови:"
    echo "export TELEGRAM_ADMIN_ID='123456789'"
    echo ""
    export TELEGRAM_ADMIN_ID=0
fi

# Встановлення REDIS_URL якщо немає
if [ -z "$REDIS_URL" ]; then
    echo "ℹ️  REDIS_URL не встановлений (використовую localhost)"
    export REDIS_URL="redis://localhost:6379/1"
fi

echo "✅ Конфігурація:"
echo "   TOKEN: ${TELEGRAM_BOT_TOKEN:0:10}..."
echo "   ADMIN_ID: $TELEGRAM_ADMIN_ID"
echo "   REDIS: $REDIS_URL"
echo ""

# Перевірка залежностей
echo "🔍 Перевірка залежностей..."

# Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не знайдено!"
    exit 1
fi

echo "✅ Python3: $(python3 --version)"

# Aiogram
if ! python3 -c "import aiogram" 2>/dev/null; then
    echo "⚠️  aiogram не встановлено"
    echo "Встановлюю..."
    pip3 install -q aiogram aiohttp redis psutil
fi

echo "✅ Dependencies OK"
echo ""

# Запуск бота
echo "🚀 Запускаю Telegram Bot..."
echo "   (Натисни Ctrl+C щоб зупинити)"
echo ""

cd "$(dirname "$0")/.." || exit 1

# Запуск
python3 backend/orchestrator/agents/telegram_bot_production.py
