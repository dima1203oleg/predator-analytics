#!/bin/bash
# =============================================================================
# Predator Analytics - Ngrok Monitor with Telegram Notifications
# =============================================================================
# This script monitors the ngrok tunnel and sends Telegram notifications
# when the URL changes or the tunnel goes down.
# =============================================================================

# Configuration
BOT_TOKEN="7879930188:AAGH8OYUjfun382FCEPowrC0_WKjwVRpcBQ"
CHAT_ID="${TELEGRAM_CHAT_ID:-}"  # Set this or pass as environment variable
NGROK_API="http://127.0.0.1:4040/api/tunnels"
CHECK_INTERVAL=30  # seconds
STATE_FILE="/tmp/ngrok_monitor_state.txt"
LOG_FILE="/tmp/ngrok_monitor.log"
AUTO_DEPLOY_ON_UP=${AUTO_DEPLOY_ON_UP:-false}
ARGOCD_NVIDIA_URL=${ARGOCD_NVIDIA_URL:-}
ARGOCD_NVIDIA_TOKEN=${ARGOCD_NVIDIA_TOKEN:-}
if [[ "${ARGOCD_INSECURE:-false}" =~ ^(1|true|yes)$ ]]; then
    CURL_INSECURE="-k"
else
    CURL_INSECURE=""
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} - $1" | tee -a "$LOG_FILE"
}

send_telegram() {
    local message="$1"
    if [ -z "$CHAT_ID" ]; then
        log "${YELLOW}⚠️  CHAT_ID not set. Message: $message${NC}"
        return 1
    fi
    
    curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
        -d "chat_id=${CHAT_ID}" \
        -d "text=${message}" \
        -d "parse_mode=HTML" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log "${GREEN}✅ Telegram notification sent${NC}"
    else
        log "${RED}❌ Failed to send Telegram notification${NC}"
    fi
}

get_ngrok_url() {
    local url=$(curl -s "$NGROK_API" 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('tunnels'):
        print(data['tunnels'][0]['public_url'])
except:
    pass
" 2>/dev/null)
    echo "$url"
}

check_frontend_health() {
    local url="$1"
    if [ -z "$url" ]; then
        echo "down"
        return
    fi
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null)
    if [ "$status" = "200" ] || [ "$status" = "302" ]; then
        echo "up"
    else
        echo "down"
    fi
}

get_saved_state() {
    if [ -f "$STATE_FILE" ]; then
        cat "$STATE_FILE"
    else
        echo ""
    fi
}

save_state() {
    echo "$1" > "$STATE_FILE"
}

main() {
    log "${BLUE}🚀 Starting Ngrok Monitor for Predator Analytics${NC}"
    log "Check interval: ${CHECK_INTERVAL}s"
    
    if [ -z "$CHAT_ID" ]; then
        log "${YELLOW}⚠️  TELEGRAM_CHAT_ID not set. Run with: TELEGRAM_CHAT_ID=your_id $0${NC}"
        log "${YELLOW}   Get your Chat ID by messaging @userinfobot on Telegram${NC}"
    fi
    
    local prev_url=$(get_saved_state)
    local prev_status="unknown"
    
    while true; do
        local current_url=$(get_ngrok_url)
        local current_status="down"
        
        if [ -n "$current_url" ]; then
            current_status=$(check_frontend_health "$current_url")
        fi
        
        # Check if URL changed
        if [ "$current_url" != "$prev_url" ]; then
            if [ -n "$current_url" ]; then
                local message="🔄 <b>Predator Analytics URL Changed!</b>

🌐 <b>New URL:</b>
<code>${current_url}</code>

📊 Status: ${current_status}
🕐 Time: $(date '+%Y-%m-%d %H:%M:%S')

📱 <i>Open in browser to access dashboard</i>"
                
                log "${GREEN}🔄 URL changed: $current_url${NC}"
                send_telegram "$message"
            else
                local message="⚠️ <b>Predator Analytics Tunnel DOWN!</b>

❌ Ngrok tunnel is not running
🕐 Time: $(date '+%Y-%m-%d %H:%M:%S')

🔧 <i>Check if ngrok is running on the host</i>"
                
                log "${RED}⚠️ Ngrok tunnel is down${NC}"
                send_telegram "$message"
            fi
            save_state "$current_url"
            prev_url="$current_url"
        fi
        
        # Check if status changed
        if [ "$current_status" != "$prev_status" ] && [ "$prev_status" != "unknown" ]; then
            if [ "$current_status" = "up" ]; then
                local message="✅ <b>Predator Analytics is UP!</b>

🌐 URL: <code>${current_url}</code>
🕐 Time: $(date '+%Y-%m-%d %H:%M:%S')"
                
                log "${GREEN}✅ Frontend is UP${NC}"
                send_telegram "$message"
                # Optionally trigger ArgoCD sync automatically when service is back up
                if [ "${AUTO_DEPLOY_ON_UP,,}" = "true" ] && [ -n "$ARGOCD_NVIDIA_URL" ] && [ -n "$ARGOCD_NVIDIA_TOKEN" ]; then
                    log "🔁 AUTO_DEPLOY_ON_UP: triggering ArgoCD sync for predator-nvidia"
                    curl $CURL_INSECURE -sS -X POST "$ARGOCD_NVIDIA_URL/api/v1/applications/predator-nvidia/sync" \
                        -H "Authorization: Bearer $ARGOCD_NVIDIA_TOKEN" -H "Content-Type: application/json" -d '{}' || log "ArgoCD sync failed"
                fi
            elif [ "$current_status" = "down" ] && [ -n "$current_url" ]; then
                local message="🔴 <b>Predator Analytics Frontend DOWN!</b>

🌐 URL: <code>${current_url}</code>
🕐 Time: $(date '+%Y-%m-%d %H:%M:%S')

🔧 <i>Check Docker containers</i>"
                
                log "${RED}🔴 Frontend is DOWN${NC}"
                send_telegram "$message"
            fi
        fi
        
        prev_status="$current_status"
        
        # Status output
        if [ -n "$current_url" ]; then
            log "📊 URL: $current_url | Status: $current_status"
        else
            log "📊 Ngrok: Not running"
        fi
        
        sleep "$CHECK_INTERVAL"
    done
}

# Handle Ctrl+C
trap 'log "🛑 Monitor stopped"; exit 0' SIGINT SIGTERM

# Start monitoring
main
