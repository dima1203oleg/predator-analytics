#!/usr/bin/env bash

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

NVIDIA_PRIMARY_HOST="${NVIDIA_PRIMARY_HOST:-194.177.1.240}"
NVIDIA_PRIMARY_PORT="${NVIDIA_PRIMARY_PORT:-6666}"
NVIDIA_GCP_HOST="${NVIDIA_GCP_HOST:-34.185.226.240}"
NVIDIA_GCP_PORT="${NVIDIA_GCP_PORT:-22}"
NVIDIA_USER="${NVIDIA_USER:-dima}"
NVIDIA_PRIMARY_KEY="${NVIDIA_PRIMARY_KEY:-~/.ssh/id_ed25519_dev}"
NVIDIA_V4_KEY="${NVIDIA_V4_KEY:-~/.ssh/id_predator_v4}"
ZROK_SSH_SHARE="${ZROK_SSH_SHARE:-predatorssh}"
ZROK_K8S_SHARE="${ZROK_K8S_SHARE:-predatork8s}"
ZROK_SSH_BIND_HOST="${ZROK_SSH_BIND_HOST:-127.0.0.1}"
ZROK_SSH_BIND_PORT="${ZROK_SSH_BIND_PORT:-2222}"
ZROK_K8S_BIND_HOST="${ZROK_K8S_BIND_HOST:-127.0.0.1}"
ZROK_K8S_BIND_PORT="${ZROK_K8S_BIND_PORT:-6443}"
ZROK_LOG_DIR="${ZROK_LOG_DIR:-$HOME/.zrok}"
mkdir -p "$ZROK_LOG_DIR"

SERVERS=(
  "predator-zrok|$ZROK_SSH_BIND_HOST|$ZROK_SSH_BIND_PORT|$NVIDIA_USER|$NVIDIA_PRIMARY_KEY"
  "predator-server|$NVIDIA_PRIMARY_HOST|$NVIDIA_PRIMARY_PORT|$NVIDIA_USER|$NVIDIA_PRIMARY_KEY"
  "gcp-nvidia|$NVIDIA_GCP_HOST|$NVIDIA_GCP_PORT|$NVIDIA_USER|$NVIDIA_PRIMARY_KEY"
)

if [ -f "${NVIDIA_V4_KEY/#\~/$HOME}" ]; then
  SERVERS+=("predator-v4|$NVIDIA_PRIMARY_HOST|$NVIDIA_PRIMARY_PORT|$NVIDIA_USER|$NVIDIA_V4_KEY")
fi

tcp_check() {
  local hostname=$1
  local port=$2
  local timeout_seconds=${3:-2}

  python3 - "$hostname" "$port" "$timeout_seconds" <<'PY'
import socket
import sys

host = sys.argv[1]
port = int(sys.argv[2])
timeout = float(sys.argv[3])

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.settimeout(timeout)
try:
    sock.connect((host, port))
except OSError:
    sys.exit(1)
finally:
    sock.close()
PY
}

zrok_bin() {
  command -v zrok 2>/dev/null || {
    if [ -x "$HOME/bin/zrok" ]; then
      echo "$HOME/bin/zrok"
    fi
  }
}

ensure_zrok_access() {
  local share=$1
  local bind_host=$2
  local bind_port=$3
  local label=$4
  local bin
  local log_file="$ZROK_LOG_DIR/${share}.access.log"

  bin="$(zrok_bin || true)"
  if [ -z "$bin" ]; then
    echo -e "  ├─ zrok не знайдено, пропускаю $label ${YELLOW}⚠️${NC}"
    return 1
  fi

  if tcp_check "$bind_host" "$bind_port" 1; then
    echo -e "  ├─ $label вже слухає $bind_host:$bind_port ${GREEN}✅${NC}"
    return 0
  fi

  if pgrep -f "zrok access private $share" >/dev/null; then
    if [ "${ZROK_FORCE_RESTART:-0}" = "1" ]; then
      pkill -f "zrok access private $share" 2>/dev/null || true
    else
      echo -e "  ├─ $label має активний процес, але порт ще не слухає ${YELLOW}⚠️${NC}"
      return 1
    fi
  fi

  echo -n "  ├─ Запускаю $label ($share → $bind_host:$bind_port)... "
  : > "$log_file"
  export ZROK_HEADLESS=true
  "$bin" access private "$share" --bind "$bind_host:$bind_port" --headless >"$log_file" 2>&1 &
  sleep 3

  if tcp_check "$bind_host" "$bind_port" 1; then
    echo -e "${GREEN}✅${NC}"
    return 0
  fi

  echo -e "${YELLOW}⚠️ НЕ АКТИВНИЙ${NC}"
  if [ -s "$log_file" ]; then
    echo "     Лог zrok: $(head -3 "$log_file" | tr '\n' ' ')"
  else
    echo "     Лог zrok порожній; share може бути не опублікований на сервері."
  fi
  return 1
}

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

  # Додаємо ключ в ssh-agent, щоб уникнути нестабільних повторних запитів.
  if ! ssh-add -l 2>/dev/null | grep -q "$keyfile"; then
    echo -n "  ├─ Додаю ключ в ssh-agent... "
    ssh-add "$keyfile" >/dev/null 2>&1 || true
    echo -e "${GREEN}✅${NC}"
  fi

  echo -n "  ├─ Перевіряю доступність $hostname:$port... "
  if tcp_check "$hostname" "$port" 2; then
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
echo "=== ВУЗОЛ ==="
hostnamectl 2>/dev/null || hostname
echo "USER=$(whoami)"
date -Is 2>/dev/null || date

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
echo "=== DOCKER COMPOSE ПРОЄКТИ ==="
docker compose ls 2>/dev/null || docker-compose ls 2>/dev/null || echo "❌ Docker Compose не доступний"

