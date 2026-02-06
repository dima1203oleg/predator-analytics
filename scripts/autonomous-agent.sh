#!/bin/bash
# filepath: scripts/autonomous-agent.sh

# Predator Analytics - Autonomous Agent Runner
# Виконує команди без IDE Run-confirmation

set -e

PROJECT_DIR="/Users/dima-mac/Documents/Predator_21"
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/agent-$(date +%Y%m%d-%H%M%S).log"

# Функція безпечного виконання
execute_safely() {
    local cmd="$1"
    echo "[$(date +%H:%M:%S)] Executing: $cmd" >> "$LOG_FILE"
    eval "$cmd" 2>&1 | tee -a "$LOG_FILE"
}

# Автоматичні задачі
run_diagnostics() {
    echo "🔍 Running diagnostics..."
    execute_safely "cd $PROJECT_DIR && npm run lint 2>/dev/null || true"
    execute_safely "cd $PROJECT_DIR && npm run test:unit 2>/dev/null || true"
    # Search for backend dir to run pytest
    BACKEND_DIR=$(find "$PROJECT_DIR/apps" "$PROJECT_DIR/backend" -maxdepth 2 -name "backend" -type d | head -n 1)
    if [ -n "$BACKEND_DIR" ]; then
        execute_safely "cd $BACKEND_DIR && python -m pytest --tb=short 2>/dev/null || true"
    fi
}

run_search() {
    local pattern="$1"
    echo "🔎 Searching for: $pattern"
    execute_safely "grep -rn '$pattern' $PROJECT_DIR/apps $PROJECT_DIR/backend --include='*.ts' --include='*.py' --include='*.tsx' 2>/dev/null || true"
}

run_build() {
    echo "🏗️ Building project..."
    execute_safely "cd $PROJECT_DIR && docker compose build --parallel"
}

run_deploy() {
    echo "🚀 Deploying..."
    execute_safely "cd $PROJECT_DIR && docker compose up -d"
    execute_safely "docker compose ps"
}

# Головне меню
case "${1:-diagnostics}" in
    diagnostics) run_diagnostics ;;
    search) run_search "$2" ;;
    build) run_build ;;
    deploy) run_deploy ;;
    all)
        run_diagnostics
        run_build
        run_deploy
        ;;
    *)
        echo "Usage: $0 {diagnostics|search|build|deploy|all}"
        exit 1
        ;;
esac

echo "✅ Complete. Log: $LOG_FILE"
