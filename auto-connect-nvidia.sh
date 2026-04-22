#!/usr/bin/env bash

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SERVERS=(
  "predator-zrok|127.0.0.1|2222|dima|~/.ssh/id_ed25519_dev"
  "predator-ngrok|2.tcp.eu.ngrok.io|14677|dima|~/.ssh/id_ed25519_dev"
  "predator-server|194.177.1.240|6666|dima|~/.ssh/id_ed25519_dev"
  "predator-v4|194.177.1.240|6666|dima|~/.ssh/id_predator_v4"
  "nvidia-server|34.185.226.240|22|dima|~/.ssh/id_ed25519_dev"
)

check_ssh_access() {
  local alias=$1
  local hostname=$2
  local port=$3
  local user=$4
  local keyfile=$5

  keyfile="${keyfile/#\~/$HOME}"

  echo -e "${YELLOW}[Спроба $alias]${NC} SSH до $user@$hostname:$port"
  echo -n "  ├─ Перевіряю ключ $keyfile... "

  if [ ! -f "$keyfile" ]; then
    echo -e "${RED}❌ КЛЮЧ НЕ ЗНАЙДЕНО${NC}"
    return 1
  fi
  echo -e "${GREEN}✅${NC}"

  # Automatically add key to ssh-agent to prevent connection issues
  if ! ssh-add -l 2>/dev/null | grep -q "$keyfile"; then
    echo -n "  ├─ Додаю ключ в ssh-agent... "
    ssh-add "$keyfile" >/dev/null 2>&1 || true
    echo -e "${GREEN}✅${NC}"
  fi

  echo -n "  ├─ Перевіряю доступність $hostname:$port... "
  # Use Python for a reliable, cross-platform TCP check with 2s timeout
  if python3 -c "import socket; s = socket.socket(socket.AF_INET, socket.SOCK_STREAM); s.settimeout(2.0); s.connect(('$hostname', int('$port')))" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ ДОСТУПНА${NC}"
  else
    echo -e "${RED}❌ НЕ ДОСТУПНА (firewall/timeout)${NC}"
    return 1
  fi

  echo -n "  ├─ Пробую SSH підключення... "
  if ssh -o BatchMode=yes \
         -o ConnectTimeout=5 \
         -o StrictHostKeyChecking=no \
         -o UserKnownHostsFile=/dev/null \
         -i "$keyfile" \
         -p "$port" \
         "$user@$hostname" "echo 'SSH_OK'" 2>/dev/null | grep -q "SSH_OK"; then
    echo -e "${GREEN}✅ УСПІШНО!${NC}"
    return 0
  fi

  echo -e "${RED}❌ ПОМИЛКА SSH${NC}"
  return 1
}

run_remote_diagnostic() {
  local hostname=$1
  local port=$2
  local user=$3
  local keyfile=$4

  keyfile="${keyfile/#\~/$HOME}"

  echo ""
  echo -e "${BLUE}📊 ДІАГНОСТИКА НА СЕРВЕРІ (${hostname}:${port})${NC}"
  echo ""

  ssh -o StrictHostKeyChecking=no \
      -o UserKnownHostsFile=/dev/null \
      -i "$keyfile" \
      -p "$port" \
      "$user@$hostname" <<'REMOTE_COMMANDS'

echo "=== NVIDIA GPU ==="
nvidia-smi --query-gpu=index,name,driver_version,memory.total,memory.used,memory.free --format=csv,noheader 2>/dev/null || echo "❌ nvidia-smi не доступна"

echo ""
echo "=== RAM (вільна пам'ять) ==="
free -h 2>/dev/null | grep Mem || (echo "Total:"; cat /proc/meminfo 2>/dev/null | grep MemTotal || echo "❌ /proc/meminfo не доступна")

echo ""
echo "=== DISK ROOT (/) ==="
df -h / 2>/dev/null | tail -1 || echo "❌ df не доступна"

echo ""
echo "=== CPU CORES ==="
nproc 2>/dev/null || (cat /proc/cpuinfo 2>/dev/null | grep "processor" | wc -l)

echo ""
echo "=== DOCKER (контейнери одноразово) ==="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || echo "❌ Docker не доступен або не запущено"

echo ""
echo "=== OLLAMA (LLM Pool) ==="
curl -sS http://localhost:11434/api/tags 2>/dev/null | head -20 || echo "❌ Ollama не відповідає на http://localhost:11434"

echo ""
echo "=== KUBERNETES (k3s status) ==="
kubectl get nodes 2>/dev/null || echo "❌ kubectl не налаштований"

echo ""
echo "=== OPENPORT CHECK (6666 SSH, 8000 API, 3030 UI) ==="
for port in 6666 8000 3030 11434; do
  if python3 -c "import socket; s = socket.socket(socket.AF_INET, socket.SOCK_STREAM); s.settimeout(1.0); s.connect(('127.0.0.1', int('$port')))" >/dev/null 2>&1; then
    echo "  ✅ Порт $port: ВІДКРИТИЙ"
  else
    echo "  ❌ Порт $port: ЗАКРИТЙ"
  fi
done

REMOTE_COMMANDS
}

# Основна логіка підключення
RETRY_DELAY=15
MAX_ATTEMPTS=0
FOREVER=0

