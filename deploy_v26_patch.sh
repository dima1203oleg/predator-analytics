#!/bin/bash
# deploy_v26_patch.sh

SERVER="dima@194.177.1.240"
PORT="6666"
REMOTE_PATH="~/predator-analytics"

echo "📦 Creating patch bundle..."

tar -czf v26_patch.tar.gz \
  services/api-gateway/app/main.py \
  services/api-gateway/app/routers/azr.py \
  services/api-gateway/app/routers/google_integrations.py \
  apps/predator-analytics-ui/src/components/index.ts \
  apps/predator-analytics-ui/src/components/TruthLedgerSection.tsx \
  apps/predator-analytics-ui/src/components/dimensional/shells/CommanderShell.tsx

echo "🚀 Uploading to server..."
scp -P $PORT v26_patch.tar.gz $SERVER:$REMOTE_PATH/

echo "🏗️ Applying patch on server..."
ssh -p $PORT $SERVER "cd $REMOTE_PATH && tar -xzf v26_patch.tar.gz && rm v26_patch.tar.gz"

echo "🔄 Restarting services..."
ssh -p $PORT $SERVER "cd $REMOTE_PATH && docker compose restart backend"
# Note: Frontend might need rebuild if source changed and it's not a dev mount
ssh -p $PORT $SERVER "cd $REMOTE_PATH && docker compose build frontend && docker compose up -d frontend"

echo "✅ Deployment finished!"
