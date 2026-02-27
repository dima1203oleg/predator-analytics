#!/bin/bash
cd /Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui

echo "🏗️ Building Local UI Preview (v45)..."
# Build locally
docker build -t predator-local-ui -f Dockerfile.local .

# Cleanup old
docker rm -f predator-local-ui 2>/dev/null || true

echo "🚀 Starting Container..."
docker run -d -p 3000:80 --name predator-local-ui predator-local-ui

echo " "
echo "✅ PREVIEW READY!"
echo "👉 Open: http://localhost:3000/parsers"
