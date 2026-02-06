#!/bin/bash
# PREDATOR Analytics UI - Auto Start Script
cd /Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui

echo "🚀 Starting PREDATOR Analytics UI..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start development server
echo "🌐 Starting Vite dev server on port 3030..."
npm run dev -- --port 3030 --host
