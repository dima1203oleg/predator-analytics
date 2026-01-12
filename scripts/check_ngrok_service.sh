#!/usr/bin/env bash
# Check whether ngrok service runs on the remote server through SSH alias dev-ngrok
set -euo pipefail

SSH_ALIAS=${1:-dev-ngrok}
SSH_KEY=${SSH_KEY:-$HOME/.ssh/id_ed25519_ngrok}

echo "Checking ngrok service on "${SSH_ALIAS}

echo "→ systemd check (sudo systemctl status ngrok-ssh.service)"
ssh -o BatchMode=yes -i "$SSH_KEY" "$SSH_ALIAS" "sudo systemctl status ngrok-ssh.service --no-pager || true"

echo "→ fallback: check running processes and log file locations"
ssh -o BatchMode=yes -i "$SSH_KEY" "$SSH_ALIAS" "ps aux | grep [n]grok || true; ls -la /var/log/ngrok.log || true"

exit 0
