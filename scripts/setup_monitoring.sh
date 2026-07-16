#!/bin/bash

# 🦅 PREDATOR Analytics v66.0-ELITE — Налаштування автоматичного моніторингу
# Скрипт для встановлення cron job для автоматичного моніторингу баз даних

echo "🦅 PREDATOR ANALYTICS v66.0-ELITE — НАЛАШТУВАННЯ АВТОМАТИЧНОГО МОНІТОРИНГУ"
echo "============================================================================"

# Перевірка наявності скрипту моніторингу
if [ ! -f "scripts/check_databases.sh" ]; then
    echo "❌ Скрипт моніторингу не знайдено: scripts/check_databases.sh"
    exit 1
fi

echo "✅ Скрипт моніторингу знайдено"

# Перевірка наявності nc (netcat)
if ! command -v nc &> /dev/null; then
    echo "⚠️  nc (netcat) не встановлено. Встановлення..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install netcat
    else
        sudo apt-get install netcat
    fi
fi

# Перевірка наявності curl
if ! command -v curl &> /dev/null; then
    echo "⚠️  curl не встановлено. Встановлення..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install curl
    else
        sudo apt-get install curl
    fi
fi

# Визначення шляху до проекту
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHECK_SCRIPT="$PROJECT_DIR/scripts/check_databases.sh"
LOG_FILE="$PROJECT_DIR/logs/monitoring.log"

# Створення директорії для логів
mkdir -p "$PROJECT_DIR/logs"

echo "📁 Директорія проекту: $PROJECT_DIR"
echo "📝 Скрипт моніторингу: $CHECK_SCRIPT"
echo "📋 Файл логів: $LOG_FILE"

# Налаштування cron job (кожні 5 хвилин)
CRON_JOB="*/5 * * * * $CHECK_SCRIPT >> $LOG_FILE 2>&1"

echo ""
echo "🔧 Налаштування cron job (кожні 5 хвилин):"
echo "$CRON_JOB"

# Перевірка наявності cron job
if crontab -l 2>/dev/null | grep -q "check_databases.sh"; then
    echo "⚠️  Cron job вже існує. Оновлення..."
    # Видалення старого cron job
    crontab -l 2>/dev/null | grep -v "check_databases.sh" | crontab -
fi

# Додавання нового cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Cron job налаштовано успішно"

# Виведення поточного crontab
echo ""
echo "📋 Поточний crontab:"
crontab -l

# Запуск першої перевірки
echo ""
echo "🔍 Запуск першої перевірки..."
$CHECK_SCRIPT

echo ""
echo "============================================================================"
echo "✅ Автоматичний моніторинг налаштовано!"
echo ""
echo "📋 Додаткові опції:"
echo "   - Перегляд логів: tail -f $LOG_FILE"
echo "   - Ручна перевірка: $CHECK_SCRIPT"
echo "   - Перегляд cron: crontab -l"
echo "   - Видалення cron: crontab -e"
echo "============================================================================"