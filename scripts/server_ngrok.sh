#!/bin/bash
# Server-side ngrok supervisor script

# Перевіряємо, чи запущено ngrok
if pgrep ngrok > /dev/null; then
    echo "✅ Ngrok вже запущено."
    curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*'
else
    echo "🚀 Запуск ngrok для порту 8080..."
    nohup ngrok http 8080 > /home/dima/ngrok_v25.log 2>&1 &
    sleep 3
    curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*'
fi
