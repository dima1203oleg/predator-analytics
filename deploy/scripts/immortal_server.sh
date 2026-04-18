#!/bin/bash
while true; do
  PID=$(pgrep -f "uvicorn app.main:app")
  if [ -z "$PID" ]; then
    echo "🚨 СЕРВЕР ПАВ! Воскрешаю..."
    # Тут команда запуску вашого сервера
    # /usr/bin/python3 -m uvicorn app.main:app --port 8000 &
  else
    echo "✅ Сервер працює (PID: $PID)"
  fi
  sleep 2
done
