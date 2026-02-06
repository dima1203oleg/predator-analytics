#!/bin/bash

# Production ETL Execution Script
# Usage: ./scripts/execute_customs_import.sh <path_to_excel>

INPUT_FILE="$1"
CONTAINER_NAME="predator_backend"
TEMP_DIR="services/api-gateway/app/data"
CONTAINER_PATH="/app/app/data/import_target.xlsx"

if [ -z "$INPUT_FILE" ]; then
    echo "Usage: $0 <path_to_excel_file>"
    exit 1
fi

if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ Input file not found: $INPUT_FILE"
    exit 1
fi

echo "📦 Preparing to import: $INPUT_FILE"

# Ensure target directory exists for Docker mount
# In our docker-compose.yml: ./services/api-gateway/app:/app/app
# So we place it in services/api-gateway/app/data
MOUNTED_DATA_DIR="services/api-gateway/app/data"
mkdir -p "$MOUNTED_DATA_DIR"

# Copy file to a location mounted in the container
echo "🔄 Staging file for Docker container..."
cp "$INPUT_FILE" "$MOUNTED_DATA_DIR/import_target.xlsx"

if [ $? -ne 0 ]; then
    echo "❌ Failed to copy file to staging area. Check your permissions."
    exit 1
fi

# Check if Docker is running
echo "🐳 Checking Docker connectivity..."

# Try to detect and TEST socket path
POSSIBLE_SOCKETS=(
    "$HOME/.docker/run/docker.sock"
    "/Users/dima-mac/.docker/run/docker.sock"
    "/var/run/docker.sock"
)

SOCKET_FOUND=false

for socket in "${POSSIBLE_SOCKETS[@]}"; do
    if [ -S "$socket" ]; then
        echo "🔎 Testing socket: $socket"
        export DOCKER_HOST="unix://$socket"

        if docker info > /dev/null 2>&1; then
            echo "✅ Connected to Docker via $socket"
            SOCKET_FOUND=true
            break
        else
            echo "⚠️  Socket exists but connection failed (permissions?)"
        fi
    fi
done

if [ "$SOCKET_FOUND" = false ]; then
    echo "❌ Could not verify connection to any Docker socket."
    echo "Debug output from last attempt:"
    docker info 2>&1 | head -n 10
    echo "---"
    echo "💡 TRY THIS: sudo chmod 666 /Users/dima-mac/.docker/run/docker.sock"
    exit 1
fi

echo "🚀 Executing ETL inside $CONTAINER_NAME..."
docker exec $CONTAINER_NAME python3 /app/scripts/run_production_etl.py "$CONTAINER_PATH"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ ETL Process Completed Successfully."
else
    echo "❌ ETL Process Failed (Exit Code: $EXIT_CODE)"
fi

# Cleanup
rm "$TEMP_DIR/import_target.xlsx" 2>/dev/null
rm "$TEMP_DIR/import_target.xlsx.parsed.json" 2>/dev/null

exit $EXIT_CODE
