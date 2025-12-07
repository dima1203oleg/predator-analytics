#!/bin/bash
# CHUNKED DEPLOYMENT V1.0
# Designed for extremely unstable Ngrok connections

HOST="2.tcp.eu.ngrok.io"
PORT="19884"
USER="dima"
KEY="$HOME/.ssh/id_ed25519_ngrok"
REMOTE_DIR="predator_v21"
CHUNK_SIZE="500k" 

set -e

echo "📦 Packaging project..."
# Remove old artifacts
rm -f deploy.tar.gz deploy_part_*

# Create Tarball (excluding heavy/unnecessary files)
tar -czf deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='.venv' \
    --exclude='venv' \
    --exclude='.git' \
    --exclude='data' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='dist' \
    .

echo "🔪 Splitting Archive..."
split -b $CHUNK_SIZE deploy.tar.gz deploy_part_

PARTS=$(ls deploy_part_*)
TOTAL=$(echo "$PARTS" | wc -w)
CURRENT=1

echo "📡 Uploading $TOTAL chunks to $HOST:$PORT..."

# Prepare remote directory
echo "   Creating remote directory..."
ssh -q -i $KEY -p $PORT -o StrictHostKeyChecking=no $USER@$HOST "mkdir -p $REMOTE_DIR/chunks && rm -f $REMOTE_DIR/chunks/*" || true

for PART in $PARTS; do
    echo "   [ $CURRENT / $TOTAL ] Uploading $PART..."
    
    # Retry loop for each chunk
    RETRY=0
    MAX_RETRY=10
    SUCCESS=0
    
    while [ $RETRY -lt $MAX_RETRY ]; do
        if scp -i $KEY -P $PORT -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$PART" "$USER@$HOST:$REMOTE_DIR/chunks/$PART"; then
            SUCCESS=1
            break
        else
            echo "     ❌ Failed. Retrying ($((RETRY+1))/$MAX_RETRY)..."
            sleep 2
            RETRY=$((RETRY+1))
        fi
    done
    
    if [ $SUCCESS -eq 0 ]; then
        echo "💀 Failed to upload chunk $PART after $MAX_RETRY attempts. Aborting."
        exit 1
    fi
    
    CURRENT=$((CURRENT+1))
done

echo "🧩 Reassembling on Server..."
ssh -i $KEY -p $PORT -o StrictHostKeyChecking=no $USER@$HOST << EOF
    cd $REMOTE_DIR
    cat chunks/deploy_part_* > deploy.tar.gz
    tar -xzf deploy.tar.gz
    rm -rf chunks deploy.tar.gz
    
    # Create .env if missing
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
    
    echo "🐳 Launching Docker Compose..."
    # Async launch to avoid ssh timeout waiting for build
    nohup docker-compose up -d --build --remove-orphans > deploy.log 2>&1 &
    echo "Deployment Triggered!"
EOF

# Cleanup local
rm -f deploy.tar.gz deploy_part_*

echo "✅ SUCCESS! Deployment completed via Chunked Upload."
