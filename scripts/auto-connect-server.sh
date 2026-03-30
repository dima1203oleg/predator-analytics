#!/bin/bash
# 🤖 AUTO SERVER CONNECTION HELPER
# Автоматично намагається підключитися до сервера за всіма можливими методами

SERVER_IP="194.177.1.240"
SSH_PORT="6666"
SSH_USER="dima"

echo "🤖 AUTO SERVER CONNECTION v1.0"
echo "=================================="
echo ""

# Функція для перевірки доступності
try_connect() {
    local method=$1
    local cmd=$2
    
    echo -n "⏳ $method... "
    if eval "$cmd" >/dev/null 2>&1; then
        echo "✅ SUCCESS!"
        return 0
    else
        echo "❌"
        return 1
    fi
}

# 1. Пряме SSH
try_connect "Direct SSH" "ssh -o ConnectTimeout=2 -o BatchMode=yes -p $SSH_PORT $SSH_USER@$SERVER_IP 'echo ok'" && {
    echo ""
    echo "🎉 Connected! Connecting now..."
    ssh -p $SSH_PORT $SSH_USER@$SERVER_IP
    exit 0
}

# 2. SSH через config alias
try_connect "SSH Config (predator-server)" "ssh -o ConnectTimeout=2 -o BatchMode=yes predator-server 'echo ok'" && {
    echo ""
    echo "🎉 Connected! Connecting now..."
    ssh predator-server
    exit 0
}

# 3. Ngrok тунель
try_connect "Ngrok Tunnel" "ssh -o ConnectTimeout=2 -o BatchMode=yes -p 14677 dima@2.tcp.eu.ngrok.io 'echo ok'" && {
    echo ""
    echo "🎉 Connected via Ngrok! Connecting now..."
    ssh -p 14677 dima@2.tcp.eu.ngrok.io
    exit 0
}

# 4. VPN через Cisco
try_connect "Cisco VPN" "ls /Applications/Cisco/Cisco\ VPN\ Client.app >/dev/null && echo connected" && {
    echo ""
    echo "📌 VPN available. Enable it and try again:"
    echo "   open /Applications/Cisco/Cisco\ VPN\ Client.app"
    exit 0
}

# 5. AWS Systems Manager (якщо є)
try_connect "AWS Systems Manager" "aws ssm describe-instances --query 'Reservations[0].Instances[0].InstanceId' 2>/dev/null" && {
    echo ""
    echo "📌 AWS available. Use:"
    echo "   aws ssm start-session --target <instance-id>"
    exit 0
}

echo ""
echo "❌ Усі методи не спрацювали!"
echo ""
echo "📋 Рекомендації:"
echo "1. Зв'яжіться з адміністратором: support@predator-analytics.ua"
echo "   - Надішліть вашу IP: $(curl -s ifconfig.me 2>/dev/null || echo 'unknown')"
echo "   - Попросіть whitelist для SSH на 194.177.1.240:6666"
echo ""
echo "2. Альтернативи:"
echo "   - Запусти локально: bash scripts/start-emergency.sh"
echo "   - Перевір VPN конфіг: ~/vpn-config.ovpn"
echo "   - Перевір ngrok: ngrok status"
echo ""
echo "3. Для локальної розробки:"
echo "   cd /Users/dima-mac/Documents/Predator_21"
echo "   bash deploy-local.sh"

