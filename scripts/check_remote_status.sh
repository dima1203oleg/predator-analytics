#!/bin/bash
HOST="2.tcp.eu.ngrok.io"
PORT="19884"
USER="dima"
KEY="$HOME/.ssh/id_ed25519_ngrok"

echo "📡 Connecting to remote server ($HOST:$PORT)..."
ssh -i $KEY -p $PORT -o StrictHostKeyChecking=no $USER@$HOST "docker ps --format 'table {{.Names}}\t{{.Status}}'" || echo "❌ SSH Connection Failed"
