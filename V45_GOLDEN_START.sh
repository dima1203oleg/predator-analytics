#!/bin/bash
# 🦁 PREDATOR V45 GOLDEN LAUNCHER (CLEAN VERSION)
# Bypasses local locks by running from /tmp

PROJECT_ROOT="/Users/dima-mac/Documents/Predator_21"
UI_DIR="$PROJECT_ROOT/apps/predator-analytics-ui"
TMP_RUN="/tmp/predator_v45_launch"
BACKEND_PORT=3040
FRONTEND_PORT=3030

echo "🚀 Starting PREDATOR V45 Integration (Clean Mode)..."

# Prepare clean workspace
rm -rf "$TMP_RUN" && mkdir -p "$TMP_RUN"
echo "📂 Synchronizing source to $TMP_RUN..."
cp "$UI_DIR/package.json" "$TMP_RUN/"
cp "$UI_DIR/vite.config.ts" "$TMP_RUN/"
cp "$UI_DIR/index.html" "$TMP_RUN/"
cp -R "$UI_DIR/src" "$TMP_RUN/"
# Copy config files if they exist
cp "$UI_DIR/tailwind.config.js" "$TMP_RUN/" 2>/dev/null || true
cp "$UI_DIR/postcss.config.js" "$TMP_RUN/" 2>/dev/null || true

cd "$TMP_RUN"

if [ ! -d "node_modules" ]; then
    echo "📦 Installing clean dependencies (one-time)..."
    npm install --legacy-peer-deps
fi

# Set env
export VITE_BACKEND_PROXY_TARGET="http://localhost:$BACKEND_PORT"
export VITE_API_URL="/api/v1"

echo "🎯 LAUNCHING v45 on http://localhost:$FRONTEND_PORT..."
npx vite --port $FRONTEND_PORT --host --clearScreen false
