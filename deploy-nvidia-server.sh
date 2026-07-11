#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🚀 PREDATOR Analytics v61.0-ELITE — Deploy to NVIDIA Server
# ═══════════════════════════════════════════════════════════════

set -e

# Підключення до VPN (якщо потрібно)
echo "🔌 Підключення до VPN..."
# vpn-connect-command  # Замініть на команду підключення до VPN

# Конфігурація
NVIDIA_SERVER="194.177.1.240"
PROJECT_DIR="/home/nvidia/Predator_60"
SSH_KEY="~/.ssh/id_rsa_nvidia"

# Копіювання файлів на сервер
echo "🔄 Копіювання файлів на NVIDIA Server..."
rsync -avz -e "ssh -i $SSH_KEY" \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.venv' \
  ./ nvidia@$NVIDIA_SERVER:$PROJECT_DIR

# Деплой на сервері
echo "🚀 Запуск деплою на NVIDIA Server..."
ssh -i $SSH_KEY nvidia@$NVIDIA_SERVER << 'EOF'
  cd /home/nvidia/Predator_60
  docker compose -f docker-compose.prod.yml down
  docker compose -f docker-compose.prod.yml build
  docker compose -f docker-compose.prod.yml up -d
  docker compose -f docker-compose.prod.yml ps
EOF

echo "✅ Деплой на NVIDIA Server завершено!"