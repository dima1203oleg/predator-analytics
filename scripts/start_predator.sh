#!/bin/bash
# Predator Analytics - Повний запуск системи з інтеграцією

echo "🚀 PREDATOR ANALYTICS - FULL SYSTEM STARTUP"
echo "============================================"
echo ""

# Перевірка змінних оточення
check_env() {
    if [ -z "${!1}" ]; then
        echo "⚠️  $1 не встановлено"
        return 1
    else
        echo "✅ $1: встановлено"
        return 0
    fi
}

echo "📋 Перевірка конфігурації..."
echo ""

ENV_OK=true

# Обов'язкові для Telegram Bot
if ! check_env TELEGRAM_BOT_TOKEN; then ENV_OK=false; fi
if ! check_env TELEGRAM_ADMIN_ID; then ENV_OK=false; fi

# Рекомендовані
check_env REDIS_URL || export REDIS_URL="redis://localhost:6379/1"
check_env GEMINI_API_KEY || echo "⚠️  GEMINI_API_KEY не встановлено - LLM функції обмежені"

echo ""

if [ "$ENV_OK" = false ]; then
    echo "❌ Критичні змінні відсутні!"
    echo ""
    echo "Встанови їх:"
    echo "  export TELEGRAM_BOT_TOKEN='твій_токен'"
    echo "  export TELEGRAM_ADMIN_ID='твій_id'"
    echo ""
    echo "Або запусти інтерактивне налаштування:"
    echo "  ./scripts/setup_telegram_bot.sh"
    echo ""
    exit 1
fi

echo "✅ Конфігурація OK"
echo ""

# Вибір режиму запуску
echo "🔧 Оберіть режим запуску:"
echo "  1) Тільки Telegram Bot (швидкий тест)"
echo "  2) Повна система (Orchestrator + Telegram Bot)"
echo "  3) Окремо Orchestrator"
echo ""
read -p "Ваш вибір [1-3]: " MODE

case $MODE in
    1)
        echo ""
        echo "🤖 Запуск Telegram Bot V2.0..."
        echo ""
        python3 backend/orchestrator/agents/telegram_bot_v2.py
        ;;

    2)
        echo ""
        echo "🚀 Запуск ПОВНОЇ СИСТЕМИ..."
        echo ""
        echo "📱 Telegram Bot буде запущений автоматично orchestrator"
        echo "⚡ Power Monitor буде активований"
        echo "🧠 LLM Council буде готовий"
        echo ""

        # Запускаємо orchestrator (він сам запустить все інше)
        cd /Users/dima-mac/Documents/Predator_21
        python3 backend/orchestrator/main.py
        ;;

    3)
        echo ""
        echo "🧠 Запуск тільки Orchestrator (без Telegram)..."
        echo ""
        cd /Users/dima-mac/Documents/Predator_21
        python3 backend/orchestrator/main.py
        ;;

    *)
        echo "❌ Невірний вибір!"
        exit 1
        ;;
esac
