#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🧲 ANTIGRAVITY SELF-HEALING SCRIPT
# ═══════════════════════════════════════════════════════════════
# Auto-recovers ALL services. Runs forever. No human needed.
# ═══════════════════════════════════════════════════════════════

set -e

# ════════════════════════════════════════════════════════════════
# CONFIGURATION
# ════════════════════════════════════════════════════════════════

PROJECT_ROOT="/Users/dima-mac/Documents/Predator_21"
BACKEND_DIR="$PROJECT_ROOT/apps/backend"
FRONTEND_DIR="$PROJECT_ROOT/apps/frontend"
LOG_FILE="/tmp/self_healing.log"
CHECK_INTERVAL=30

# ════════════════════════════════════════════════════════════════
# COLORS
# ════════════════════════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ════════════════════════════════════════════════════════════════
# LOGGING
# ════════════════════════════════════════════════════════════════

log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOG_FILE"
}

log_ok() {
    log "${GREEN}✅ $1${NC}"
}

log_warn() {
    log "${YELLOW}⚠️ $1${NC}"
}

log_error() {
    log "${RED}❌ $1${NC}"
}

log_info() {
    log "${BLUE}ℹ️ $1${NC}"
}

# ════════════════════════════════════════════════════════════════
# HEALTH CHECKS
# ════════════════════════════════════════════════════════════════

check_backend() {
    curl -s http://localhost:8000/health > /dev/null 2>&1
    return $?
}

check_frontend() {
    lsof -i :3000 > /dev/null 2>&1
    return $?
}

check_ngrok() {
    curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1
    return $?
}

check_docker() {
    docker ps > /dev/null 2>&1
    return $?
}

# ════════════════════════════════════════════════════════════════
# RESTART FUNCTIONS
# ════════════════════════════════════════════════════════════════

restart_backend() {
    log_info "Restarting backend..."
    pkill -f "run_v25_bot.py" 2>/dev/null || true
    sleep 2
    cd "$BACKEND_DIR"
    nohup python run_v25_bot.py > /tmp/backend.log 2>&1 &
    sleep 5
    if check_backend; then
        log_ok "Backend restarted successfully"
        return 0
    else
        log_error "Backend restart failed"
        return 1
    fi
}

restart_frontend() {
    log_info "Restarting frontend..."
    pkill -f "vite" 2>/dev/null || true
    sleep 2
    cd "$FRONTEND_DIR"
    nohup npm run dev > /tmp/frontend.log 2>&1 &
    sleep 5
    if check_frontend; then
        log_ok "Frontend restarted successfully"
        return 0
    else
        log_error "Frontend restart failed"
        return 1
    fi
}

restart_ngrok() {
    log_info "Restarting ngrok..."
    pkill -f "ngrok" 2>/dev/null || true
    sleep 2
    nohup ngrok http 8000 --log=stdout > /tmp/ngrok.log 2>&1 &
    sleep 5
    if check_ngrok; then
        log_ok "Ngrok restarted successfully"
        return 0
    else
        log_error "Ngrok restart failed"
        return 1
    fi
}

restart_docker_containers() {
    log_info "Restarting Docker containers..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.yml" restart 2>/dev/null || \
    docker compose -f "$PROJECT_ROOT/docker-compose.yml" restart 2>/dev/null || \
    true
}

# ════════════════════════════════════════════════════════════════
# MAIN HEALING LOOP
# ════════════════════════════════════════════════════════════════

main_loop() {
    local iteration=0

    while true; do
        iteration=$((iteration + 1))
        log_info "═══════════════════════════════════════════════════════════════"
        log_info "♾️ Self-Healing Iteration #$iteration"
        log_info "═══════════════════════════════════════════════════════════════"

        # Check Backend
        if check_backend; then
            log_ok "Backend: HEALTHY"
        else
            log_warn "Backend: DOWN — Restarting..."
            restart_backend
        fi

        # Check Frontend
        if check_frontend; then
            log_ok "Frontend: HEALTHY"
        else
            log_warn "Frontend: DOWN — Restarting..."
            restart_frontend
        fi

        # Check Ngrok
        if check_ngrok; then
            log_ok "Ngrok: HEALTHY"
        else
            log_warn "Ngrok: DOWN — Restarting..."
            restart_ngrok
        fi

        # Check Docker (optional)
        if check_docker; then
            log_ok "Docker: RUNNING"
        fi

        log_info "♾️ Iteration #$iteration complete. Sleeping ${CHECK_INTERVAL}s..."
        sleep $CHECK_INTERVAL
    done
}

# ════════════════════════════════════════════════════════════════
# SIGNAL TRAP (prevent accidental stop)
# ════════════════════════════════════════════════════════════════

trap '' SIGINT SIGTERM

# ════════════════════════════════════════════════════════════════
# ENTRY POINT
# ════════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════════════"
echo "🧲 ANTIGRAVITY SELF-HEALING — GODMODE"
echo "═══════════════════════════════════════════════════════════════"
echo "⚡ System will NEVER stop"
echo "⚡ Auto-recovery ENABLED"
echo "⚡ Check interval: ${CHECK_INTERVAL}s"
echo "═══════════════════════════════════════════════════════════════"

# Start the loop
main_loop
