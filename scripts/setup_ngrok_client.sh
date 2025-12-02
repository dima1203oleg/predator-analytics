#!/usr/bin/env bash
# Setup guide for ngrok on client macOS (or Linux)
# Usage: ./setup_ngrok_client.sh
set -eu

echo "Ensure ngrok is installed on the client. On macOS run: brew install --cask ngrok"

if ! command -v ngrok >/dev/null 2>&1; then
  echo "ngrok not found — install with Homebrew: brew install --cask ngrok"
  exit 1
fi

echo "You can add a shorthand to ~/.ssh/config to connect through the remote ngrok address you obtained from the server"
echo "Example ~/.ssh/config entry — edit and replace host:port with the ngrok address shown on the server" 
cat <<'SSH'
Host remote-dg
  HostName 0.tcp.eu.ngrok.io
  User superuser
  Port 11946
  IdentitiesOnly yes
  StrictHostKeyChecking no
SSH

echo "To connect run: ssh remote-dg"
