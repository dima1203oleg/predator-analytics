#!/bin/bash

###############################################################################
# PREDATOR Analytics - EXTENDED SSH DIAGNOSTIC & TROUBLESHOOTING
# Розширена діагностика для адміністратора
###############################################################################

set -o pipefail

# Кольори
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    PREDATOR - EXTENDED SSH & NETWORK DIAGNOSTICS          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Локальна машина
echo -e "${YELLOW}=== 1. ЛОКАЛЬНА МАШИНА ===${NC}"
echo "OS: $(uname -s) $(uname -r)"
echo "Hostname: $(hostname)"
echo "Network interfaces:"
ifconfig | grep -E "inet|flags" | head -20

echo ""
echo -e "${YELLOW}=== 2. SSH КЛЮЧИ ===${NC}"
ls -la ~/.ssh/id_* 2>/dev/null | grep -v ".pub" | awk '{print $9, "Size:", $5, "bytes"}'

echo ""
echo -e "${YELLOW}=== 3. SSH CONFIG ===${NC}"
echo "SSH Aliases:"
grep "^Host " ~/.ssh/config 2>/dev/null

echo ""
echo -e "${YELLOW}=== 4. NETWORK CONNECTIVITY TESTS ===${NC}"

# Тест до основного сервера
echo ""
echo "A) ОСНОВНИЙ СЕРВЕР: 194.177.1.240"
echo "   Ping..."
ping -c 2 194.177.1.240 2>&1 | grep -E "bytes|min/avg/max" || echo "   ❌ Ping неуспішний"

echo "   TCP connection на port 6666..."
(echo >/dev/tcp/194.177.1.240/6666) 2>/dev/null && echo "   ✅ TCP port 6666 доступний" || echo "   ❌ TCP port 6666 НЕ доступний (firewall/closed)"

echo "   TCP connection на port 22..."
(echo >/dev/tcp/194.177.1.240/22) 2>/dev/null && echo "   ✅ TCP port 22 доступний" || echo "   ❌ TCP port 22 НЕ доступний"

# Тест до альтернативного IP
echo ""
echo "B) АЛЬТЕРНАТИВНИЙ IP: 34.185.226.240"
echo "   Ping..."
ping -c 2 34.185.226.240 2>&1 | grep -E "bytes|min/avg/max" || echo "   ❌ Ping неуспішний"

echo "   TCP connection на port 22..."
(echo >/dev/tcp/34.185.226.240/22) 2>/dev/null && echo "   ✅ TCP port 22 доступний" || echo "   ❌ TCP port 22 НЕ доступний"

# Тест до ngrok
echo ""
echo "C) NGROK FALLBACK: 2.tcp.eu.ngrok.io:14677"
echo "   DNS lookup..."
nslookup 2.tcp.eu.ngrok.io 2>&1 | grep -E "Address|name|server" | head -5 || echo "   ❌ DNS lookup неуспішний"

echo "   TCP connection..."
(echo >/dev/tcp/2.tcp.eu.ngrok.io/14677) 2>/dev/null && echo "   ✅ TCP port 14677 доступний" || echo "   ❌ TCP port 14677 НЕ доступний"

echo ""
echo -e "${YELLOW}=== 5. TRACE ROUTE ===${NC}"
echo "До 194.177.1.240 (макс 5 hops):"
traceroute -m 5 194.177.1.240 2>&1 | head -10 || echo "❌ traceroute не доступна"

echo ""
echo -e "${YELLOW}=== 6. VERBOSE SSH TEST ===${NC}"
echo "SSH -v до predator-server:"
ssh -vvv -o ConnectTimeout=5 -i ~/.ssh/id_ed25519_dev predator-server 2>&1 | tail -100 || true

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  РЕЗЮМЕ ДІАГНОСТИКИ                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${RED}❌ ОСНОВНА ПРОБЛЕМА: SSH порти (22, 6666) на серверах недоступні${NC}"
echo ""
echo "МОЖЛИВІ ПРИЧИНИ:"
echo "  1️⃣  Firewalls закривають SSH трафік"
echo "  2️⃣  Сервери не в мережі або вимкнені"
echo "  3️⃣  SSH демон не запущено на сервері"
echo "  4️⃣  VPN потрібна для доступу до сервера"
echo "  5️⃣  Network маршрутизація неправильна"
echo ""
echo "РЕКОМЕНДОВАНІ ДІЇ:"
echo "  • Перевірте статус обох серверів (194.177.1.240, 34.185.226.240)"
echo "  • Перевірте firewall rules на серверах (ufw, iptables)"
echo "  • Переконайтесь, що SSH сервіс запущений (systemctl status ssh)"
echo "  • Якщо сервер за NAT/VPN, активуйте VPN на клієнті"
echo "  • Перевірте ngrok тунель (якщо використовується)"
echo "  • Зв'яжіться з системним адміністратором для дозволу SSH доступу"
echo ""
echo "ДЛЯ ВІДПРАВКИ АДМІНІСТРАТОРУ:"
echo "  • SERVER_STATUS_REPORT.md (вже створений)"
echo "  • Вивід цього скрипту (збережено у /tmp/diag-*.log)"
echo ""

# Зберегти вивід
diag_log="/tmp/diag_$(date +%s).log"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$0" > "$diag_log" 2>&1
echo -e "${GREEN}✅ Діагностика збережена: $diag_log${NC}"
