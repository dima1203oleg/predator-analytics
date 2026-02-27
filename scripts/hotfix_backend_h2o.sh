#!/bin/bash
# Predator v45 | Neural Analytics- BACKEND HOTFIX (H2O JSON PARSER)
# Applies a robust JSON parser to the running backend container to fix pipeline crashes.

SERVER="predator-server"
REMOTE_TEMP_DIR="/home/dima/predator-analytics/hotfix_v45"
LOCAL_FILE="/Users/dima-mac/Documents/Predator_21/app/services/h2o_manager.py"
CONTAINER_NAME="predator_backend"
CONTAINER_PATH="/app/app/services/h2o_manager.py"

echo "🩹 APPLYING H2O MANAGER HOTFIX..."

# 1. Prepare Remote Dir
ssh -o ControlMaster=no "$SERVER" "mkdir -p $REMOTE_TEMP_DIR"

# 2. Upload Fixed File
echo "📤 Uploading patched file..."
scp -o ControlMaster=no "$LOCAL_FILE" "$SERVER:$REMOTE_TEMP_DIR/h2o_manager.py"

# 3. Apply Patch & Restart
echo "💉 Injecting into container..."
ssh -o ControlMaster=no "$SERVER" << EOF
    # Backup original inside container (just in case)
    docker exec $CONTAINER_NAME cp $CONTAINER_PATH ${CONTAINER_PATH}.bak

    # Copy new file
    docker cp $REMOTE_TEMP_DIR/h2o_manager.py $CONTAINER_NAME:$CONTAINER_PATH

    # Verify copy
    docker exec $CONTAINER_NAME ls -l $CONTAINER_PATH

    # Restart Backend
    echo "🔄 Restarting predator_backend..."
    docker restart $CONTAINER_NAME

    # Wait for boot
    echo "⏳ Waiting for service to stabilize..."
    sleep 10

    # Check status
    docker ps | grep $CONTAINER_NAME
EOF

echo "✅ HOTFIX APPLIED."
