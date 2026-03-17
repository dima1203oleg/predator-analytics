#!/bin/bash

###############################################################################
# MCP Platform - Перевірка статусу на сервері 34.185.226.240
###############################################################################

SERVER_IP="34.185.226.240"
SERVER_USER="ubuntu"  # змініть на користувача на сервері
PORT="8000"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  MCP Platform - Статус на сервері $SERVER_IP               ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Локальна перевірка
if [ "$1" == "local" ] || [ "$1" == "localhost" ]; then
  echo ""
  echo "📋 Контейнер локально:"
  docker ps -a --filter name=mcp-platform
  
  echo ""
  echo "📋 Логи локально:"
  docker logs --tail=20 mcp-platform 2>/dev/null || echo "Контейнер не запущений"
  exit 0
fi

#远程перевірка через SSH
echo ""
echo "📋 Контейнер на сервері:"
ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" \
  "docker ps -a --filter name=mcp-platform 2>/dev/null || echo 'Docker недоступний'"

echo ""
echo "📋 Логи на сервері:"
ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" \
  "docker logs --tail=20 mcp-platform 2>/dev/null || echo 'Контейнер не запущений'"

echo ""
echo "📋 API Endpoints:"
echo "🧪 /healthz:"
curl -s "http://$SERVER_IP:$PORT/healthz" 2>/dev/null || echo "❌ Недоступно"

echo ""
echo "🧪 /readyz:"
curl -s "http://$SERVER_IP:$PORT/readyz" 2>/dev/null || echo "❌ Недоступно"

echo ""
echo "🧪 /info:"
curl -s "http://$SERVER_IP:$PORT/info" 2>/dev/null | head -5 || echo "❌ Недоступно"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    КОМАНДИ УПРАВЛІННЯ                      ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ Логи:                                                      ║"
echo "║  ssh $SERVER_USER@$SERVER_IP docker logs -f mcp-platform   ║"
echo "║                                                            ║"
echo "║ Перезапуск:                                               ║"
echo "║  ssh $SERVER_USER@$SERVER_IP docker restart mcp-platform   ║"
echo "║                                                            ║"
echo "║ Зупинка:                                                  ║"
echo "║  ssh $SERVER_USER@$SERVER_IP docker stop mcp-platform      ║"
echo "║                                                            ║"
echo "║ Видалення:                                                ║"
echo "║  ssh $SERVER_USER@$SERVER_IP docker rm -f mcp-platform     ║"
echo "║                                                            ║"
echo "║ Тест API локально:                                        ║"
echo "║  curl http://localhost:$PORT/healthz                       ║"
echo "║  curl http://$SERVER_IP:$PORT/healthz                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
