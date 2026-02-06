#!/bin/bash
# Script to remove old Predator artifacts from server
# WARNING: This will delete old versions (v21, v22, etc.)

echo "🧹 Починаємо глибоку очистку сервера від старих версій..."

# 1. Видалення старих контейнерів
echo "🗑️ Видалення старих контейнерів..."
docker rm -f predator_frontend predator-nginx predator-frontend-old 2>/dev/null

# 2. Видалення старих директорій dist
echo "🗑️ Видалення застарілих папок dist..."
sudo rm -rf /home/dima/predator_v21
sudo rm -rf /home/dima/predator_v22
sudo rm -rf /home/dima/Predator_21 # Видаляємо дублікат з великої літери, якщо він не основний
sudo rm -rf /home/dima/predator-analytics/apps/frontend/dist

# 3. Очистка Docker логів (опціонально)
echo "🧹 Очистка Docker логів..."
sudo truncate -s 0 /var/lib/docker/containers/*/*-json.log 2>/dev/null

echo "✅ Очистка завершена. Залишено тільки актуальну робочу директорію."
