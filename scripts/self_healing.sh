#!/bin/bash

# Запуск Python-скрипта для самовідновлення
python3 scripts/self_healing.py
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

# Автоматичний rollback при помилках
check_rollback() {
    if [ -f /tmp/rollback_flag ]; then
        echo "🔙 Виконую rollback до попередньої версії..."
        docker compose -f docker-compose.prod.yml pull
        docker compose -f docker-compose.prod.yml up -d --remove-orphans
        rm /tmp/rollback_flag
    fi
}

# Автоматичне оновлення агентів
check_agents() {
    if [ -f /tmp/update_agents ]; then
        echo "🔄 Оновлення автономних агентів..."
        docker compose -f docker-compose.prod.yml pull predator_telegram_bot
        docker compose -f docker-compose.prod.yml up -d predator_telegram_bot
        rm /tmp/update_agents
    fi
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
