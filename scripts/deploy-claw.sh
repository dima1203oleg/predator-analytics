#!/usr/bin/env bash
# Автоматичний розгортач Claw Code на NVIDIA сервер
# Запускається Agent Predator-ом

set -euo pipefail

# Кольори
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

NVIDIA_IP="192.168.0.48"
NVIDIA_PORT="6666"
NVIDIA_USER="dima"
LOCAL_CLAW_PATH="/Users/dima1203/Documents/GitHub/claw-code"
REMOTE_CLAW_PATH="/Users/dima/claw-code"

echo -e "${BLUE}=== Початок розгортання Claw Code на NVIDIA ($NVIDIA_IP) ===${NC}"

# 1. Перевірка доступності сервера
echo -e "${YELLOW}>> Перевірка SSH підключення...${NC}"
if ! ssh -p $NVIDIA_PORT -o ConnectTimeout=5 $NVIDIA_USER@$NVIDIA_IP "echo 'SSH OK'"; then
  echo -e "${RED}Помилка підключення до сервера NVIDIA!${NC}"
  exit 1
fi

# 2. Синхронізація репозиторію
echo -e "${YELLOW}>> Синхронізація Claw Code на сервер...${NC}"
rsync -avz --exclude 'target' --exclude '.git' --exclude '.claw-rag/index.sqlite' -e "ssh -p $NVIDIA_PORT" "$LOCAL_CLAW_PATH/" "$NVIDIA_USER@$NVIDIA_IP:$REMOTE_CLAW_PATH/"

# 3. Синхронізація серверних конфігів
echo -e "${YELLOW}>> Відправка конфігурацій (claw-env.nvidia, .claw.json)...${NC}"
scp -P $NVIDIA_PORT /Users/Shared/Predator_60/config/claw-env.nvidia $NVIDIA_USER@$NVIDIA_IP:$REMOTE_CLAW_PATH/.env
scp -P $NVIDIA_PORT /Users/Shared/Predator_60/config/.claw.json $NVIDIA_USER@$NVIDIA_IP:$REMOTE_CLAW_PATH/.claw.json
scp -P $NVIDIA_PORT /Users/Shared/Predator_60/scripts/claw-task-worker.sh $NVIDIA_USER@$NVIDIA_IP:~/claw-task-worker.sh

# 4. Встановлення/перевірка Rust
echo -e "${YELLOW}>> Перевірка Rust toolchain на сервері...${NC}"
ssh -p $NVIDIA_PORT $NVIDIA_USER@$NVIDIA_IP << 'EOF'
  if ! command -v cargo &> /dev/null; then
    echo "Rust не знайдено, встановлюю..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
  else
    echo "Rust знайдено: $(cargo --version)"
  fi
EOF

# 5. Збірка Claw Code
echo -e "${YELLOW}>> Збірка Claw Code (cargo build --release)...${NC}"
ssh -p $NVIDIA_PORT $NVIDIA_USER@$NVIDIA_IP << "EOF"
  source $HOME/.cargo/env
  cd ~/claw-code/rust
  cargo build --workspace --release
EOF

# 6. Запуск Docker Compose для RAG
echo -e "${YELLOW}>> Запуск RAG Service (Qdrant + serve + ingest)...${NC}"
ssh -p $NVIDIA_PORT $NVIDIA_USER@$NVIDIA_IP << "EOF"
  cd ~/claw-code
  docker compose up -d
EOF

# 7. Запуск демона черги задач
echo -e "${YELLOW}>> Запуск Task Worker...${NC}"
ssh -p $NVIDIA_PORT $NVIDIA_USER@$NVIDIA_IP << "EOF"
  chmod +x ~/claw-task-worker.sh
  nohup ~/claw-task-worker.sh > ~/claw-task-worker.log 2>&1 &
  echo "Task Worker PID: $!"
EOF

echo -e "${GREEN}=== Розгортання Claw Code успішно завершено! ===${NC}"
