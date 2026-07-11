#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🧹 Clean NVIDIA Server Cache
# ═══════════════════════════════════════════════════════════════

set -e

# Конфігурація
SERVER_IP="194.177.1.240"
SSH_PORT="6666"
SSH_USER="dima"
SSH_PASSWORD="Dima@1203"

# Очищення кешу системи та Docker
echo "🔄 Очищення кешу на NVIDIA Server..."
sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -p "$SSH_PORT" "$SSH_USER@$SERVER_IP" << 'EOF'
  echo "$SSH_PASSWORD" | sudo -S sync
  echo "$SSH_PASSWORD" | sudo -S sysctl -w vm.drop_caches=3
  echo "$SSH_PASSWORD" | sudo -S docker system prune -af
EOF

echo "✅ Кеш на NVIDIA Server очищено!"