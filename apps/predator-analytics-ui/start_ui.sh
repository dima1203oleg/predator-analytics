#!/bin/bash
# PREDATOR Analytics UI - Auto Start Script
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
export PATH="/opt/homebrew/bin:$PATH"

echo "🚀 Starting PREDATOR Analytics UI..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start development server
echo "🌐 Starting Vite dev server on port 3030..."
npm run dev -- --port 3030 --host
