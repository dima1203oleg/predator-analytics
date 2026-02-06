#!/bin/bash
echo "🦁 STARTING PREDATOR V30 FIX (FINAL FIX)..."

# 1. Kill old processes to clean up noise
pkill -f "vite"
pkill -f "resilient_monitor"

# 2. Fix permissions for esbuild (CRITICAL FIX)
# We go deep into node_modules to find the binary and make it executable
echo "🔧 Fixing esbuild permissions..."
chmod -R +x node_modules/@esbuild/darwin-arm64/bin/ 2>/dev/null
chmod +x node_modules/@esbuild/darwin-arm64/bin/esbuild 2>/dev/null

# Also fix vite binary just in case
chmod +x node_modules/vite/bin/vite.js 2>/dev/null

# 3. Start Monitor (Quieter version)
echo "🦅 Starting Monitor..."
/opt/homebrew/bin/python3.12 resilient_monitor.py &

# 4. Start UI
echo "🚀 Starting UI..."
cd apps/predator-analytics-ui

# Fallback path if explicit find fails
VITE_EXEC="../../node_modules/vite/bin/vite.js"

if [ -f "./node_modules/vite/bin/vite.js" ]; then
    VITE_EXEC="./node_modules/vite/bin/vite.js"
fi

echo "⚡ Launching Vite..."
node "$VITE_EXEC" --port 3034 --host --clearScreen false
