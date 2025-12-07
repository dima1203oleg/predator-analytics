#!/bin/bash
# GITOPS DEPLOYMENT - PROD
# Bypasses local upload limits by using GitHub as the distribution channel.

HOST="2.tcp.eu.ngrok.io"
PORT="19884"
USER="dima"
KEY="$HOME/.ssh/id_ed25519_ngrok"
DIR="predator_v21"

set -e

# Get the full URL with token
REPO_URL=$(git remote get-url origin)

echo "🚀 Starting GitOps Deployment to $HOST:$PORT"

echo "📡 Sending Remote Instructions..."
ssh -q -i $KEY -p $PORT -o StrictHostKeyChecking=no -o ServerAliveInterval=10 $USER@$HOST << EOF
    echo "--- REMOTE SESSION START ---"
    mkdir -p $DIR
    cd $DIR
    
    echo "🔄 Configuring Git..."
    if [ ! -d .git ]; then
        git init
        git remote add origin "$REPO_URL"
    else
        git remote set-url origin "$REPO_URL"
    fi
    
    echo "📥 Fetching updates (GitHub)..."
    # Fetch specifically main to avoid fetching everything
    if git fetch origin main; then
         echo "   Git fetch success."
    else
         echo "❌ Git fetch failed. Check internet on server."
         exit 1
    fi
    
    echo "RESETTING to origin/main..."
    git reset --hard origin/main
    
    # .ENV Check
    if [ ! -f .env ]; then
        echo "Creating default .env..."
        cat > .env <<EON
DATABASE_URL=postgresql://predator:predator_password@postgres:5432/predator_db
REDIS_URL=redis://redis:6379/0
QDRANT_URL=http://qdrant:6333
OPENSEARCH_URL=http://opensearch:9200
MINIO_ENDPOINT=minio:9000
PRELOAD_MODELS=false
EON
    fi
    
    echo "🐳 Docker Compose Up..."
    # Detach process
    nohup docker-compose up -d --build --remove-orphans > deploy.log 2>&1 &
    
    echo "✅ DEPLOYMENT TRIGGERED."
    echo "--- SESSION END ---"
EOF
