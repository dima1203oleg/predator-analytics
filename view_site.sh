#!/bin/bash
# PREDATOR V30 - Secure UI Viewer
# Bypasses server firewall using direct container tunnel

SERVER="dima@194.177.1.240"
PORT="6666"

echo "🔍 Finding Frontend Container IP..."
CONTAINER_IP=$(ssh -p $PORT $SERVER "docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' predator_frontend")

if [ -z "$CONTAINER_IP" ]; then
    echo "❌ Error: Could not find predator_frontend container. Is it running?"
    echo "Trying ssh fallback..."
    CONTAINER_IP="127.0.0.1"
fi

echo "🎯 Target IP: $CONTAINER_IP"
echo "🔌 Establishing Tunnel..."

# Kill previous tunnels on 8080
lsof -ti:8080 | xargs kill -9 2>/dev/null

# Start tunnel
ssh -L 8080:$CONTAINER_IP:80 -p $PORT $SERVER -N &
TUNNEL_PID=$!

echo "✅ Tunnel Active (PID: $TUNNEL_PID)"
echo "🌐 Open Browser: http://localhost:8080"
echo "ℹ️  Press Ctrl+C to stop"

wait $TUNNEL_PID
