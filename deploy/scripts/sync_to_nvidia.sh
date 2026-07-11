#!/bin/bash
# 🦅 Sovereign Sync Script | v61.0-ELITE
# Автоматична синхронізація коду з MacBook на NVIDIA Compute Node

REMOTE_IP="194.177.1.240"
REMOTE_USER="dima"
REMOTE_PATH="~/Predator_60"
EXCLUDE_LIST=(
  ".git"
  "node_modules"
  ".venv"
  "__pycache__"
  ".next"
  "dist"
  "build"
  ".gemini"
)

echo "🔄 Запуск синхронізації PREDATOR ➔ NVIDIA ($REMOTE_IP)..."

# Побудова списку виключень
EXCLUDE_ARGS=""
for item in "${EXCLUDE_LIST[@]}"; do
  EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude=$item"
done

# Виконання rsync
rsync -avz -e "ssh -o ConnectTimeout=5" $EXCLUDE_ARGS ./ nvidia-server:$REMOTE_PATH

if [ $? -eq 0 ]; then
  echo "✅ Синхронізація успішна. Перезапуск сервісів на NVIDIA..."
  ssh nvidia-server "cd $REMOTE_PATH && bash deploy/scripts/deploy_nvidia_backend.sh"
else
  echo "❌ Помилка синхронізації. Перевірте з'єднання з NVIDIA."
fi
