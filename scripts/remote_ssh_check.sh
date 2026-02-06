#!/usr/bin/env bash
set -euo pipefail

# Run this on the remote server (or inside the VM/container) to check SSHD and networking
# Usage: run on the remote host as root or a user with sudo privileges

echo "[INFO] Checking sshd status and listeners"
if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl status sshd || sudo systemctl status ssh
fi

echo "\n[INFO] Check listeners for port 22 (ssh)"
if command -v ss >/dev/null 2>&1; then
  ss -ltnp | grep -E ':22\s' || true
else
  netstat -ltnp | grep -E ':22\s' || true
fi

echo "\n[INFO] Check if sshd process is running"
ps aux | grep -E 'sshd:|/usr/sbin/sshd' | grep -v grep || true

echo "\n[INFO] Check sshd config grep for ListenAddress"
sudo grep -E '^\s*ListenAddress' /etc/ssh/sshd_config || true

echo "\n[INFO] Check firewall rules (iptables/ufw)"
if command -v ufw >/dev/null 2>&1; then
  sudo ufw status verbose || true
fi
if command -v iptables >/dev/null 2>&1; then
  sudo iptables -L -n | head -n 50 || true
fi

echo "\n[INFO] Check logs for sshd messages"
if [ -f /var/log/auth.log ]; then
  sudo tail -n 50 /var/log/auth.log || true
elif [ -f /var/log/secure ]; then
  sudo tail -n 50 /var/log/secure || true
fi

echo "\n[INFO] If you are using ngrok on the remote server, confirm the ngrok command:"
ps aux | grep -i ngrok | grep -v grep || true
echo "If using ngrok, confirm it maps localhost:22 for SSH: 'ngrok tcp 22'"

echo "\n[INFO] End of remote checks. If sshd is not listening on port 22, you need to start/enable it and ensure ngrok forwards to that port."
