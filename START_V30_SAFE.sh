#!/bin/bash
echo "🦁 SAFETY MODE START V30 @ 3045..."

# 1. Cleaning cleanup
pkill -f "vite"
lsof -ti:3045 | xargs kill -9 2>/dev/null

# 2. Permission magic
echo "🔧 Unlocking binaries..."
chmod -R +x node_modules/@esbuild/darwin-arm64/bin/ 2>/dev/null
chmod +x node_modules/@esbuild/darwin-arm64/bin/esbuild 2>/dev/null
chmod +x node_modules/vite/bin/vite.js 2>/dev/null

# 3. Launch UI
echo "🚀 Launching UI on port 3045..."
cd apps/predator-analytics-ui

# Uses logic from RUN_ME_FIXED.sh
VITE_EXEC="../../node_modules/vite/bin/vite.js"

# Execute
node "$VITE_EXEC" --port 3045 --host --config vite.config.ts --clearScreen false
