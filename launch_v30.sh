#!/bin/bash

# Cleanup existing processes on our target ports
echo "🧹 Cleaning up ports 3030-3033..."
pkill -f "node v30_gateway.js" || true
pkill -f "vite" || true

# Allow processes to die
sleep 1

# Start Backend on 3030
echo "🚀 Starting Backend on http://localhost:3030..."
node v30_gateway.js > /tmp/gateway_3030.log 2>&1 &
BACKEND_PID=$!
echo "   Backend running (PID $BACKEND_PID)"

# Wait for backend to be ready
sleep 1

# Start Frontend (Directly using v30_ui workspace) on 3033
echo "✨ Starting Frontend on http://localhost:3033..."
echo "   (Proxying to Backend on 3030)"

# Use trap to kill backend when this script exits
trap "kill $BACKEND_PID" EXIT

cd v30_ui || exit
./node_modules/.bin/vite --port 3033
