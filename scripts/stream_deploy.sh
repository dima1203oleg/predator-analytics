#!/bin/bash
# STREAM DEPLOYMENT V1.0
# Best for high latency, low bandwidth connections (avoids multiple handshakes)

HOST="2.tcp.eu.ngrok.io"
PORT="19884"
USER="dima"
KEY="$HOME/.ssh/id_ed25519_ngrok"
REMOTE_DIR="predator_v21"

echo "📡 Starting Streaming Deployment to $HOST:$PORT..."

# 1. Prepare env content locally to inject it
ENV_CONTENT="DATABASE_URL=postgresql://predator:predator_password@postgres:5432/predator_db
REDIS_URL=redis://redis:6379/0
QDRANT_URL=http://qdrant:6333
OPENSEARCH_URL=http://opensearch:9200
MINIO_ENDPOINT=minio:9000
PRELOAD_MODELS=false"

# 2. Pipe Tar + Commands
# We create a tar stream of current directory and pipe it into SSH.
# On the remote side, we untar it on the fly and then run docker-compose.
tar -czf - \
    --exclude='node_modules' \
    --exclude='.venv' \
    --exclude='venv' \
    --exclude='.git' \
    --exclude='data' \
    --exclude='dist' \
    --exclude='deploy.tar.gz' \
    --exclude='deploy_part_*' \
    . | \
ssh -i $KEY -p $PORT -o StrictHostKeyChecking=no -o ServerAliveInterval=5 -o ConnectTimeout=15 $USER@$HOST \
"
echo '📥 Receiving Stream...'
mkdir -p $REMOTE_DIR
cd $REMOTE_DIR
tar xzf - 
echo '✅ Stream Unpacked.'

# Create .env if missing
if [ ! -f .env ]; then
    echo '$ENV_CONTENT' > .env
fi

echo '🐳 Building Containers...'
docker-compose up -d --build --remove-orphans
echo '✅ DEPLOY COMPLETE'
"
