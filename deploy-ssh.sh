#!/bin/bash

###############################################################################
# MCP Platform - Деплой на сервер 34.185.226.240 через SSH (port 6666)
###############################################################################

set -e

SERVER_IP="34.185.226.240"
SERVER_USER="dima"
SERVER_PORT="6666"
SERVER_PASSWORD="Dima@1203"
REMOTE_DIR="/home/dima/mcp-platform"
IMAGE_NAME="ghcr.io/dima1203oleg/mcp-platform:latest"
CONTAINER_NAME="mcp-platform"
LOCAL_DIR="/Users/dima-mac/Documents/Predator_21/mcp-platform"
BACKEND_PORT="8090"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  MCP Platform - SSH Деплой на сервер                      ║"
echo "║  Server: $SERVER_IP:$SERVER_PORT                   ║"
echo "║  User: $SERVER_USER                               ║"
echo "║  Backend Port: $BACKEND_PORT                      ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Перевірка SSH
echo ""
echo "📋 Перевірка SSH доступу..."
if ! sshpass -p "$SERVER_PASSWORD" ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "echo 'SSH OK'" 2>/dev/null; then
  echo "❌ SSH доступ відсутній"
  echo "   Параметри:"
  echo "   - IP: $SERVER_IP"
  echo "   - PORT: $SERVER_PORT"
  echo "   - USER: $SERVER_USER"
  echo "   - PASSWORD: ****"
  exit 1
fi
echo "✅ SSH доступ налаштований на $SERVER_IP:$SERVER_PORT"
echo ""
echo "📋 Побудування Docker образу локально..."
cd "$LOCAL_DIR"
if docker build -t "$IMAGE_NAME" .; then
  echo "✅ Образ побудований локально"
else
  echo "❌ Помилка при побудуванні"
  exit 1
fi

# Копіювання файлів на сервер
echo ""
echo "📋 Копіювання файлів на сервер..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "mkdir -p $REMOTE_DIR" 2>/dev/null
echo "   - Копіюю Dockerfile..."
sshpass -p "$SERVER_PASSWORD" scp -r -o StrictHostKeyChecking=no -P "$SERVER_PORT" "$LOCAL_DIR/Dockerfile" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/" 2>/dev/null
echo "   - Копіюю mcp модулі..."
sshpass -p "$SERVER_PASSWORD" scp -r -o StrictHostKeyChecking=no -P "$SERVER_PORT" "$LOCAL_DIR/mcp" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/" 2>/dev/null
echo "   - Копіюю requirements.txt..."
sshpass -p "$SERVER_PASSWORD" scp -r -o StrictHostKeyChecking=no -P "$SERVER_PORT" "$LOCAL_DIR/requirements.txt" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/" 2>/dev/null
echo "✅ Файли скопійовані на сервер: $REMOTE_DIR"

# Побудування образу на сервері
echo ""
echo "📋 Побудування Docker образу на сервері..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "cd $REMOTE_DIR && docker build -t $IMAGE_NAME ." 2>/dev/null
echo "✅ Образ побудований на сервері"

# Зупинення старого контейнера (якщо запущений)
echo ""
echo "📋 Зупинення старого контейнера (якщо запущений)..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "docker stop $CONTAINER_NAME 2>/dev/null || true" 2>/dev/null
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "docker rm $CONTAINER_NAME 2>/dev/null || true" 2>/dev/null
echo "✅ Старий контейнер видалений"

# Запуск нового контейнера
echo ""
echo "📋 Запуск нового контейнера на порту $BACKEND_PORT..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" \
  "docker run -d --name $CONTAINER_NAME -p $BACKEND_PORT:8000 -e PYTHON_VERSION=3.12.13 $IMAGE_NAME" 2>/dev/null
echo "✅ Контейнер запущено"

# Очікування на запуск
echo ""
echo "⏳ Очікування запуску контейнера (5 сек)..."
sleep 5

# Тестування API
echo ""
echo "📋 Тестування API ендпоїнтів..."
for endpoint in healthz readyz info; do
  response=$(sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" \
    "curl -s http://localhost:$BACKEND_PORT/$endpoint 2>/dev/null || echo 'ERROR'" 2>/dev/null)
  if [[ "$response" != "ERROR" ]]; then
    echo "   ✅ GET /$endpoint → $response"
  else
    echo "   ⚠️  GET /$endpoint → Connection failed"
  fi
done

# Показ статусу контейнера
echo ""
echo "📋 Статус контейнера..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" \
  "docker ps --filter 'name=$CONTAINER_NAME' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" 2>/dev/null

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✅ ДЕПЛОЙ УСПІШНИЙ!                                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📌 Інформація про розгортання:"
echo "   Server: ssh -p $SERVER_PORT dima@34.185.226.240"
echo "   Backend URL: http://34.185.226.240:$BACKEND_PORT"
echo "   API Endpoints:"
echo "   - GET http://34.185.226.240:$BACKEND_PORT/healthz"
echo "   - GET http://34.185.226.240:$BACKEND_PORT/readyz"
echo "   - GET http://34.185.226.240:$BACKEND_PORT/info"
echo ""
echo "🔍 Перевірка логів:"
echo "   sshpass -p 'Dima@1203' ssh -p 6666 dima@34.185.226.240 'docker logs $CONTAINER_NAME'"
echo ""
