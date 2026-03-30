#!/bin/bash
# 🔗 PREDATOR Analytics — Моніторинг NGROK Тунелів
# Автоматично виявляє активні тунелі через ngrok API
# та оновлює SSH конфіг і tunnel info файл

set -euo pipefail

# ─── Конфігурація ───
NGROK_API_KEY="3Bfn7Zik2Gs41xIiNLZHcIxKBdi_4x1tUpeVMrUMJpQ4a17Gu"
SSH_CONFIG="$HOME/.ssh/config"
TUNNEL_INFO="/tmp/ngrok-predator-tunnel.info"
POLL_INTERVAL="${1:-15}"  # секунди між перевірками (default: 15)
TELEMETRY_LOG="/tmp/ngrok-telemetry.log"
MEMORY_FILE="/tmp/ngrok-memory.json"

# ─── Кольори ───
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}ℹ️  $1${NC}"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" >> "$TELEMETRY_LOG"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" >> "$TELEMETRY_LOG"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$TELEMETRY_LOG"; }
log_error()   { echo -e "${RED}❌ $1${NC}"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$TELEMETRY_LOG"; }

# ─── BMO Memory (Proactive Skills) ───
save_memory() {
    local host="$1"
    local port="$2"
    echo "{\"last_host\": \"$host\", \"last_port\": \"$port\", \"last_seen\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$MEMORY_FILE"
}

try_legacy_recon() {
    if [ -f "$MEMORY_FILE" ]; then
        local lh lp
        lh=$(jq -r '.last_host' "$MEMORY_FILE")
        lp=$(jq -r '.last_port' "$MEMORY_FILE")
        if [ "$lh" != "null" ] && [ -n "$lh" ]; then
            log_info "BMO Recall: Пробую старий хост $lh:$lp..."
            if test_ssh "$lh" "$lp"; then
                log_success "🔥 Знайшов! Старий тунель все ще активний."
                update_ssh_config "$lh" "$lp"
                return 0
            fi
        fi
    fi
    return 1
}

# ─── Отримати активні тунелі через ngrok API ───
get_tunnels() {
    curl -s -X GET "https://api.ngrok.com/tunnels" \
        -H "Authorization: Bearer $NGROK_API_KEY" \
        -H "ngrok-version: 2" 2>/dev/null
}

get_endpoints() {
    curl -s -X GET "https://api.ngrok.com/endpoints" \
        -H "Authorization: Bearer $NGROK_API_KEY" \
        -H "ngrok-version: 2" 2>/dev/null
}

get_agents() {
    curl -s -X GET "https://api.ngrok.com/agent_sessions" \
        -H "Authorization: Bearer $NGROK_API_KEY" \
        -H "ngrok-version: 2" 2>/dev/null
}

# ─── Парсинг TCP тунелю (SSH) ───
parse_tcp_tunnel() {
    local endpoints_json="$1"
    
    # Шукаємо TCP endpoint
    local tcp_url
    tcp_url=$(echo "$endpoints_json" | jq -r '.endpoints[] | select(.proto == "tcp") | .public_url' 2>/dev/null | head -1)
    
    if [ -n "$tcp_url" ] && [ "$tcp_url" != "null" ]; then
        echo "$tcp_url"
        return 0
    fi
    return 1
}

# ─── Парсинг HTTPS тунелю (HTTP) ───
parse_https_tunnel() {
    local endpoints_json="$1"
    
    local https_url
    https_url=$(echo "$endpoints_json" | jq -r '.endpoints[] | select(.proto == "https") | .public_url' 2>/dev/null | head -1)
    
    if [ -n "$https_url" ] && [ "$https_url" != "null" ]; then
        echo "$https_url"
        return 0
    fi
    return 1
}

# ─── Оновити SSH конфіг ───
update_ssh_config() {
    local host="$1"
    local port="$2"
    
    # Перевіримо чи є блок predator-ngrok
    if grep -q "Host predator-ngrok" "$SSH_CONFIG" 2>/dev/null; then
        # Оновити існуючий
        # macOS sed потребує -i ''
        sed -i '' "/Host predator-ngrok/,/IdentityFile/ {
            s/HostName .*/HostName $host/
            s/Port .*/Port $port/
        }" "$SSH_CONFIG"
        log_success "SSH конфіг оновлено: predator-ngrok → $host:$port"
    else
        # Додати новий
        cat >> "$SSH_CONFIG" <<EOF

Host predator-ngrok
    HostName $host
    Port $port
    User dima
    IdentityFile ~/.ssh/id_ed25519_dev
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
EOF
        log_success "SSH конфіг додано: predator-ngrok → $host:$port"
    fi
}

# ─── Зберегти tunnel info ───
save_tunnel_info() {
    local tcp_url="$1"
    local https_url="$2"
    local host="$3"
    local port="$4"
    
    cat > "$TUNNEL_INFO" <<EOF
# PREDATOR NGROK Tunnel Info — Auto-generated
NGROK_TCP_URL=$tcp_url
NGROK_HTTPS_URL=$https_url
NGROK_HOST=$host
NGROK_PORT=$port
REMOTE_USER=dima
LOCAL_KEY=~/.ssh/id_ed25519_dev
UPDATED_AT=$(date '+%Y-%m-%d %H:%M:%S')
EOF
    log_info "Tunnel info → $TUNNEL_INFO"
}

