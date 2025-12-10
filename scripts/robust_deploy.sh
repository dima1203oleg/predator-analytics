#!/bin/bash
# ROBUST DEPLOY with Retry Loop

HOST="2.tcp.eu.ngrok.io"
PORT="19884"
USER="dima"
KEY="$HOME/.ssh/id_ed25519_ngrok"
DIR="predator_v21" # USING "predator_v21" as discovered earlier
ARGOCD_NVIDIA_URL=${ARGOCD_NVIDIA_URL:-}
ARGOCD_NVIDIA_TOKEN=${ARGOCD_NVIDIA_TOKEN:-}
ARGOCD_URL=${ARGOCD_NVIDIA_URL:-${ARGOCD_SERVER:-}}
ARGOCD_TOKEN=${ARGOCD_NVIDIA_TOKEN:-${ARGOCD_TOKEN:-}}
if [[ "${ARGOCD_INSECURE:-false}" =~ ^(1|true|yes)$ ]]; then
    CURL_INSECURE="-k"
else
    CURL_INSECURE=""
fi

MAX_RETRIES=20 # Aggressive retry
COUNT=0

echo "🚀 Starting ROBUST DEPLOY to $HOST:$PORT..."

while [ $COUNT -lt $MAX_RETRIES ]; do
    echo "Attempt $((COUNT+1)) of $MAX_RETRIES..."
    
    # Sync Code
    # Added --timeout=60 and ServerAliveInterval to keep connection alive
    if rsync -avz --partial --inplace --timeout=60 -e "ssh -i $KEY -p $PORT -o StrictHostKeyChecking=no -o ServerAliveInterval=10 -o ConnectTimeout=10 -o BatchMode=yes" \
        --exclude 'node_modules' --exclude '.venv' --exclude 'venv' --exclude 'dist' --exclude '.git' \
        ./ "$USER@$HOST:$DIR/"; then
        
        echo "✅ Sync Successful!"
        
        # Trigger Deploy
        # Sending command and detaching immediately with nohup to prevent timeout waiting for build
        echo "🐳 Triggering Docker Compose (Async)..."
        if [[ -n "${ARGOCD_URL}" && -n "${ARGOCD_TOKEN}" ]]; then
            echo "🔁 ArgoCD config found. Triggering ArgoCD sync instead of docker-compose..."
            curl $CURL_INSECURE -sS -X POST "${ARGOCD_URL}/api/v1/applications/predator-nvidia/sync" \
                -H "Authorization: Bearer ${ARGOCD_TOKEN}" -H "Content-Type: application/json" -d '{}' || echo "ArgoCD sync failed or returned non-200"
        else
            ssh -i $KEY -p $PORT -o StrictHostKeyChecking=no -o BatchMode=yes $USER@$HOST "cd $DIR && nohup docker-compose up -d --build --remove-orphans > deploy.log 2>&1 &"
        fi
        
        echo "✅ DEPLOY COMMAND SENT! (Check server logs later)"
        exit 0
    else
        echo "❌ Sync Failed/Interrupted. Retrying in 5s..."
        sleep 5
    fi
    COUNT=$((COUNT+1))
done

echo "💀 High Failure Rate. Check Ngrok connection stability."
exit 1
