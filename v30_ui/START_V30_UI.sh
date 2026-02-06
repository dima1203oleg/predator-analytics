#!/bin/bash
echo "🦁 PREDATOR UI V30 START (Clean Dir)"

# Now we should have local node_modules in v30_ui
VITE_BIN="./node_modules/.bin/vite"

if [ ! -x "$VITE_BIN" ]; then
    echo "⚠️ Local Vite not found yet. Using npx fallback..."
    npm run dev -- --port 3030 --host
else
    # Use the local vite directly
    echo "🚀 Launching Vite from v30_ui/node_modules..."
    "$VITE_BIN" --port 3030 --host --config vite.config.safe.ts
fi
