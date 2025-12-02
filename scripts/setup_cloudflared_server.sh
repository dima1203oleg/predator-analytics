#!/usr/bin/env bash
# Install and prepare cloudflared on a server (systemd) for creating a persistent tunnel
# NOTE: cloudflared tunnel creation requires Cloudflare account access — this script prepares prerequisites and service.
set -eu

echo "Installing cloudflared"
if command -v brew >/dev/null 2>&1; then
  brew install cloudflare/cloudflare/cloudflared || true
else
  # Official install for Linux x86/ARM
  curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
  chmod +x /usr/local/bin/cloudflared
fi

[ -z "$(command -v systemctl 2>/dev/null)" ] && IS_SYSTEMCTL=0 || IS_SYSTEMCTL=1

if [ "$IS_SYSTEMCTL" -eq 1 ]; then
  echo "Create systemd unit: /etc/systemd/system/cloudflared.service"
  cat >/etc/systemd/system/cloudflared.service <<'SYSTEMD'
[Unit]
Description=cloudflared tunnel
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/cloudflared tunnel run --config /etc/cloudflared/config.yml
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
SYSTEMD

mkdir -p /etc/cloudflared
if [ ! -f /etc/cloudflared/config.yml ]; then
  cat >/etc/cloudflared/config.yml <<'CFG'
# Example configuration (requires 'tunnel' created via 'cloudflared tunnel create <NAME>')
# Replace tunnel: <UUID> and hostname with your domain
tunnel: <TUNNEL-UUID>
credentials-file: /etc/cloudflared/<TUNNEL-UUID>.json

ingress:
  - hostname: ssh.example.com
    service: ssh://localhost:22
  - service: http_status:404
CFG
  echo "Wrote sample /etc/cloudflared/config.yml — you must populate with your tunnel id and credentials"
fi

  systemctl daemon-reload
  systemctl enable --now cloudflared.service || true
  echo "cloudflared installed and systemd unit created. Next steps: 'cloudflared tunnel create <NAME>' and 'cloudflared tunnel route dns <NAME> ssh.example.com'"
else
  echo "=============================================="
  echo "NOTE: systemd not found on this host (macOS or other)."
  echo "cloudflared was installed but this script cannot create a systemd unit here." 
  echo "On macOS use 'brew services start cloudflared' after you complete 'cloudflared tunnel create <NAME>' locally." 
  echo "Or run 'cloudflared tunnel run <NAME>' manually to test." 
  echo "=============================================="
fi
