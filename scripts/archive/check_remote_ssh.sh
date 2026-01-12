#!/usr/bin/env bash
HOST=$1
PORT=${2:-22}
TIMEOUT=${3:-5}

if [ -z "$HOST" ]; then
  echo "Usage: $0 <host> [port] [timeout]"
  exit 1
fi

echo "Checking SSH connectivity to $HOST:$PORT (timeout ${TIMEOUT}s)..."
if nc -z -w "$TIMEOUT" "$HOST" "$PORT"; then
  echo "SUCCESS: $HOST:$PORT is reachable."
  exit 0
else
  echo "FAILURE: $HOST:$PORT is NOT reachable."
  exit 1
fi
