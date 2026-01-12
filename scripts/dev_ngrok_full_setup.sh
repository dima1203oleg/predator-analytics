#!/usr/bin/env bash
set -euo pipefail

# Wrapper orchestration:
#  - run ssh_dev_ngrok_setup.sh to ensure config & key
#  - run probe_ngrok_endpoint.sh to detect if SSH is present
#  - optionally run ssh-copy-id to install the generated key (may require password input)

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

AUTO_INSTALL_KEY=false
FORCE=false
GENERATE_KEY=false
UNSAFE=false
TEST_ONLY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --auto-install-key) AUTO_INSTALL_KEY=true; shift ;; 
    --force) FORCE=true; shift ;;
    --generate-key) GENERATE_KEY=true; shift ;;
    --unsafe) UNSAFE=true; shift ;;
    --test-only) TEST_ONLY=true; shift ;;
    -h|--help) echo "Usage: $0 [--auto-install-key] [--force] [--generate-key] [--unsafe] [--test-only]"; exit 0; ;;
    *) echo "Unknown arg: $1"; exit 2; ;;
  esac
done

SSH_SETUP_OPTS=()
if [ "$FORCE" = true ]; then SSH_SETUP_OPTS+=("--force"); fi
if [ "$GENERATE_KEY" = true ]; then SSH_SETUP_OPTS+=("--generate-key"); fi
if [ "$UNSAFE" = true ]; then SSH_SETUP_OPTS+=("--unsafe"); fi

echo "[INFO] Orchestrator: starting dev-ngrok full setup"

if [ "$TEST_ONLY" = true ]; then
  echo "[INFO] Test-only: will run diagnostics only (no modifications)"
  bash "$SCRIPT_DIR/ssh_dev_ngrok_setup.sh" --test-only
  bash "$SCRIPT_DIR/probe_ngrok_endpoint.sh"
  exit 0
fi

echo "[INFO] Running SSH setup (config, keys, backups)"
bash "$SCRIPT_DIR/ssh_dev_ngrok_setup.sh" "${SSH_SETUP_OPTS[@]}"

echo "[INFO] Running probe to check endpoint type"
bash "$SCRIPT_DIR/probe_ngrok_endpoint.sh" && probe_rc=0 || probe_rc=$?

if [ "$probe_rc" -eq 0 ]; then
  echo "[SUCCESS] probe indicates SSH banner received at remote endpoint"
  if [ "$AUTO_INSTALL_KEY" = true ]; then
    echo "[INFO] Attempting to install public key via ssh-copy-id (you may be prompted for password)"
    if command -v ssh-copy-id >/dev/null 2>&1; then
      ssh-copy-id -i ~/.ssh/id_ed25519_ngrok -p 18105 dev-ngrok || true
    else
      echo "[WARN] ssh-copy-id not installed; attempting manual copy using ssh"
      ssh -p 18105 dev-ngrok "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys" < ~/.ssh/id_ed25519_ngrok.pub || true
    fi
    echo "[INFO] After key copy, try: ssh -v -F ~/.ssh/config dev-ngrok"
  else
    echo "[INFO] Auto-install-key not enabled. If you want to install the key automatically, re-run with --auto-install-key"
  fi
else
  echo "[INFO] probe indicates no SSH banner or another protocol; code $probe_rc"
  echo "[SUGGEST] If you expect SSH: check server's sshd and ngrok mapping; see remote_ssh_check.sh to run on remote host (or contact server admin)."
fi

echo "[INFO] dev-ngrok full setup finished"
exit 0
