#!/bin/bash
# Скрипт для встановлення та запуску Telegram бота

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLIST_NAME="com.predator.telegram-bot.plist"
PLIST_SOURCE="$SCRIPT_DIR/$PLIST_NAME"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║      🤖 Predator Telegram Bot Installer                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"

# Перевірка залежностей
echo ""
echo "📦 Перевірка залежностей..."

if ! python3 -c "import httpx" 2>/dev/null; then
    echo "⚠️  Встановлюю httpx..."
    pip3 install httpx --quiet
fi

echo "✅ Залежності встановлено"

# Вибір режиму
echo ""
echo "Виберіть режим:"
echo "  1) Запустити зараз (foreground)"
echo "  2) Запустити як сервіс (background, автозапуск)"
echo "  3) Зупинити сервіс"
echo "  4) Статус сервісу"
read -p "Вибір [1-4]: " choice

case $choice in
    1)
        echo ""
        echo "🚀 Запуск бота в foreground..."
        echo "   Ctrl+C для зупинки"
        echo ""
        python3 "$SCRIPT_DIR/telegram_bot.py"
        ;;
    2)
        echo ""
        echo "🔧 Налаштування сервісу..."
        
        # Копіюємо plist
        cp "$PLIST_SOURCE" "$PLIST_DEST"
        
        # Зупиняємо якщо вже запущено
        launchctl unload "$PLIST_DEST" 2>/dev/null || true
        
        # Запускаємо
        launchctl load "$PLIST_DEST"
        
        echo "✅ Сервіс запущено!"
        echo ""
        echo "📝 Логи: tail -f ~/Library/Logs/telegram-bot.log"
        echo "🛑 Зупинка: launchctl unload $PLIST_DEST"
        ;;
    3)
        echo ""
        if [ -f "$PLIST_DEST" ]; then
            launchctl unload "$PLIST_DEST" 2>/dev/null || true
            rm -f "$PLIST_DEST"
            echo "✅ Сервіс зупинено та видалено"
        else
            echo "⚠️  Сервіс не встановлено"
        fi
        ;;
    4)
        echo ""
        if launchctl list | grep -q "com.predator.telegram-bot"; then
            echo "✅ Сервіс запущено"
            echo ""
            echo "Останні логи:"
            tail -5 ~/Library/Logs/telegram-bot.log 2>/dev/null || echo "(немає логів)"
        else
            echo "❌ Сервіс не запущено"
        fi
        ;;
    *)
        echo "❌ Невірний вибір"
        exit 1
        ;;
esac
