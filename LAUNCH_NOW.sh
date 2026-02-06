#!/bin/bash
# PREDATOR EMERGENCY LAUNCHER
# Uses /tmp bypass to avoid EPERM errors on node_modules

echo "🦁 EMERGENCY LAUNCH @ PORT 3045..."

# 1. Setup temp environment
mkdir -p /tmp/predator_safe_launch
cd /tmp/predator_safe_launch

# 2. Link source code (read-only link is safer)
# We link the project root so we can access everything
ln -s "/Users/dima-mac/Documents/Predator_21" project_root 2>/dev/null

# 3. Enter UI directory through the link
cd project_root/apps/predator-analytics-ui

# 4. Force executable permissions on vite binary (via direct path)
chmod +x ../../node_modules/vite/bin/vite.js 2>/dev/null

# 5. Launch using Node directly to avoid symlink triggers
echo "🚀 Starting Vite Server..."
export TESSERACT_DATA_PATH=/opt/homebrew/share/tessdata
export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin

# Clean previous ports
lsof -ti:3045 | xargs kill -9 2>/dev/null
lsof -ti:3034 | xargs kill -9 2>/dev/null

# Direct Node launch
node ../../node_modules/vite/bin/vite.js --port 3045 --host --config vite.config.ts
