#!/bin/bash
# scripts/fix_permissions.sh
# Fix common permission issues in node_modules

echo "🔧 Fixing permissions for node_modules..."
if [ -d "apps/predator-analytics-ui/node_modules" ]; then
    chmod -R u+w apps/predator-analytics-ui/node_modules
    echo "✅ Permissions fixed for UI node_modules"
else
    echo "⚠️ UI node_modules not found, skipping"
fi

echo "🔧 Killing stale Node processes..."
pkill -f "vite" || true
pkill -f "next" || true
echo "✅ Stale processes cleaned"

echo "🚀 Ready to restart!"
