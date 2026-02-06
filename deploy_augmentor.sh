#!/bin/bash
# Sync new files to server

SERVER_IP="194.177.1.240"
SSH_PORT="6666"

echo "🚀 Syncing Augmentor to server..."

# 1. Sync Augmentor Manager
scp -P $SSH_PORT -r apps/backend/src/mlops/augmentor.py dima@$SERVER_IP:~/predator-analytics/apps/backend/src/mlops/

# 2. Sync Augmentation Task
scp -P $SSH_PORT -r apps/backend/app/tasks/augmentation.py dima@$SERVER_IP:~/predator-analytics/apps/backend/app/tasks/

# 3. Update Celery App
scp -P $SSH_PORT -r apps/backend/app/core/celery_app.py dima@$SERVER_IP:~/predator-analytics/apps/backend/app/core/

echo "✅ Sync complete. Restarting worker..."

ssh -p $SSH_PORT dima@$SERVER_IP "cd ~/predator-analytics && docker compose restart backend celery_worker"