# ─── Тест SSH з'єднання ───
test_ssh() {
    local host="$1"
    local port="$2"
    
    log_info "Тестую SSH $host:$port..."
    
    if ssh -o ConnectTimeout=5 \
           -o StrictHostKeyChecking=no \
           -o UserKnownHostsFile=/dev/null \
           -p "$port" \
           -i ~/.ssh/id_ed25519_dev \
           "dima@$host" whoami 2>/dev/null; then
        return 0
    fi
    return 1
}

# ─── Головна команда: одноразова перевірка ───
check_once() {
    echo ""
    echo -e "${CYAN}━━━ NGROK Status Check [$(date '+%H:%M:%S')] ━━━${NC}"
    
    # Перевірити endpoints
    local endpoints
    endpoints=$(get_endpoints)
    
    local count
    count=$(echo "$endpoints" | jq '.endpoints | length' 2>/dev/null || echo 0)
    
    if [ "$count" = "0" ] || [ "$count" = "" ]; then
        log_warning "Активних тунелів: 0 (endpoint offline)"
        
        # Перевірити agents
        local agents
        agents=$(get_agents)
        local agent_count
        agent_count=$(echo "$agents" | jq '.agent_sessions | length' 2>/dev/null || echo 0)
        
        if [ "$agent_count" != "0" ] && [ "$agent_count" != "" ]; then
            log_info "Знайдено $agent_count активних ngrok agent(ів) — тунелі ще не створені"
        else
            log_warning "Немає активних ngrok agent sessions"
            try_legacy_recon || true
        fi
        return 1
    fi
    
    log_success "Знайдено $count активних endpoint(ів)"
    
    # Парсити тунелі
    local tcp_url=""
    local https_url=""
    
    tcp_url=$(parse_tcp_tunnel "$endpoints" || true)
    https_url=$(parse_https_tunnel "$endpoints" || true)
    
    if [ -n "$tcp_url" ]; then
        log_success "SSH тунель: $tcp_url"
        
        # Парсити host і port
        local host port
        host=$(echo "$tcp_url" | sed 's|tcp://||' | cut -d: -f1)
        port=$(echo "$tcp_url" | rev | cut -d: -f1 | rev)
        
        # Оновити SSH конфіг
        update_ssh_config "$host" "$port"
        
        # Зберегти info
        save_tunnel_info "$tcp_url" "$https_url" "$host" "$port"
        
        # BMO Memory
        save_memory "$host" "$port"
        
        # Тестувати SSH
        if test_ssh "$host" "$port"; then
            log_success "SSH працює! Підключайтесь: ssh predator-ngrok"
        else
            log_warning "SSH endpoint є, але з'єднання не вдалося (сервер може завантажуватись)"
        fi
    fi
    
    if [ -n "$https_url" ]; then
        log_success "HTTP тунель: $https_url"
    fi
    
    return 0
}

# ─── Головна команда: моніторинг (poll) ───
monitor() {
    echo -e "${CYAN}🦅 PREDATOR ngrok Monitor${NC}"
    echo -e "${CYAN}   Перевірка кожні ${POLL_INTERVAL}с. Ctrl+C для виходу.${NC}"
    
    local was_online=false
    
    while true; do
        if check_once; then
            if [ "$was_online" = false ]; then
                # Тунель з'явився — повідомити
                echo ""
                echo -e "${GREEN}🎉 ═══════════════════════════════════════${NC}"
                echo -e "${GREEN}   ТУНЕЛЬ АКТИВНИЙ! ssh predator-ngrok  ${NC}"
                echo -e "${GREEN}═══════════════════════════════════════════${NC}"
                
                # macOS notification
                osascript -e 'display notification "Тунель активний! ssh predator-ngrok" with title "🦅 PREDATOR" sound name "Glass"' 2>/dev/null || true
            fi
            was_online=true
        else
            was_online=false
        fi
        
        sleep "$POLL_INTERVAL"
    done
}

# ─── CLI ───
case "${1:-check}" in
    check)
        check_once
        ;;
    monitor|watch)
        POLL_INTERVAL="${2:-15}"
        monitor
        ;;
    test-ssh)
        if [ -f "$TUNNEL_INFO" ]; then
            source "$TUNNEL_INFO"
            test_ssh "$NGROK_HOST" "$NGROK_PORT"
        else
            log_error "Tunnel info не знайдено. Спочатку: $0 check"
        fi
        ;;
    *)
        echo "Використання: $0 {check|monitor [інтервал]|test-ssh}"
        echo ""
        echo "  check          — одноразова перевірка"
        echo "  monitor [sec]  — безперервний моніторинг (default: 15с)"
        echo "  test-ssh       — тестувати SSH з'єднання"
        ;;
esac
