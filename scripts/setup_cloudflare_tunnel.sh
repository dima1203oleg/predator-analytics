#!/bin/bash
# =============================================================================
# setup_cloudflare_tunnel.sh — Налаштування Cloudflare Tunnel для SSH
# 
# Використання:
#   curl -sSL https://raw.githubusercontent.com/dima1203oleg/predator-analytics/main/scripts/setup_cloudflare_tunnel.sh | bash
#   або
#   ./scripts/setup_cloudflare_tunnel.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

TUNNEL_NAME="${1:-predator-ssh}"
CLOUDFLARED_CONFIG="$HOME/.cloudflared/config.yml"

echo "=============================================="
echo "  Cloudflare Tunnel Setup for Predator SSH"
echo "=============================================="
echo ""

# Крок 1: Перевірка чи cloudflared встановлено
log_step "Крок 1: Перевірка cloudflared"
if command -v cloudflared &> /dev/null; then
    log_info "cloudflared вже встановлено: $(cloudflared --version)"
else
    log_info "Встановлюю cloudflared..."
    
    if [[ "$(uname)" == "Darwin" ]]; then
        # macOS
        brew install cloudflared
    elif [[ -f /etc/debian_version ]]; then
        # Debian/Ubuntu
        wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -O /tmp/cloudflared.deb
        sudo dpkg -i /tmp/cloudflared.deb
        rm /tmp/cloudflared.deb
    elif [[ -f /etc/redhat-release ]]; then
        # RHEL/CentOS
        wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.rpm -O /tmp/cloudflared.rpm
        sudo rpm -i /tmp/cloudflared.rpm
        rm /tmp/cloudflared.rpm
    else
        log_error "Невідома ОС. Встановіть cloudflared вручну."
        exit 1
    fi
    
    log_info "cloudflared встановлено!"
fi

# Крок 2: Авторизація
log_step "Крок 2: Авторизація в Cloudflare"
if [[ -f "$HOME/.cloudflared/cert.pem" ]]; then
    log_info "Вже авторизовано в Cloudflare"
else
    log_info "Відкриваю браузер для авторизації..."
    cloudflared tunnel login
fi

# Крок 3: Створення тунелю
log_step "Крок 3: Створення тунелю '$TUNNEL_NAME'"
if cloudflared tunnel list 2>/dev/null | grep -q "$TUNNEL_NAME"; then
    log_info "Тунель '$TUNNEL_NAME' вже існує"
    TUNNEL_UUID=$(cloudflared tunnel list 2>/dev/null | grep "$TUNNEL_NAME" | awk '{print $1}')
else
    cloudflared tunnel create "$TUNNEL_NAME"
    TUNNEL_UUID=$(cloudflared tunnel list 2>/dev/null | grep "$TUNNEL_NAME" | awk '{print $1}')
    log_info "Тунель створено з UUID: $TUNNEL_UUID"
fi

# Крок 4: Створення конфігурації
log_step "Крок 4: Створення конфігурації"
mkdir -p "$HOME/.cloudflared"

if [[ ! -f "$CLOUDFLARED_CONFIG" ]]; then
    cat > "$CLOUDFLARED_CONFIG" << EOF
# Cloudflare Tunnel Configuration
# Generated: $(date)

tunnel: $TUNNEL_UUID
credentials-file: $HOME/.cloudflared/$TUNNEL_UUID.json

ingress:
  # SSH доступ (порт 22)
  - hostname: ssh-predator.example.com
    service: ssh://localhost:22
  
  # Backend API (порт 8000)
  - hostname: api-predator.example.com
    service: http://localhost:8000
  
  # Frontend (порт 5173)
  - hostname: app-predator.example.com
    service: http://localhost:5173
  
  # Grafana (порт 3000)
  - hostname: grafana-predator.example.com
    service: http://localhost:3000
  
  # Catch-all 404
  - service: http_status:404
EOF
    log_info "Конфігурацію створено: $CLOUDFLARED_CONFIG"
    log_warn "ВАЖЛИВО: Замініть 'example.com' на ваш реальний домен!"
else
    log_info "Конфігурація вже існує: $CLOUDFLARED_CONFIG"
fi

# Крок 5: Інструкції
echo ""
echo "=============================================="
echo "  ✅ Cloudflare Tunnel готовий!"
echo "=============================================="
echo ""
echo "Наступні кроки:"
echo ""
echo "1. Відредагуйте конфігурацію:"
echo "   nano $CLOUDFLARED_CONFIG"
echo ""
echo "2. Замініть 'example.com' на ваш домен"
echo ""
echo "3. Додайте DNS записи:"
echo "   cloudflared tunnel route dns $TUNNEL_NAME ssh-predator.YOUR-DOMAIN.com"
echo ""
echo "4. Запустіть тунель:"
echo "   cloudflared tunnel run $TUNNEL_NAME"
echo ""
echo "5. (Опціонально) Встановіть як сервіс:"
echo "   sudo cloudflared service install"
echo "   sudo systemctl enable cloudflared"
echo "   sudo systemctl start cloudflared"
echo ""
echo "=============================================="
