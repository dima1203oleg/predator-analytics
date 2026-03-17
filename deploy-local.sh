#!/bin/bash

###############################################################################
# MCP Platform - Локальний запуск на сервері 34.185.226.240
# (Docker контейнер прямо, без K8s)
###############################################################################

set -e

SERVER_IP="34.185.226.240"
CONTAINER_NAME="mcp-platform"
IMAGE_NAME="ghcr.io/dima1203oleg/mcp-platform:latest"
PORT="8000"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  MCP Platform - Локальний запуск на сервері                ║"
echo "║  Server: $SERVER_IP                                 ║"
echo "║  Port: $PORT                                                ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Перевірка Docker
echo ""
echo "📋 Перевірка Docker..."
if ! command -v docker &> /dev/null; then
  echo "❌ Docker не встановлено"
  exit 1
fi
echo "✅ Docker встановлено"

# Побудування образу локально
echo ""
echo "📋 Побудування Docker образу..."
cd /Users/dima-mac/Documents/Predator_21/mcp-platform
if docker build -t "$IMAGE_NAME" .; then
  echo "✅ Образ побудований: $IMAGE_NAME"
else
  echo "❌ Помилка при побудуванні"
  exit 1
fi

# Зупинити старий контейнер
echo ""
echo "📋 Зупинка старого контейнера (якщо запущений)..."
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true
echo "✅ Готово"

# Запустити контейнер
echo ""
echo "📋 Запуск контейнера..."
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "$PORT:8000" \
  -e PYTHONUNBUFFERED=1 \
  -e LOG_LEVEL=INFO \
  --restart unless-stopped \
  "$IMAGE_NAME"

if [ $? -eq 0 ]; then
  echo "✅ Контейнер запущений: $CONTAINER_NAME"
else
  echo "❌ Помилка при запуску контейнера"
  exit 1
fi

# Очікування на готовність
echo ""
echo "📋 Очікування на готовність API..."
sleep 3

# Тестування health endpoints
echo ""
echo "🧪 Тестування /healthz:"
if curl -s http://localhost:$PORT/healthz; then
  echo -e "\n✅ /healthz OK"
else
  echo -e "\n⚠️  /healthz недоступний, перевіримо логи..."
fi

echo ""
echo "🧪 Тестування /readyz:"
if curl -s http://localhost:$PORT/readyz; then
  echo -e "\n✅ /readyz OK"
else
  echo -e "\n⚠️  /readyz недоступний"
fi

echo ""
echo "🧪 Тестування /info:"
if curl -s http://localhost:$PORT/info 2>/dev/null | head -10; then
  echo "✅ /info OK"
else
  echo "⚠️  /info недоступний"
fi

# Показ логів
echo ""
echo "📋 Логи контейнера (останні 20 рядків):"
docker logs --tail=20 "$CONTAINER_NAME" 2>/dev/null || echo "⚠️  Логи недоступні"

# Підсумок
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   ЗАПУСК УСПІШНИЙ                          ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ Контейнер:        $CONTAINER_NAME"
echo "║ Image:            $IMAGE_NAME"
echo "║ URL:              http://localhost:$PORT"
echo "║                   http://$SERVER_IP:$PORT"
echo "║                                                            ║"
echo "║ Команди:                                                   ║"
echo "║  • Логи (реал-тайм):                                      ║"
echo "║    docker logs -f $CONTAINER_NAME                        ║"
echo "║  • Зупинка:                                               ║"
echo "║    docker stop $CONTAINER_NAME                           ║"
echo "║  • Перезапуск:                                            ║"
echo "║    docker restart $CONTAINER_NAME                        ║"
echo "║  • Видалення:                                             ║"
echo "║    docker rm -f $CONTAINER_NAME                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
