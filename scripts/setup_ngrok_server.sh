#!/usr/bin/env bash
# Setup ngrok on a Linux/macOS server for TCP SSH access
# Usage: sudo ./setup_ngrok_server.sh <NGROK_AUTHTOKEN>
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <NGROK_AUTHTOKEN>"
  exit 1
fi

AUTH="$1"

echo "Installing ngrok..."
if command -v brew >/dev/null 2>&1; then
  brew install --cask ngrok || true
else
  arch=$(uname -m)
  if [ "$arch" = "x86_64" ]; then
    url="https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-amd64.zip"
  else
    url="https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-arm64.zip"
  fi
  curl -fsSL "$url" -o /tmp/ngrok.zip
  unzip -o /tmp/ngrok.zip -d /usr/local/bin
  chmod +x /usr/local/bin/ngrok
fi

echo "Configuring authtoken"
ngrok config add-authtoken "$AUTH" || { echo "Failed to add authtoken"; exit 1; }

[ -z "$(command -v systemctl 2>/dev/null)" ] && IS_SYSTEMCTL=0 || IS_SYSTEMCTL=1

if [ "$IS_SYSTEMCTL" -eq 1 ]; then
  echo "Create systemd service file: /etc/systemd/system/ngrok-ssh.service"
  cat >/etc/systemd/system/ngrok-ssh.service <<'SERVICE'
[Unit]
Description=ngrok TCP tunnel for SSH
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/ngrok tcp 22 --log /var/log/ngrok.log
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
SERVICE

echo "Reload systemd and enable service"
  systemctl daemon-reload
  systemctl enable --now ngrok-ssh.service
  echo "Done — check status with: sudo systemctl status ngrok-ssh.service && sudo journalctl -u ngrok-ssh -n 200 --no-pager"
else
  echo "=============================================="
  echo "NOTE: systemd not found on this host (macOS or other)."
  echo "ngrok was installed, but this script cannot create systemd service here." 
  echo "To run ngrok persistently on macOS consider using 'brew services start ngrok' or a launchd plist." 
  echo "Quick manual start (foreground): ngrok tcp 22" 
  echo "Or create a launchd plist and load it via launchctl for automatic start." 
  echo "=============================================="
fi
