#!/bin/bash
# 🦅 PREDATOR Analytics — Ngrok Tunnel Setup (v61.0-ELITE)

echo "🌐 Налаштування Ngrok тунелю..."

# Перевірка наявності ngrok
if ! command -v ngrok &> /dev/null
then
    echo "📦 Встановлення ngrok..."
    curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
    sudo apt update && sudo apt install ngrok
fi

# Запит токена, якщо не встановлено
if ! ngrok config check &> /dev/null; then
    echo "🔑 Будь ласка, введіть ваш NGROK_AUTHTOKEN (з https://dashboard.ngrok.com):"
    read -r TOKEN
    ngrok config add-authtoken "$TOKEN"
fi

echo "🚀 Запуск тунелю для PREDATOR (порт 8000)..."
ngrok http 8000
