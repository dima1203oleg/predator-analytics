#!/bin/bash
# 🧼 PREDATOR CLEAN BOOT
# Bypasses Documents folder permission lockdowns by running from /tmp

RUN_DIR="/tmp/predator_v30_$(date +%s)"
SOURCE_DIR="/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui"

echo "🧼 Initializing clean environment in $RUN_DIR..."
mkdir -p "$RUN_DIR"

echo "📂 Copying source files..."
# Copy only necessary files to avoid locking issues
cp "$SOURCE_DIR/package.json" "$RUN_DIR/"
cp "$SOURCE_DIR/vite.config.ts" "$RUN_DIR/"
cp "$SOURCE_DIR/index.html" "$RUN_DIR/"
cp "$SOURCE_DIR/tailwind.config.js" "$RUN_DIR/" 2>/dev/null || true
cp "$SOURCE_DIR/postcss.config.js" "$RUN_DIR/" 2>/dev/null || true
cp "$SOURCE_DIR/tsconfig.json" "$RUN_DIR/" 2>/dev/null || true
cp -R "$SOURCE_DIR/src" "$RUN_DIR/"

cd "$RUN_DIR"

echo "📦 Installing clean dependencies..."
npm install --legacy-peer-deps

echo "🚀 Launching V30 on port 3034..."
export VITE_BACKEND_PROXY_TARGET="http://localhost:9080"
npx vite --port 3034 --host --clearScreen false
