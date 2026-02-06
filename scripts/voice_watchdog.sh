#!/bin/bash
# PREDATOR V25 - Voice Service Watchdog & Guardian
# Цей скрипт запускає озвучку в захищеному REST режимі та автоматично перезапускає її при збоях.
# ВИКОРИСТОВУЄТЬСЯ: apps/predator-analytics-ui/src/hooks/useVoiceAssistant.ts (через speak_buffer.txt)

cd "$(dirname "$0")/.."

# 1. Конфігурація середовища (HARDENED)
export PYTHONPATH=$(pwd)/libs_local_v2
export REQUESTS_CA_BUNDLE=/etc/ssl/cert.pem
export SSL_CERT_FILE=/etc/ssl/cert.pem
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/keys/google-key.json"

LOG_FILE="/tmp/daemon_watchdog.log"
DAEMON_SCRIPT="scripts/speak_daemon.py"

echo "==== PREDATOR VOICE WATCHDOG v2.0 ====" > $LOG_FILE
echo "Started at $(date)" >> $LOG_FILE
echo "Mode: REST API (No gRPC)" >> $LOG_FILE
echo "Env: libs_local_v2" >> $LOG_FILE

# 2. Функція очищення
cleanup() {
    echo "Stopping Voice Daemon..."
    pkill -f "python3 $DAEMON_SCRIPT"
    exit 0
}
trap cleanup SIGINT SIGTERM

# 3. Головний цикл нагляду (Watchdog Loop)
while true; do
    # Перевірка чи запущений процес
    if ! pgrep -f "python3 $DAEMON_SCRIPT" > /dev/null; then
        echo "[$(date)] ⚠️  Voice Daemon not running. Starting..." >> $LOG_FILE

        # Kill any zombie instances just in case
        pkill -f "python3 $DAEMON_SCRIPT" || true

        # Start Daemon in background
        nohup python3 $DAEMON_SCRIPT >> $LOG_FILE 2>&1 &
        PID=$!

        echo "[$(date)] ✅ Started Voice Daemon (PID: $PID)" >> $LOG_FILE

        # Give it a moment to stabilize
        sleep 2
    fi

    # 4. Перевірка 'зомбі' статусу (якщо процес є, але завис)
    # Перевіряємо чи файл буфера не "застряг" (не змінювався більше 30 секунд, але містить текст)
    if [ -f "speak_buffer.txt" ] && [ -s "speak_buffer.txt" ]; then
        # Check modification time
        LAST_MOD=$(stat -f %m speak_buffer.txt)
        NOW=$(date +%s)
        DIFF=$(($NOW - $LAST_MOD))

        if [ $DIFF -gt 30 ]; then
             echo "[$(date)] 🛑 Buffer stuck for $DIFF seconds. Force restarting daemon..." >> $LOG_FILE
             pkill -f "python3 $DAEMON_SCRIPT"
             # Loop will catch it next iteration
        fi
    fi

    # Перевірка кожні 5 секунд
    sleep 5
done
