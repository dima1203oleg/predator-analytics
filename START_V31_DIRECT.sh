#!/bin/bash
echo "🦁 PREDATOR UI V31 DIRECT ACCESS"
cd apps/predator-analytics-ui
# We use node directly and tell it exactly where the entry point is
node ../../node_modules/vite/bin/vite.js serve --port 3045 --host --config vite.config.ts --clearScreen false
