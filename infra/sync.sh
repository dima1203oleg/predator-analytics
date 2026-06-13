#!/bin/bash

read -p "🔄 Оберіть сервер для синхронізації (1 - NVIDIA, 2 - NVIDIA, 3 - Обидва) [1]: " SYNC_TARGET
SYNC_TARGET=${SYNC_TARGET:-1}

PROJECT_DIR="/Users/Shared/Predator_60"
REMOTE_DIR="/home/dima/Predator_60" # Змінити на правильний бекенд-шлях

sync_nvidia() {
  echo "🚀 Синхронізація з NVIDIA (Primary)..."
  rsync -avz --exclude="node_modules" --exclude=".git" --exclude=".venv" $PROJECT_DIR/ nvidia-server:$REMOTE_DIR/
}

sync_nvidia() {
  echo "🖥 Синхронізація з NVIDIA (Fallback)..."
  rsync -avz --exclude="node_modules" --exclude=".git" --exclude=".venv" $PROJECT_DIR/ NVIDIA:$REMOTE_DIR/
}

case $SYNC_TARGET in
  1) sync_nvidia ;;
  2) sync_nvidia ;;
  3) sync_nvidia; sync_nvidia ;;
  *) echo "Невідомий вибір" ;;
esac

echo "✅ Синхронізація завершена!"
