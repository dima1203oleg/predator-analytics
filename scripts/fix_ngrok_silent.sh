#!/bin/bash
SERVER="predator-server"
DOMAIN="jolyn-bifid-eligibly.ngrok-free.dev"

echo "🔧 RESTARTING NGROK (SILENT MODE)..."

# 1. Kill old process via simple SSH command
ssh -o ConnectTimeout=5 "$SERVER" "pkill -9 ngrok" 2>/dev/null

# 2. Start new process fully detached
# We redirect stdin/stdout/stderr to /dev/null or log file and verify immediately
ssh -o ConnectTimeout=5 "$SERVER" "nohup ngrok http --domain=$DOMAIN 8080 > /home/dima/ngrok.log 2>&1 < /dev/null & exit"

echo "✅ Command sent. Ngrok should be online in 5 seconds."
