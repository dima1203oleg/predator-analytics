#!/bin/bash
# 🔗 PREDATOR Analytics v56.1 — NGROK Tunnel Manager
# Manages ngrok tunnels for accessing NVIDIA server (194.177.1.240:6666)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TUNNEL_INFO_FILE="/tmp/ngrok-predator-tunnel.info"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_section() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

check_ngrok() {
    if ! command -v ngrok &> /dev/null; then
        log_error "ngrok is not installed"
        log_info "Install with: brew install ngrok/ngrok/ngrok"
        exit 1
    fi
    log_success "ngrok is installed: $(ngrok version)"
}

check_ssh_key() {
    if [ ! -f ~/.ssh/id_ed25519_dev ]; then
        log_error "SSH key ~/.ssh/id_ed25519_dev not found"
        exit 1
    fi
    log_success "SSH key found: ~/.ssh/id_ed25519_dev"
}

start_tunnel() {
    local local_host="$1"
    local local_port="$2"
    local tunnel_name="$3"
    
    log_section "🔗 Starting NGROK Tunnel"
    log_info "Target: $local_host:$local_port"
    log_info "Tunnel: $tunnel_name"
    
    # Start ngrok in background
    log_info "Starting ngrok agent..."
    ngrok tcp $local_port --authtoken="$(cat ~/.ngrok2/ngrok.yml 2>/dev/null | grep authtoken | cut -d' ' -f2)" &
    NGROK_PID=$!
    
    sleep 2
    
    # Check if ngrok started successfully
    if ! ps -p $NGROK_PID > /dev/null; then
        log_error "Failed to start ngrok"
        exit 1
    fi
    
    log_success "ngrok started (PID: $NGROK_PID)"
}

get_tunnel_info() {
    # Query ngrok API for tunnel info
    local tunnel_json=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null)
    
    if [ -z "$tunnel_json" ]; then
        log_error "Failed to connect to ngrok API (http://localhost:4040)"
        log_warning "Make sure ngrok is running and API is accessible"
        return 1
    fi
    
    # Extract tunnel info
    local public_url=$(echo "$tunnel_json" | jq -r '.tunnels[0].public_url' 2>/dev/null)
    
    if [ -z "$public_url" ] || [ "$public_url" = "null" ]; then
        log_error "No active tunnels found"
        return 1
    fi
    
    # Parse URL
    local public_host=$(echo "$public_url" | sed 's|tcp://||' | cut -d: -f1)
    local public_port=$(echo "$public_url" | rev | cut -d: -f1 | rev)
    
    # Save info
    cat > "$TUNNEL_INFO_FILE" << EOF
NGROK_URL=$public_url
NGROK_HOST=$public_host
NGROK_PORT=$public_port
NGROK_PID=$NGROK_PID
CREATED_AT=$(date)
TARGET=194.177.1.240:6666
REMOTE_USER=dima
LOCAL_KEY=~/.ssh/id_ed25519_dev
EOF
    
    log_success "Tunnel info saved to: $TUNNEL_INFO_FILE"
    
    echo "$public_host"
    echo "$public_port"
}

display_tunnel_info() {
    if [ ! -f "$TUNNEL_INFO_FILE" ]; then
        log_error "Tunnel info file not found: $TUNNEL_INFO_FILE"
        return 1
    fi
    
    log_section "📡 Active Tunnel Information"
    
    source "$TUNNEL_INFO_FILE"
    
    log_success "Tunnel is active!"
    echo ""
    log_info "Public URL: $NGROK_URL"
    echo ""
    
    log_section "🔐 Connection Methods"
    echo ""
    echo "1️⃣  Direct SSH:"
    echo "   ssh -p $NGROK_PORT -i ~/.ssh/id_ed25519_dev dima@$NGROK_HOST"
    echo ""
    
    echo "2️⃣  Add to SSH Config (~/.ssh/config):"
    echo "   Host predator-ngrok"
    echo "       HostName $NGROK_HOST"
    echo "       Port $NGROK_PORT"
    echo "       User dima"
    echo "       IdentityFile ~/.ssh/id_ed25519_dev"
    echo ""
    echo "   Then: ssh predator-ngrok"
    echo ""
    
    echo "3️⃣  For SCP transfers:"
    echo "   scp -P $NGROK_PORT -i ~/.ssh/id_ed25519_dev file.txt dima@$NGROK_HOST:/tmp/"
    echo ""
    
    echo "4️⃣  For Port Forwarding (tunnel to backend):"
    echo "   ssh -p $NGROK_PORT -i ~/.ssh/id_ed25519_dev -L 8090:localhost:8090 dima@$NGROK_HOST"
    echo "   Then access: http://localhost:8090/api/v1/health"
    echo ""
}