if [ "${1:-}" = "--forever" ]; then
  FOREVER=1
fi

echo -e "${YELLOW}🔍 ФАЗА 1: Пошук робочого SSH підключення${NC}"
echo ""

if command -v zrok >/dev/null 2>&1 || [ -f "$HOME/bin/zrok" ]; then
  ZROK_BIN=$(command -v zrok || echo "$HOME/bin/zrok")
  if ! pgrep -f "zrok access private predatorssh" > /dev/null; then
    echo -n "  ├─ Запускаю zrok тунель (predatorssh) у фоні... "
    "$ZROK_BIN" access private predatorssh --bind 127.0.0.1:2222 >/dev/null 2>&1 &
    sleep 2 # чекаємо поки тунель підніметься
    echo -e "${GREEN}✅${NC}"
  else
    echo -e "  ├─ zrok тунель (predatorssh) вже активний ${GREEN}✅${NC}"
  fi
fi
echo ""

CONNECTED_ALIAS=""
CONNECTED_HOST=""
CONNECTED_PORT=""
CONNECTED_USER=""
CONNECTED_KEY=""
ATTEMPT=0

while true; do
  ATTEMPT=$((ATTEMPT + 1))
  echo -e "${BLUE}=== Спроба #$ATTEMPT ===${NC}"
  echo ""

  for server_config in "${SERVERS[@]}"; do
    IFS='|' read -r alias hostname port user keyfile <<< "$server_config"

    if check_ssh_access "$alias" "$hostname" "$port" "$user" "$keyfile"; then
      CONNECTED_ALIAS="$alias"
      CONNECTED_HOST="$hostname"
      CONNECTED_PORT="$port"
      CONNECTED_USER="$user"
      CONNECTED_KEY="$keyfile"
      echo -e "${GREEN}✅ ЗНАЙДЕНО РОБОЧЕ ПІДКЛЮЧЕННЯ: $alias${NC}"
      echo ""
      break 2
    fi
    echo ""
  done

  if [ -n "$CONNECTED_ALIAS" ]; then
    break
  fi

  if [ "$FOREVER" -eq 0 ] && [ "$MAX_ATTEMPTS" -ne 0 ] && [ "$ATTEMPT" -ge "$MAX_ATTEMPTS" ]; then
    break
  fi

  echo -e "${YELLOW}⏳ Жодного робочого підключення не знайдено. Очікую $RETRY_DELAY сек...${NC}"
  sleep "$RETRY_DELAY"
  echo ""
done

if [ -z "$CONNECTED_ALIAS" ]; then
  echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  ❌ НЕ ВДАЛОСЬ ПІДКЛЮЧИТИСЬ!                              ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${YELLOW}📋 МОЖЛИВІ ПРИЧИНИ:${NC}"
  echo "  1. 🔥 Firewall закриває SSH порти (22, 6666)"
  echo "  2. 🌐 VPN не активна (якщо сервер за VPN)"
  echo "  3. 🔑 SSH ключі не авторизовані на сервері"
  echo "  4. 📡 ngrok не активна (перевірте 2.tcp.eu.ngrok.io)"
  echo "  5. 🔴 Сервер вимкнено або недоступний"
  echo ""
  echo -e "${YELLOW}🛠️  ЩО РОБИТИ:${NC}"
  echo "  1. Спробуйте вручну: ssh -v predator-server"
  echo "  2. Дайте адміністратору SERVER_STATUS_REPORT.md"
  echo "  3. Переконайтесь у VPN підключенні (якщо потрібна)"
  echo "  4. Оновіть SSH ключі в ~/.ssh/"
  echo "  5. Перевірте ngrok тунель (якщо використовується)"
  echo ""
  exit 1
fi

echo -e "${BLUE}🔍 ФАЗА 2: Запуск діагностики на сервері${NC}"
echo ""

run_remote_diagnostic "$CONNECTED_HOST" "$CONNECTED_PORT" "$CONNECTED_USER" "$CONNECTED_KEY"
echo ""

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ ПІДКЛЮЧЕННЯ УСПІШНЕ!                                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📌 ІНФОРМАЦІЯ ПРО СЕРВЕР:${NC}"
echo "  Alias: $CONNECTED_ALIAS"
echo "  Адреса: $CONNECTED_HOST:$CONNECTED_PORT"
echo "  User: $CONNECTED_USER"
echo "  SSH ключ: $CONNECTED_KEY"
echo ""
echo -e "${YELLOW}💾 КОМАНДИ ДЛЯ ПОДАЛЬШОЇ РОБОТИ:${NC}"
echo "  # Підключитися до сервера:"
echo "  ssh $CONNECTED_ALIAS"
echo ""
echo "  # Запустити команду на сервері:"
echo "  ssh $CONNECTED_ALIAS 'nvidia-smi'"
echo ""
echo "  # Port-forward для локального доступу:"
echo "  ssh -L 8000:localhost:8000 $CONNECTED_ALIAS"
echo ""
echo "  # SCP - копіювання файлів:"
echo "  scp -P $CONNECTED_PORT file.txt $CONNECTED_USER@$CONNECTED_HOST:/tmp/"
echo ""
echo -e "${BLUE}✨ Автоматичне підключення завершено успішно!${NC}"
echo ""
