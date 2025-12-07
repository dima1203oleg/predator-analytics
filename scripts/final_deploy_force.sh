#!/bin/bash
# FINAL FORCE DEPLOY SCRIPT

HOST="2.tcp.eu.ngrok.io"
PORT="19884"
USER="dima"
KEY="$HOME/.ssh/id_ed25519_ngrok"
DIR="predator_v21"

echo "🚀 Starting FORCE DEPLOY to $HOST:$PORT..."

# Sync
echo "📦 Syncing code..."
rsync -avz -e "ssh -i $KEY -p $PORT -o StrictHostKeyChecking=no" \
    --exclude 'node_modules' --exclude '.venv' --exclude 'venv' --exclude 'dist' --exclude '.git' \
    ./ "$USER@$HOST:$DIR/"

# Deploy
echo "🐳 Deploying Services..."
ssh -i $KEY -p $PORT -o StrictHostKeyChecking=no $USER@$HOST << "EOF"
    cd predator_v21
    
    # Ensure env file exists
    if [ ! -f .env ]; then
        echo "Creating .env..."
        cat > .env <<EON
DATABASE_URL=postgresql://predator:predator_password@postgres:5432/predator_db
REDIS_URL=redis://redis:6379/0
QDRANT_URL=http://qdrant:6333
OPENSEARCH_URL=http://opensearch:9200
MINIO_ENDPOINT=minio:9000
PRELOAD_MODELS=false
EON
    fi

    echo "Building..."
    docker-compose up -d --build --remove-orphans
EOF

echo "✅ Deployment Triggered Successfully!"
