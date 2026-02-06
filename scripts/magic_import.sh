#!/bin/bash
# Magic Import Script - Bypassing Docker CLI restrictions

FILE_PATH="$1"
TARGET_DIR="services/api-gateway/app/data_staging"
FILENAME=$(basename "$FILE_PATH")

echo "magic_import: 🪄 Starting API-based import..."

# 1. Ensure target directory exists (this is mounted to container)
mkdir -p "$TARGET_DIR"

# 2. Copy file to the "hot folder"
echo "magic_import: 📂 Moving file to shared volume..."
cp "$FILE_PATH" "$TARGET_DIR/$FILENAME"

if [ $? -ne 0 ]; then
    echo "❌ Failed to copy file. Check permissions."
    exit 1
fi

echo "magic_import: 🚀 Triggering Server-Side ETL..."

# 3. Call the API Endpoint
# Note: The file path passed to API is relative to /app directory inside container
# Since we copied to /app/app/data_staging/FILENAME, we pass that.
API_PATH="data_staging/$FILENAME"

response=$(curl -s -X POST "http://localhost:8090/api/v1/customs/import-local?file_path=$API_PATH")

# 4. Parse response
if echo "$response" | grep -q '"success":true'; then
    echo "✅ SUCCESS! Import started successfully."
    echo "📊 Response: $response"
    echo "👉 Check the UI Pipeline Monitor for live progress."
else
    echo "❌ Server returned error:"
    echo "$response"
    echo "---"
    echo "Verify that the backend is running on port 8090."
fi
