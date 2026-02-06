#!/bin/bash
# Запускає ngrok в інтерактивному режимі.
# ЦЕЙ СКРИПТ БУДЕ ТРИМАТИ З'ЄДНАННЯ ВІДКРИТИМ. НЕ ЗАКРИВАЙТЕ ЙОГО, ПОКИ ПОТРІБЕН ДОСТУП.
echo "🚀 Launching Ngrok in FOREGROUND mode..."
echo "👉 Press Ctrl+C to stop."
ssh -t predator-server "pkill ngrok; ngrok http --domain=jolyn-bifid-eligibly.ngrok-free.dev 8080"
