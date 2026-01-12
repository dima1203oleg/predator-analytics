#!/bin/bash
# Deploy Trinity Bot to the NVIDIA Server (Optimized for Shared Libs)

SERVER="dima@194.177.1.240"
PORT="6666"
REMOTE_ROOT="/home/dima/predator-analytics"

echo "📂 Створення необхідних директорій на сервері..."
ssh -p $PORT $SERVER "mkdir -p $REMOTE_ROOT/apps/trinity_bot $REMOTE_ROOT/libs $REMOTE_ROOT/k8s/bot"

echo "🚀 Синхронізація спільних бібліотек та коду бота..."
# Syncing libs and trinity_bot
rsync -avz -e "ssh -p $PORT" --exclude 'node_modules' --exclude '__pycache__' libs/ $SERVER:$REMOTE_ROOT/libs/
rsync -avz -e "ssh -p $PORT" --exclude '__pycache__' apps/trinity_bot/ $SERVER:$REMOTE_ROOT/apps/trinity_bot/

echo "🚀 Синхронізація маніфестів K8s..."
scp -P $PORT -r k8s/bot/deployment.yaml $SERVER:$REMOTE_ROOT/k8s/bot/

echo "🔑 Підготовка секретів на сервері..."
ssh -p $PORT $SERVER "cd $REMOTE_ROOT && set -a && [ -f .env ] && source .env && set +a && \
    cat <<EOF > k8s/bot/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: bot-env-vars
  namespace: predator-nvidia
type: Opaque
stringData:
  TELEGRAM_TOKEN: \"\$TELEGRAM_BOT_TOKEN\"
  GEMINI_API_KEY: \"\$GEMINI_API_KEY\"
  MISTRAL_API_KEY: \"\$MISTRAL_API_KEY\"
  GITHUB_TOKEN: \"\$GITHUB_TOKEN\"
  RABBITMQ_USER: \"predator\"
  RABBITMQ_PASS: \"predator_secret_key\"
EOF"

echo "🏗️ Збірка Docker образу на сервері (Build from Root)..."
ssh -p $PORT $SERVER "cd $REMOTE_ROOT && docker build -f apps/trinity_bot/Dockerfile -t predator-analytics/bot:v25.0 ."

echo "📦 Імпорт образу в K3s..."
ssh -p $PORT $SERVER "docker save predator-analytics/bot:v25.0 | sudo k3s ctr images import -"

echo "📦 Застосування маніфестів Kubernetes..."
ssh -p $PORT $SERVER "cd $REMOTE_ROOT && sudo k3s kubectl apply -f k8s/bot/ && \
    sudo k3s kubectl rollout restart deployment predator-bot -n predator-nvidia"

echo "✅ Trinity Bot оновлено та розгорнуто!"
