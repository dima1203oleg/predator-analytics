#!/usr/bin/env bash
set -euo pipefail

# add_ssh_pubkey.sh
# Simple helper to append a public key to a user's authorized_keys on the server.
# Usage:
#   sudo ./add_ssh_pubkey.sh --key-file /path/to/key.pub --user dima
#   or (as target user) ./add_ssh_pubkey.sh --key-string "ssh-ed25519 AAAA..."

usage() {
  cat <<EOF
Usage: $0 [--key-file FILE | --key-string KEY] [--user USER]
If --user is omitted, the script operates on the current user.
EOF
  exit 1
}

KEY_FILE=""
KEY_STRING=""
TARGET_USER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --key-file) KEY_FILE="$2"; shift 2;;
    --key-string) KEY_STRING="$2"; shift 2;;
    --user) TARGET_USER="$2"; shift 2;;
    -h|--help) usage;;
    *) echo "Unknown arg: $1"; usage;;
  esac
done

if [[ -z "$KEY_FILE" && -z "$KEY_STRING" ]]; then
  echo "Either --key-file or --key-string is required." >&2
  usage
fi

if [[ -z "$TARGET_USER" ]]; then
  TARGET_USER=$(id -un)
fi

HOME_DIR="/home/$TARGET_USER"
if [[ "$TARGET_USER" == "root" ]]; then
  HOME_DIR="/root"
fi

AUTH_DIR="$HOME_DIR/.ssh"
AUTH_FILE="$AUTH_DIR/authorized_keys"

mkdir -p "$AUTH_DIR"
chmod 700 "$AUTH_DIR"
touch "$AUTH_FILE"
chmod 600 "$AUTH_FILE"

if [[ -n "$KEY_FILE" ]]; then
  if [[ ! -f "$KEY_FILE" ]]; then
    echo "Key file not found: $KEY_FILE" >&2
    exit 2
  fi
  KEY=$(cat "$KEY_FILE" | tr -d '\n')
else
  KEY="$KEY_STRING"
fi

# Avoid duplicate entries
if grep -qxF "$KEY" "$AUTH_FILE"; then
  echo "Key already present in $AUTH_FILE"
  exit 0
fi

echo "$KEY" >> "$AUTH_FILE"
chmod 600 "$AUTH_FILE"
chown -R "$TARGET_USER":"$TARGET_USER" "$AUTH_DIR"

echo "Key added to $AUTH_FILE for user $TARGET_USER"
