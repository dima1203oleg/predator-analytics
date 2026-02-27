#!/bin/bash
set -e

# Configuration
SERVER="dima@194.177.1.240"
PORT="6666"
REMOTE_DIR="~/predator-analytics"
TAR_FILE="predator_v45_release.tar.gz"

echo "🦅 Deploying Predator v45 | Neural Analyticsto $SERVER..."

# Note: This script assumes you have SSH access configured.
# If automatic upload fails, you can run these commands manually.

# 1. Repackage with new Docker configurations
echo "📦 Packaging release payload..."
tar -czf $TAR_FILE predatorctl google_agentctl services/arbiter services/truth-ledger infrastructure/constitution policies agents README_V45.md docker-compose.yml

# 2. Transfer Payload
echo "📦 Uploading release payload..."
scp -P $PORT $TAR_FILE $SERVER:$REMOTE_DIR/

# 3. Remote Execution
echo "🔄 Executing remote update..."
ssh -p $PORT $SERVER << EOF
    cd $REMOTE_DIR

    # Extract
    echo "Files extraction..."
    tar -xzf $TAR_FILE

    # Setup CLIs
    echo "Installing CLIs..."
    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
    fi
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -e predatorctl
    pip install -e google_agentctl

    # Update Services
    echo "Updating Docker Services..."
    docker compose up -d --build arbiter truth-ledger

    # Validate Constitution
    echo "Running Constitutional Audit..."
    predatorctl system audit --type constitution

    echo "✅ v45 Deployment Complete!"
EOF
