#!/bin/bash
# 🦅 Sovereign Sync Script | v61.0-ELITE
# Автоматична синхронізація коду з MacBook на iMac Compute Node

REMOTE_IP="192.168.0.199"
REMOTE_USER="dima-mac"
REMOTE_PATH="/Users/dima-mac/Documents/Predator_21"
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

echo "🔄 Запуск синхронізації PREDATOR ➔ iMac ($REMOTE_IP)..."

# Побудова списку виключень
EXCLUDE_ARGS=""
for item in "${EXCLUDE_LIST[@]}"; do
  EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude=$item"
done

# Виконання rsync
rsync -avz -e "ssh -o ConnectTimeout=5" $EXCLUDE_ARGS ./ $REMOTE_USER@$REMOTE_IP:$REMOTE_PATH

if [ $? -eq 0 ]; then
  echo "✅ Синхронізація успішна. Перезапуск сервісів на iMac..."
  ssh $REMOTE_USER@$REMOTE_IP "cd $REMOTE_PATH && ./AUTO_DEPLOY_IMAC.sh --fast"
else
  echo "❌ Помилка синхронізації. Перевірте з'єднання з iMac."
fi