echo ""
echo "=== DOCKER КОНТЕЙНЕРИ ==="
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "❌ Docker не доступний або не запущено"

echo ""
echo "=== DOCKER СТАТИСТИКА ==="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || echo "❌ Docker stats не доступний"

echo ""
echo "=== DOCKER МЕРЕЖІ ==="
docker network ls 2>/dev/null || echo "❌ Docker networks не доступні"
docker network inspect predator-server-net --format '{{json .IPAM.Config}}' 2>/dev/null || true

echo ""
echo "=== DOCKER ТОМИ ==="
docker volume ls 2>/dev/null | grep -E 'predator|postgres|redis|qdrant|opensearch|minio|redpanda|ollama|grafana|prometheus' || echo "❌ Цільові Docker volumes не знайдено або Docker не доступний"

echo ""
echo "=== OLLAMA (пул LLM) ==="
curl -sS http://localhost:11434/api/tags 2>/dev/null | head -20 || echo "❌ Ollama не відповідає на http://localhost:11434"

echo ""
echo "=== KUBERNETES (стан k3s) ==="
kubectl config current-context 2>/dev/null || true
kubectl get nodes -o wide 2>/dev/null || echo "❌ kubectl не налаштований або кластер недоступний"
kubectl get ns 2>/dev/null || true
kubectl get pods -A -o wide 2>/dev/null | head -80 || true

echo ""
echo "=== ZROK СЕРВІСИ ==="
systemctl --no-pager --full status predator-api predator-k8s predator-ssh 2>/dev/null | head -120 || echo "❌ systemd/zrok сервіси не знайдено"

echo ""
echo "=== ПЕРЕВІРКА ЛОКАЛЬНИХ ПОРТІВ ==="
for port in 22 6666 4000 5432 6379 6333 6443 8000 9080 3030 9090 3001 11434; do
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
MAX_ATTEMPTS="${NVIDIA_MAX_ATTEMPTS:-1}"
FOREVER=0

while [ $# -gt 0 ]; do
  case "$1" in
    --forever)
      FOREVER=1
      ;;
    --attempts)
      MAX_ATTEMPTS="${2:?Очікується кількість спроб після --attempts}"
      shift
      ;;
    *)
      echo -e "${RED}Невідомий аргумент: $1${NC}"
      echo "Використання: $0 [--forever] [--attempts N]"
      exit 2
      ;;
  esac
  shift
done

echo -e "${YELLOW}🔍 ФАЗА 1: Пошук робочого SSH підключення${NC}"
echo ""

ensure_zrok_access "$ZROK_SSH_SHARE" "$ZROK_SSH_BIND_HOST" "$ZROK_SSH_BIND_PORT" "SSH zrok-тунель" || true
ensure_zrok_access "$ZROK_K8S_SHARE" "$ZROK_K8S_BIND_HOST" "$ZROK_K8S_BIND_PORT" "K8s zrok-тунель" || true
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

  if [ "$FOREVER" -eq 0 ] && [ "$ATTEMPT" -ge "$MAX_ATTEMPTS" ]; then
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
  echo "  4. 📡 zrok private share '$ZROK_SSH_SHARE' не опублікований на NVIDIA сервері"
  echo "  5. 🔴 Сервер вимкнено або недоступний"
  echo ""
  echo -e "${YELLOW}🛠️  ЩО РОБИТИ:${NC}"
  echo "  1. На сервері запустіть: ZROK_TOKEN=*** bash deploy/scripts/fix_zrok_v2.sh"
  echo "  2. Або відкрийте прямий SSH: $NVIDIA_PRIMARY_HOST:$NVIDIA_PRIMARY_PORT"
  echo "  3. Перевірте: zrok access private $ZROK_SSH_SHARE --bind $ZROK_SSH_BIND_HOST:$ZROK_SSH_BIND_PORT"
  echo "  4. Оновіть SSH ключі в ~/.ssh/"
  echo "  5. Для повторів: $0 --forever"
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
if [ "$CONNECTED_ALIAS" = "predator-zrok" ]; then
  echo "  ssh -i ${NVIDIA_PRIMARY_KEY/#\~/$HOME} -p $ZROK_SSH_BIND_PORT $NVIDIA_USER@$ZROK_SSH_BIND_HOST"
fi
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
