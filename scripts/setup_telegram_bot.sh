#!/bin/bash
# Інтерактивний setup для Telegram Bot

echo "🤖 Predator Telegram Bot - Налаштування"
echo "========================================"
echo ""

# Крок 1: Токен бота
echo "📱 КРОК 1: Отримай токен бота"
echo ""
echo "1. Відкрий Telegram і знайди @BotFather"
echo "2. Напиши команду: /newbot"
echo "3. Дай ім'я боту (наприклад: Predator Analytics Bot)"
echo "4. Дай username боту (наприклад: predator_analytics_bot)"
echo "5. BotFather дасть тобі токен"
echo ""
read -p "Введи токен бота (формат: 123456789:AAH...): " BOT_TOKEN
echo ""

if [ -z "$BOT_TOKEN" ]; then
    echo "❌ Токен не введено!"
    exit 1
fi

# Крок 2: Admin ID
echo "👤 КРОК 2: Отримай свій Telegram ID"
echo ""
echo "1. Відкрий Telegram і знайди @userinfobot"
echo "2. Напиши будь-що боту"
echo "3. Він покаже твій ID (число)"
echo ""
read -p "Введи свій Telegram ID: " ADMIN_ID
echo ""

if [ -z "$ADMIN_ID" ]; then
    echo "❌ ID не введено!"
    exit 1
fi

# Збереження в .env
echo "💾 Зберігаю налаштування..."
echo ""

cat > .env << EOF
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=${BOT_TOKEN}
TELEGRAM_ADMIN_ID=${ADMIN_ID}
REDIS_URL=redis://localhost:6379/1

# Optional: Channel ID for notifications
# TELEGRAM_CHANNEL_ID=@your_channel

# Google Cloud for Voice (optional)
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/google-key.json
EOF

echo "✅ Налаштування збережені в .env"
echo ""

# Експорт змінних
export TELEGRAM_BOT_TOKEN="$BOT_TOKEN"
export TELEGRAM_ADMIN_ID="$ADMIN_ID"
export REDIS_URL="redis://localhost:6379/1"

echo "🚀 Запускаю бота..."
echo ""
echo "Якщо все OK, побачиш: '✅ Bot is ONLINE!'"
echo "Потім іди в Telegram і напиши своєму боту: /start"
echo ""
echo "Щоб зупинити бота - натисни Ctrl+C"
echo ""
sleep 2

# Запуск
cd "$(dirname "$0")/.."
python3 backend/orchestrator/agents/telegram_bot_v2.py
