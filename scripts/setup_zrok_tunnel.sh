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
    echo "🔑 Будь ласка, введіть ваш zrok токен (з пошти після zrok invite):"
    read -r TOKEN
    zrok enable "$TOKEN"
fi

echo "🚀 Запуск тунелю для PREDATOR (порт 8000)..."
zrok share public http://localhost:8000 --headless
