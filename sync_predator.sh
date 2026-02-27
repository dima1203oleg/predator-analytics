#!/bin/bash
# PREDATOR V45 - Sync & Deploy Tool
# Usage: ./sync_predator.sh [frontend|backend|all]

SERVER_HOST="194.177.1.240"
SERVER_USER="dima"
SERVER_PORT="6666"
REMOTE_PATH="~/predator-analytics"

TARGET=${1:-all}

echo "🦅 PREDATOR V45 SYNC SYSTEM"
echo "Target: $TARGET"
echo "Server: $SERVER_HOST"

# Function to sync and rebuild frontend
sync_frontend() {
    echo "🎨 [Frontend] Syncing..."
    rsync -avz -e "ssh -p $SERVER_PORT" \
        --delete \
        --exclude 'node_modules' \
        --exclude 'dist' \
        --exclude '.git' \
        ./apps/predator-analytics-ui/ $SERVER_USER@$SERVER_HOST:$REMOTE_PATH/apps/predator-analytics-ui/

    echo "🏗️  [Frontend] Rebuilding on server..."
    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "cd $REMOTE_PATH && docker compose build frontend && docker compose up -d frontend"
    echo "✅ [Frontend] Deployment Complete"
}

# Function to sync and rebuild backend
sync_backend() {
    echo "⚙️ [Backend] Syncing..."
    # Sync Libs
    echo "📦 [Libs] Syncing..."
    rsync -avz -e "ssh -p $SERVER_PORT" \
        --delete \
        --exclude '__pycache__' \
        --exclude '*.pyc' \
        ./libs/ $SERVER_USER@$SERVER_HOST:$REMOTE_PATH/libs/

    # Sync Services
    echo "🔌 [Services] Syncing..."
    rsync -avz -e "ssh -p $SERVER_PORT" \
        --delete \
        --exclude '__pycache__' \
        --exclude '*.pyc' \
        --exclude 'venv' \
        ./services/ $SERVER_USER@$SERVER_HOST:$REMOTE_PATH/services/

    # Sync Dockerfile (Corrected version)
    scp -P $SERVER_PORT ./services/api-gateway/Dockerfile $SERVER_USER@$SERVER_HOST:$REMOTE_PATH/services/api-gateway/Dockerfile

    # Sync Docker Compose (Corrected version with entrypoint fix)
    # We should sync this too, but be careful not to overwrite server-specific changes if any.
    # Assuming user's local docker-compose.yml is NOT the prod one.
    # We downloaded 'temp_docker_compose.yml' from server, edited it, and uploaded back.
    # We should probably save it as local reference?
    # For now, we assume server has the correct docker-compose.yml

    echo "🏗️  [Backend] Rebuilding on server..."
    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "cd $REMOTE_PATH && docker compose build backend && docker compose up -d backend"
    echo "✅ [Backend] Deployment Complete"
}

case $TARGET in
    frontend)
        sync_frontend
        ;;
    backend)
        sync_backend
        ;;
    all)
        sync_backend
        sync_frontend
        ;;
    *)
        echo "Usage: ./sync_predator.sh [frontend|backend|all]"
        exit 1
        ;;
esac

echo "🚀 All tasks finished successfully."
