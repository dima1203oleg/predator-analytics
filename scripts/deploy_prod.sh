#!/bin/bash
# 🚀 PREDATOR v27.0 - Production Deployment Script
# Оптимізовано для серверів з NVIDIA GPU

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 PREDATOR ANALYTICS v27.0 - ПРОЦЕС РОЗГОРТАННЯ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Перевірка середовища
echo "🔍 Перевірка середовища..."
if ! command -v docker &> /dev/null; then
    echo "❌ Помилка: Docker не встановлено."
    exit 1
fi

# 2. Оновлення коду
echo "📥 Оновлення коду з репозиторію..."
git pull origin main || echo "⚠️ Попередження: Не вдалося виконати git pull (можливо, локальні зміни)"

# 3. Підготовка конфігурації
if [ ! -f .env ]; then
    echo "⚠️ Файл .env не знайдено! Створюю копію з .env.example..."
    cp .env.example .env || echo "❌ Помилка: .env.example не знайдено." && exit 1
fi

# 4. Збірка образів
echo "🏗️ Збірка Docker образів (v27.0)..."
docker compose -f docker-compose.prod.yml build

# 5. Резервне копіювання БД (якщо контейнер активний)
if [ "$(docker ps -q -f name=predator-postgres)" ]; then
    echo "💾 Створення резервної копії бази даних..."
    mkdir -p backups
    docker exec predator-postgres pg_dump -U predator predator_db > backups/db_backup_$(date +%Y%m%d_%H%M%S).sql
    echo "✅ Бектап збережено в папку backups/"
fi

# 6. Запуск системи
echo "🚢 Запуск сервісів Predator Analytics..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# 7. Верифікація
echo "⏱️ Очікування запуску API (15 сек)..."
sleep 15

echo "⚡ Перевірка статусу сервісів:"
docker compose -f docker-compose.prod.yml ps

echo "🔍 Перевірка Health Check API..."
if curl -s -f http://localhost:8000/health > /dev/null; then
    echo "✅ ПРЯМИЙ ДОСТУП ДО API: ПРАЦЮЄ"
else
    echo "⚠️ API ще не готове або доступ заблоковано (перевірте логи: docker logs predator-backend)"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 РОЗГОРТАННЯ ЗАВЕРШЕНО УСПІШНО! (UA-v27.0)"
echo "📡 Система Predator Analytics працює в автономному режимі."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
