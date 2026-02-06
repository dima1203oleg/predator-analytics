#!/bin/bash
echo "🦁 PREDATOR UI V31 LUNAR - STABILITY EDITION"

# 1. Cleanup
pkill -f "vite"
lsof -ti:3045 | xargs kill -9 2>/dev/null
rm -rf apps/predator-analytics-ui/.vite_cache

# 2. Permission check
echo "🔧 Unlocking binaries..."
chmod +x node_modules/vite/bin/vite.js 2>/dev/null

# 3. Launch UI
echo "🚀 Launching UI on port 3045..."
cd apps/predator-analytics-ui
VITE_EXEC="../../node_modules/vite/bin/vite.js"

# RUN directly via node to bypass sandbox wrapper issues
node "$VITE_EXEC" --port 3045 --host --config vite.config.ts --clearScreen false
