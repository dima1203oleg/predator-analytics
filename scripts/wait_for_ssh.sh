#!/bin/bash
HOST="194.177.1.240"
PORT="6666"
TIMEOUT=120
START_TIME=$(date +%s)

echo "⏳ Waiting for SSH at $HOST:$PORT for $TIMEOUT seconds..."

while true; do
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))

    if [ $ELAPSED -ge $TIMEOUT ]; then
        echo "❌ Timeout waiting for server."
        exit 1
    fi

    if nc -z -w 2 $HOST $PORT 2>/dev/null; then
        echo "✅ Port $PORT is OPEN!"
        echo "Attempting SSH connection..."
        ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -p $PORT dima@$HOST "echo '✅ Server is UP!'" && exit 0
        echo "⚠️  Port is open but SSH Failed. Retrying..."
    fi

    echo -n "."
    sleep 5
done
