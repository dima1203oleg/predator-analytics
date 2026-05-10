#!/bin/bash

# PREDATOR ELITE — PROJECT FACTORY RESET (CURSOR NUKE)
# Цей скрипт повністю знищує всі налаштування, кеші, розширення та історію Cursor.
# Після його виконання Cursor запуститься так, ніби ви його щойно завантажили з інтернету.

echo "🦅 PREDATOR: Починаю протокол повного скидання (Factory Reset)..."

# 1. Примусове закриття Cursor (від'єднуємося!)
echo "🛑 Зупиняю Cursor..."
pkill -9 -f "Cursor"
pkill -9 -f "Cursor Helper"
sleep 2

# 2. Знищення всіх конфігураційних файлів та кешів у macOS Library
echo "🧨 Видаляю всі налаштування та кеші з Library..."
rm -rf "$HOME/Library/Application Support/Cursor"
rm -rf "$HOME/Library/Caches/Cursor"
rm -rf "$HOME/Library/Preferences/com.todesktop.230313mzl4w4u92.plist"
rm -rf "$HOME/Library/Saved Application State/com.todesktop.230313mzl4w4u92.savedState"
rm -rf "$HOME/Library/Logs/Cursor"

# 3. Знищення прихованих папок розширень
echo "🧨 Видаляю розширення та глобальні профілі..."
rm -rf "$HOME/.cursor"
rm -rf "$HOME/.cursor-tutor"

# 4. Видалення з Quarantine (якщо є)
xattr -r -d com.apple.quarantine /Applications/Cursor.app 2>/dev/null

echo "✅ ГОТОВО! Cursor повністю повернуто до заводських налаштувань."
echo "🚀 Відкриваємо чистий Cursor..."

# Запуск чистого Cursor
open -a /Applications/Cursor.app
