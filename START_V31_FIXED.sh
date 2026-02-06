#!/bin/bash
echo "🦁 PREDATOR UI V31 - STABILITY LAUNCH"
echo "🔧 Cleaning old locks..."
rm -rf apps/predator-analytics-ui/.vite_cache

echo "🚀 Starting Vite on port 3045..."
# We use the sandbox wrapper to ensure execution within permissions
SANDBOX_WORK_DIR=$(pwd) /Applications/Antigravity.app/Contents/Resources/app/extensions/antigravity/bin/sandbox-wrapper.sh bash -c 'cd apps/predator-analytics-ui && ../../node_modules/.bin/vite --port 3045 --host'
