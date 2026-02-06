#!/bin/bash

BASE_URL="http://localhost:8090/api/v1"
FILE_PATH="sample_fsm_upload.txt"

echo "Creating dummy file..."
echo "Dummy content" > "$FILE_PATH"

echo "🚀 Uploading to $BASE_URL/ingest/upload..."
RESPONSE=$(curl -s -X POST -F "file=@$FILE_PATH" "$BASE_URL/ingest/upload")

echo "Response: $RESPONSE"

SOURCE_ID=$(echo $RESPONSE | jq -r '.source_id')
STATE=$(echo $RESPONSE | jq -r '.state')

if [ "$SOURCE_ID" == "null" ]; then
    echo "❌ Upload failed or source_id not found."
    exit 1
fi

echo "✅ Upload successful. Source ID: $SOURCE_ID. Initial State: $STATE"

echo "⏳ Polling status..."

for i in {1..30}; do
    STATUS_JSON=$(curl -s "$BASE_URL/ingest/status/$SOURCE_ID")
    CURr_STATE=$(echo $STATUS_JSON | jq -r '.state')
    PROGRESS=$(echo $STATUS_JSON | jq -r '.progress')

    echo "   [$i/30] State: $CURr_STATE (Progress: $PROGRESS%)"

    if [ "$CURr_STATE" == "READY" ]; then
        echo "🎉 Pipeline FSM completed successfully! READY."
        rm "$FILE_PATH"
        exit 0
    fi

    if [ "$CURr_STATE" == "FAILED" ]; then
        echo "❌ Pipeline FSM FAILED."
        rm "$FILE_PATH"
        exit 1
    fi

    sleep 1
done

echo "❌ Timeout waiting for pipeline."
rm "$FILE_PATH"
exit 1
