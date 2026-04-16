#!/bin/bash
# PREDATOR Analytics v56.5-ELITE - Single Machine (SM) Deployment
# Run this from the root of the project

set -e

echo "🦅 PREDATOR Analytics v56.5-ELITE SM Edition - ініціалізація розгортання..."

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

echo "🚀 Усі служби запущені. PREDATOR Analytics v56.5-ELITE працює!"
echo "➡️  UI (Sovereign Command): http://localhost:3030"
echo "➡️  API Backend (NVIDIA/ZROK): http://localhost:8000"
echo "➡️  Grafana (Monitoring): http://localhost:3001 (admin/admin)"
echo "➡️  Keycloak (Auth): http://localhost:8080 (admin/admin)"
echo "➡️  Prometheus (Metrics): http://localhost:9090"
echo "📡 ZROK Status: Active via Tunnel Node"
