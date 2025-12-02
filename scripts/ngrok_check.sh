#!/usr/bin/env bash
# Lightweight checker for ngrok service + sample remote address connectivity
set -eu

echo "Checking for ngrok binary and service (systemd)..."
if ! command -v ngrok >/dev/null 2>&1; then
  echo "ngrok not found in PATH"
else
  echo "ngrok binary: $(command -v ngrok)"
fi

if systemctl list-units --type=service --all | grep -q ngrok; then
  echo "systemd unit for ngrok found:" 
  systemctl status ngrok-ssh --no-pager --lines=5 || true
else
  echo "No systemd unit named ngrok-ssh found"
fi

echo "To test connectivity from client side to an ngrok TCP endpoint run:"
echo "  nc -vz 0.tcp.eu.ngrok.io 11946"
echo "Replace with the actual host:port shown by ngrok on the server"