wait_for_tunnel() {
    log_info "Waiting for ngrok tunnel to be ready..."
    
    local max_attempts=10
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:4040/api/tunnels &>/dev/null; then
            local tunnel_count=$(curl -s http://localhost:4040/api/tunnels | jq '.tunnels | length' 2>/dev/null || echo 0)
            if [ "$tunnel_count" -gt 0 ]; then
                log_success "Tunnel is ready"
                return 0
            fi
        fi
        
        attempt=$((attempt + 1))
        sleep 1
    done
    
    log_error "Tunnel did not become ready within timeout"
    return 1
}

# === Main Commands ===

case "${1:-help}" in
    start)
        check_ngrok
        check_ssh_key
        
        local_host="${2:-194.177.1.240}"
        local_port="${3:-6666}"
        
        if [ "$local_host" = "localhost" ]; then
            log_warning "Starting local ngrok tunnel (for development)"
        fi
        
        start_tunnel "$local_host" "$local_port"
        wait_for_tunnel
        display_tunnel_info
        
        log_section "⏸️  Tunnel is Running"
        log_info "Press Ctrl+C to stop"
        
        wait $NGROK_PID
        ;;
        
    info)
        display_tunnel_info
        ;;
        
    ssh)
        if [ ! -f "$TUNNEL_INFO_FILE" ]; then
            log_error "No active tunnel found. Start tunnel first:"
            log_info "$0 start"
            exit 1
        fi
        
        source "$TUNNEL_INFO_FILE"
        
        log_info "Connecting to $NGROK_HOST:$NGROK_PORT..."
        ssh -p "$NGROK_PORT" -i ~/.ssh/id_ed25519_dev dima@"$NGROK_HOST" "${@:2}"
        ;;
        
    scp)
        if [ ! -f "$TUNNEL_INFO_FILE" ]; then
            log_error "No active tunnel found. Start tunnel first:"
            log_info "$0 start"
            exit 1
        fi
        
        source "$TUNNEL_INFO_FILE"
        
        if [ $# -lt 2 ]; then
            log_error "Usage: $0 scp <local_file> <remote_path>"
            exit 1
        fi
        
        log_info "Copying $2 to remote:$3..."
        scp -P "$NGROK_PORT" -i ~/.ssh/id_ed25519_dev "$2" "dima@$NGROK_HOST:$3"
        ;;
        
    forward)
        if [ ! -f "$TUNNEL_INFO_FILE" ]; then
            log_error "No active tunnel found. Start tunnel first:"
            log_info "$0 start"
            exit 1
        fi
        
        source "$TUNNEL_INFO_FILE"
        
        local_port="${2:-8090}"
        remote_host="${3:-localhost}"
        remote_port="${4:-8090}"
        
        log_section "🔀 Setting up Port Forward"
        log_info "Local:  127.0.0.1:$local_port"
        log_info "Remote: $remote_host:$remote_port"
        log_info "Press Ctrl+C to stop"
        
        ssh -p "$NGROK_PORT" \
            -i ~/.ssh/id_ed25519_dev \
            -L "$local_port:$remote_host:$remote_port" \
            -N dima@"$NGROK_HOST"
        ;;
        
    deploy)
        if [ ! -f "$TUNNEL_INFO_FILE" ]; then
            log_error "No active tunnel found. Start tunnel first:"
            log_info "$0 start"
            exit 1
        fi
        
        source "$TUNNEL_INFO_FILE"
        
        log_section "🚀 Deploying PREDATOR Backend via NGROK"
        
        ssh -p "$NGROK_PORT" \
            -i ~/.ssh/id_ed25519_dev \
            dima@"$NGROK_HOST" << 'DEPLOY_SCRIPT'

echo "📦 Starting backend deployment..."

# Navigate to project
cd /app/predator_21 || cd ~/predator_21 || mkdir -p ~/predator_21

# Switch to remote config
if [ -f "services/core-api/.env.remote" ]; then
    cp services/core-api/.env services/core-api/.env.local.backup
    cp services/core-api/.env.remote services/core-api/.env
    echo "✅ Switched to remote config"
fi

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Verify
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🏥 API Health Check:"
curl -s http://localhost:8090/api/v1/health | jq .

DEPLOY_SCRIPT
        ;;
        
    *)
        log_section "🔗 PREDATOR Analytics — NGROK Tunnel Manager"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  start [host] [port]      Start ngrok tunnel (default: 194.177.1.240:6666)"
        echo "  info                     Show current tunnel info"
        echo "  ssh [cmd...]             SSH to remote server"
        echo "  scp <file> <remote_path> Copy file to remote"
        echo "  forward [ports...]       Setup port forwarding"
        echo "  deploy                   Deploy backend via tunnel"
        echo "  help                     Show this message"
        echo ""
        echo "Examples:"
        echo "  $0 start                          # Start tunnel to 194.177.1.240:6666"
        echo "  $0 start localhost 6666           # Start local tunnel (for testing)"
        echo "  $0 info                           # Show tunnel details"
        echo "  $0 ssh whoami                     # Execute command on remote"
        echo "  $0 forward 8090 localhost 8090    # Forward local:8090 → remote:8090"
        echo "  $0 deploy                         # Deploy backend services"
        echo ""
        ;;
esac
