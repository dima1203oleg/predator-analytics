#!/bin/bash

###############################################################################
# MCP Platform - Деплой на сервер 34.185.226.240 через SSH
###############################################################################

set -e

SERVER_IP="34.185.226.240"
SERVER_USER="ubuntu"  # або "root" залежно від налаштування
SERVER_PORT="22"
REMOTE_DIR="/opt/mcp-platform"
IMAGE_NAME="ghcr.io/dima1203oleg/mcp-platform:latest"
CONTAINER_NAME="mcp-platform"
LOCAL_DIR="/Users/dima-mac/Documents/Predator_21/mcp-platform"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  MCP Platform - SSH Деплой на сервер                      ║"
echo "║  Server: $SERVER_IP                                 ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Перевірка SSH
echo ""
echo "📋 Перевірка SSH доступу..."
if ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "echo 'SSH OK'"; then
  echo "❌ SSH доступ відсутній"
  echo "   Спробуйте налаштувати SSH ключі:"
  echo "   ssh-copy-id -i ~/.ssh/id_rsa $SERVER_USER@$SERVER_IP"
  exit 1
fi
echo "✅ SSH доступ налаштований"

# Побудування образу локально
echo ""
echo "📋 Побудування Docker образу локально..."
cd "$LOCAL_DIR"
if docker build -t "$IMAGE_NAME" .; then
  echo "✅ Образ побудований локально"
else
  echo "❌ Помилка при побудуванні"
  exit 1
fi

# Копіювання Dockerfile на сервер
echo ""
echo "📋 Копіювання файлів на сервер..."
ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "mkdir -p $REMOTE_DIR"
scp -r -o StrictHostKeyChecking=no "$LOCAL_DIR/Dockerfile" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/"
scp -r -o StrictHostKeyChecking=no "$LOCAL_DIR/mcp" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/"
scp -r -o StrictHostKeyChecking=no "$LOCAL_DIR/requirements.txt" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/"
scp -r -o StrictHostKeyChecking=no "$LOCAL_DIR/README.md" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/"
echo "✅ Файли скопійовані"

# Запуск деплою на сервері
echo ""
echo "📋 Запуск Docker контейнера на сервері..."
ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'SSHCOMMANDS'
cd /opt/mcp-platform

# Перевірка Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker не встановлено на сервері"
  echo "   Встановіть: curl -fsSL https://get.docker.com | sh"
  exit 1
fi

# Побудування на сервері
echo "Побудування Docker образу на сервері..."
docker build -t mcp-platform:latest .

# Зупинка старого контейнера
echo "Зупинка старого контейнера..."
docker stop mcp-platform 2>/dev/null || true
docker rm mcp-platform 2>/dev/null || true

# Запуск контейнера
echo "Запуск контейнера..."
docker run -d \
  --name mcp-platform \
  -p 8000:8000 \
  -e PYTHONUNBUFFERED=1 \
  -e LOG_LEVEL=INFO \
  --restart unless-stopped \
  mcp-platform:latest

echo "✅ Контейнер запущений на сервері"
SSHCOMMANDS

if [ $? -eq 0 ]; then
  echo "✅ Деплой успішний"
else
  echo "❌ Помилка при деплою"
  exit 1
fi

# Тестування
echo ""
echo "📋 Тестування API..."
sleep 5

echo "🧪 GET /healthz:"
curl -s "http://$SERVER_IP:8000/healthz" || echo "⚠️  Недоступно"

echo ""
echo "🧪 GET /readyz:"
curl -s "http://$SERVER_IP:8000/readyz" || echo "⚠️  Недоступно"

echo ""
echo "🧪 GET /info:"
curl -s "http://$SERVER_IP:8000/info" | head -10 || echo "⚠️  Недоступно"

# Підсумок
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ДЕПЛОЙ ЗАВЕРШЕНО                          ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ Сервер:           $SERVER_IP"
echo "║ API URL:          http://$SERVER_IP:8000"
echo "║ Container:        mcp-platform"
echo "║                                                            ║"
echo "║ SSH Команди:                                              ║"
echo "║  • Логи:                                                  ║"
echo "║    ssh $SERVER_USER@$SERVER_IP docker logs -f mcp-platform ║"
echo "║  • Статус:                                                ║"
echo "║    ssh $SERVER_USER@$SERVER_IP docker ps                  ║"
echo "║  • Перезапуск:                                            ║"
echo "║    ssh $SERVER_USER@$SERVER_IP docker restart mcp-platform ║"
echo "╚════════════════════════════════════════════════════════════╝"
