#!/bin/bash
# PREDATOR Analytics v55.3 - Single Machine (SM) Deployment
# Run this from the root of the project

set -e

echo "🦅 PREDATOR Analytics v55.3 SM Edition - ініціалізація розгортання..."

# 1. Створення необхідних директорій
echo "[1/4] Створення директорій для томів..."
mkdir -p infra/prometheus
mkdir -p infra/loki
mkdir -p infra/grafana/provisioning/dashboards
mkdir -p infra/grafana/provisioning/datasources

chmod -R 777 infra/loki
chmod -R 777 infra/prometheus

# 2. Перевірка безпеки (Kyverno, Cilium equivalents for Compose)
# Оскільки це Docker Compose (SM), ми застосовуємо PSS та обмеження прямо в файлі.
# Image Scanning через Trivy (Phase 7 // SM-142)
echo "[2/4] Запуск перевірки контейнерів (Trivy)..."
if command -v trivy >/dev/null 2>&1; then
    trivy config docker-compose.yml
else
    echo "⚠️ Trivy не встановлено. Пропускаємо сканування."
fi

# 3. Запуск інфраструктури (Phase 1-8)
echo "[3/4] Підняття інфраструктури (Docker Compose + server profile)..."
docker-compose --profile server up -d

# 4. Перевірка статусу
echo "[4/4] Готово! Перевіряємо статус сервісів..."
docker-compose ps

echo "🚀 Усі служби запущені. PREDATOR Analytics працює!"
echo "➡️  UI: http://localhost"
echo "➡️  API Backend: http://localhost:8090"
echo "➡️  Grafana: http://localhost:3001 (admin/admin)"
echo "➡️  Keycloak: http://localhost:8080 (admin/admin)"
echo "➡️  Prometheus: http://localhost:9090"
