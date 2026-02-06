#!/bin/bash
cd "$(dirname "$0")/.."
export PYTHONPATH=$(pwd)/libs_local_v2
export REQUESTS_CA_BUNDLE=/etc/ssl/cert.pem
export SSL_CERT_FILE=/etc/ssl/cert.pem

# Kill previous instances
pkill -f "python3 scripts/speak_daemon.py" || true

echo "Starting Voice Daemon (REST Mode)..."
nohup python3 scripts/speak_daemon.py > daemon_safe.log 2>&1 &
PID=$!
echo "Voice Daemon PID: $PID"
echo "Log file: daemon_safe.log"
