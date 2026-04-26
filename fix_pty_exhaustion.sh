#!/bin/bash
# Скрипт для вивільнення PTY ресурсів на macOS
# Викликати: bash fix_pty_exhaustion.sh

echo "🔍 Пошук процесів, що блокують PTY..."

# Безпечно завершуємо залишки сесій (tmux, screen, ssh)
killall tmux 2>/dev/null || echo "tmux не знайдено"
killall screen 2>/dev/null || echo "screen не знайдено"
killall ssh-askpass 2>/dev/null || echo "ssh-askpass не знайдено"

# Показуємо поточний стан PTY
echo "📊 Стан PTY:"
sysctl kern.tty.ptmx_max
echo "✅ Очищення завершено. Будь ласка, перезапустіть сервер агента, якщо проблема з PTY залишається."
