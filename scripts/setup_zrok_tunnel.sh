#!/bin/bash
# 🦅 PREDATOR Analytics — zrok Tunnel Setup (v61.0-ELITE)

echo "🌐 Налаштування zrok тунелю..."

# Перевірка наявності zrok
if ! command -v zrok &> /dev/null
then
    echo "📦 Встановлення zrok..."
    curl -sSLf https://get.openziti.io/install.bash | sudo bash -s zrok
fi

# Запит токена, якщо не активовано
if [ ! -d "$HOME/.zrok" ]; then
    TOKEN="1eeje4um7yvA" # Автоматично підставлено
    echo "🔑 Активація zrok з токеном $TOKEN..."
    zrok enable "$TOKEN"
fi

echo "🚀 Запуск тунелю для PREDATOR (порт 8000)..."
zrok share public http://localhost:8000 --headless
