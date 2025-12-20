#!/bin/bash
# GITOPS DEPLOYMENT - PROD
# Deploys to server via Git pull

HOST="194.177.1.240"
PORT="6666"
USER="dima"
DIR="predator-analytics"

set -e

# Get the full URL with token
REPO_URL=$(git remote get-url origin)

echo "🚀 Starting GitOps Deployment to $HOST:$PORT"

echo "📡 Sending Remote Instructions..."
ssh -q -p $PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ServerAliveInterval=10 $USER@$HOST << EOF
    echo "--- REMOTE SESSION START ---"
    cd ~/$DIR || { echo "❌ Directory ~/$DIR not found"; exit 1; }

    echo "🔄 Git Pull..."
    git pull origin main || { echo "❌ Git pull failed"; exit 1; }

    echo "🐳 Docker Compose Restart..."
    docker compose restart predator_backend predator_orchestrator

    echo "✅ DEPLOYMENT COMPLETE."
    docker compose ps
    echo "--- SESSION END ---"
EOF
