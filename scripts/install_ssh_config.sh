#!/usr/bin/env bash
# Append a safe SSH Host entry to ~/.ssh/config (will create file/dir if missing)
# Usage: ./install_ssh_config.sh "HostName" "User" "Port" "Alias" [path-to-cloudflared]

set -eu

if [ "$#" -lt 4 ]; then
  cat <<USAGE
Usage: $0 <HostName> <User> <Port> <Alias> [cloudflared_path]
Example: $0 0.tcp.eu.ngrok.io superuser 11946 remote-dg
Example for cloudflared: $0 ssh.example.com superuser 22 dg-via-cf /opt/homebrew/bin/cloudflared
USAGE
  exit 1
fi

HOSTNAME="$1"
USER="$2"
PORT="$3"
ALIAS="$4"
CLOUDFLARED_PATH="${5:-}"

mkdir -p ~/.ssh
touch ~/.ssh/config
chmod 600 ~/.ssh/config

echo "Adding entry to ~/.ssh/config for host '$ALIAS' (HostName=$HOSTNAME)"

if [ -n "$CLOUDFLARED_PATH" ]; then
  cat >>~/.ssh/config <<EOF

Host $ALIAS
  HostName $HOSTNAME
  User $USER
  ProxyCommand $CLOUDFLARED_PATH access ssh --hostname %h
  IdentitiesOnly yes
  StrictHostKeyChecking no
EOF
else
  cat >>~/.ssh/config <<EOF

Host $ALIAS
  HostName $HOSTNAME
  User $USER
  Port $PORT
  IdentitiesOnly yes
  StrictHostKeyChecking no
EOF
fi

echo "Done. Connect with: ssh $ALIAS"
