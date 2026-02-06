#!/bin/bash
echo "🔍 Перевірка статусу системи..."

echo "========================================"
echo "🐳 Docker Containers:"
ssh -p 6666 dima@194.177.1.240 "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
echo "========================================"
echo "🏗️ Backend Build Logs (Last 10 lines):"
# This will show logs of the current build process if it's running via docker compose
ssh -p 6666 dima@194.177.1.240 "docker logs predator_backend --tail 20"
echo "========================================"
