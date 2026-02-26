#!/usr/bin/env bash
# Robust OMNI watchdog with lockfile, PID checks, cleanup, and logging.
PROJ="/Users/dima-mac/Documents/Predator_21"
SCRIPT="$PROJ/.autopilot/predator_omni.py"
VENV_PY="$PROJ/.autopilot/venv/bin/python"
LOGFILE="$PROJ/.autopilot/omni.log"
LOCKFILE="$PROJ/.autopilot/omni_watchdog.lock"
OMNI_PIDFILE="$PROJ/.autopilot/omni.pid"

# --- Aggressive cleanup of leftover processes and stale files ------------------
cleanup_old() {
    # kill any other run_omni.sh processes (except ourself)
    ps -ef | grep '[r]un_omni.sh' | awk '{print $2}' | while read -r pid; do
        if [ "$pid" != "$$" ]; then
            echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ') 🧹 killing stale watchdog pid=$pid" >> "$LOGFILE"
            kill -9 "$pid" 2>/dev/null || true
        fi
    done

    # kill any orphaned predator_omni.py processes
    ps -ef | grep '[p]redator_omni.py' | awk '{print $2}' | while read -r pid; do
        echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ') 🧹 killing stale OMNI pid=$pid" >> "$LOGFILE"
        kill -9 "$pid" 2>/dev/null || true
    done

    # remove stale lock/pid files if empty or pointing to dead processes
    if [ -f "$LOCKFILE" ]; then
        oldpid=$(cat "$LOCKFILE" 2>/dev/null || echo "")
        if [ -z "$oldpid" ] || ! kill -0 "$oldpid" 2>/dev/null; then
            echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ') 🧹 removing stale lockfile" >> "$LOGFILE"
            rm -f "$LOCKFILE" || true
        fi
    fi
    if [ -f "$OMNI_PIDFILE" ]; then
        oldpid=$(cat "$OMNI_PIDFILE" 2>/dev/null || echo "")
        if [ -z "$oldpid" ] || ! kill -0 "$oldpid" 2>/dev/null; then
            echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ') 🧹 removing stale omni pidfile" >> "$LOGFILE"
            rm -f "$OMNI_PIDFILE" || true
        fi
    fi
}

# perform cleanup and rotate logs
cleanup_old
if [ -f "$LOGFILE" ] && [ -s "$LOGFILE" ]; then
    ts=$(date -u +%Y%m%dT%H%M%SZ)
    mv "$LOGFILE" "$LOGFILE.$ts" 2>/dev/null || true
fi

# ensure only one watchdog is running
if [ -f "$LOCKFILE" ]; then
    oldpid=$(cat "$LOCKFILE" 2>/dev/null || echo "")
    if [ -n "$oldpid" ] && kill -0 "$oldpid" 2>/dev/null; then
        echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ') ℹ️ Watchdog already running (pid=$oldpid). Exiting." >> "$LOGFILE"
        exit 0
    else
        rm -f "$LOCKFILE" || true
    fi
fi

# write our PID and set trap to clean up and exit on signals
echo $$ > "$LOCKFILE"
trap 'rm -f "$LOCKFILE"; exit' EXIT HUP INT TERM

echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ') 🚀 PREDATOR OMNI Watchdog started" >> "$LOGFILE"
echo "📄 Log file: $LOGFILE"

MAX_RESTARTS=20
RESTART_COUNT=0

while true; do
    if [ "$RESTART_COUNT" -ge "$MAX_RESTARTS" ]; then
        echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ') 🛑 Max restarts ($MAX_RESTARTS) reached. Fatal failure." >> "$LOGFILE"
        exit 1
    fi

    if [ -f "$OMNI_PIDFILE" ]; then
        ompid=$(cat "$OMNI_PIDFILE" 2>/dev/null || echo "")
        if [ -n "$ompid" ] && kill -0 "$ompid" 2>/dev/null; then
            echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ') ⚠️ OMNI already running (pid=$ompid). Waiting before retry." >> "$LOGFILE"
            sleep 5
            continue
        else
            rm -f "$OMNI_PIDFILE" || true
        fi
    fi

    "$VENV_PY" "$SCRIPT" >> "$LOGFILE" 2>&1 &
    child=$!
    echo "$child" > "$OMNI_PIDFILE"
    c_ppid=$(ps -o ppid= -p "$child" 2>/dev/null | tr -d ' ' || echo "?")
    echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ') ▶️ Started OMNI (pid=$child, ppid=$c_ppid)" >> "$LOGFILE"

    wait "$child"
    exitcode=$?

    rm -f "$OMNI_PIDFILE" 2>/dev/null || true

    echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ') ⚠️ OMNI exited (code=$exitcode). Restarting... ($RESTART_COUNT/$MAX_RESTARTS)" >> "$LOGFILE"
    RESTART_COUNT=$((RESTART_COUNT+1))
    sleep 3
done
