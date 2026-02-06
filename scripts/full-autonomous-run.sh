#!/bin/bash
# PREDATOR v30 Autonomous Script
set -euo pipefail
PROJECT_DIR="$(pwd)"
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/autonomous_$TIMESTAMP.log"

log() { echo "[$(date +%H:%M:%S)] $1" | tee -a "$LOG_FILE"; }

log "🦅 PREDATOR AUTONOMOUS START"
log "Checking UI..."
if [ -d "apps/predator-analytics-ui" ]; then
    cd apps/predator-analytics-ui && npm run build --if-present
fi
log "✅ DONE"
