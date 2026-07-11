#!/bin/bash
# 🔗 NGROK SSH Tunnel Setup for NVIDIA Server (194.177.1.240:6666)
# This script creates a public ngrok tunnel to SSH into the NVIDIA server

set -e

echo "🔗 Starting NGROK SSH Tunnel..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Target: 194.177.1.240:6666"
echo "User: dima"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get ngrok public URL
echo "📡 Starting ngrok tunnel..."
ngrok tcp 6666 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 3

# Get the public URL from ngrok API
PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null || echo "")

if [ -z "$PUBLIC_URL" ]; then
    echo "❌ Failed to get ngrok public URL"
    kill $NGROK_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Tunnel Created!"
echo ""
echo "🌐 Public URL: $PUBLIC_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Extract host and port from ngrok URL (tcp://XX.ngrok.io:XXXXX)
PUBLIC_HOST=$(echo $PUBLIC_URL | sed 's|tcp://||' | cut -d: -f1)
PUBLIC_PORT=$(echo $PUBLIC_URL | cut -d: -f3)

echo "📋 Connection Details:"
echo "   Host: $PUBLIC_HOST"
echo "   Port: $PUBLIC_PORT"
echo "   User: dima"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔐 SSH Commands:"
echo ""
echo "1. Direct SSH:"
echo "   ssh -p $PUBLIC_PORT dima@$PUBLIC_HOST"
echo ""
echo "2. With key:"
echo "   ssh -i ~/.ssh/id_ed25519_dev -p $PUBLIC_PORT dima@$PUBLIC_HOST"
echo ""
echo "3. Copy this for SSH config alias:"
echo "   Host predator-ngrok"
echo "       HostName $PUBLIC_HOST"
echo "       Port $PUBLIC_PORT"
echo "       User dima"
echo "       IdentityFile ~/.ssh/id_ed25519_dev"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏸️  Press Ctrl+C to stop tunnel"
echo ""

# Save tunnel info
cat > /tmp/ngrok-tunnel-info.txt << EOF
NGROK_URL=$PUBLIC_URL
NGROK_HOST=$PUBLIC_HOST
NGROK_PORT=$PUBLIC_PORT
NGROK_PID=$NGROK_PID
CREATED_AT=$(date)
EOF

echo "💾 Tunnel info saved to: /tmp/ngrok-tunnel-info.txt"
echo ""

# Keep tunnel alive
wait $NGROK_PID
