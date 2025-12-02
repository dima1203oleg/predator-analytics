#!/usr/bin/env bash
# Client helper to install cloudflared (macOS) and show ssh ProxyCommand snippet
set -eu

echo "Install cloudflared on macOS:"
echo "  brew install cloudflare/cloudflare/cloudflared"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared not found — please run the brew install command above"
  exit 1
fi

echo "Login to Cloudflare from this client to obtain cert (will open browser):"
echo "  cloudflared login"

echo "Add this snippet to your ~/.ssh/config (edit path to cloudflared if needed):"
cat <<'SSH'
Host dg-via-cf
  HostName ssh.example.com
  User superuser
  ProxyCommand /opt/homebrew/bin/cloudflared access ssh --hostname %h
  IdentitiesOnly yes
  StrictHostKeyChecking no
SSH

echo "Then connect: ssh dg-via-cf"
