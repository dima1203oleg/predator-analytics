#!/bin/bash

# SSH Port Forwarding для доступу до веб-інтерфейсів Predator Analytics
# Використання: ./scripts/server-tunnel.sh [start|stop|status]

SSH_KEY="$HOME/.ssh/id_ed25519_dev"
SSH_HOST="${SSH_HOST:-predator-server}" # Використовуємо аліас з ~/.ssh/config
# SSH_PORT is irrelevant if using alias, but if explicit:
SSH_PORT="${SSH_PORT:-6666}"
SSH_USER="${SSH_USER:-dima}"

# Кольори
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Порти для перенаправлення (Локальний:Віддалений:Опис)
PORTS=(
    "9001:3001:Grafana"
    "9082:8082:Frontend"
    "9000:8000:Backend API"
    "9432:5432:PostgreSQL"
    "9379:6379:Redis"
    # Kubernetes API (додається при бажанні)
    # "6443:6443:K8s API"
)

# PID файл
PID_FILE="/tmp/predator-ssh-tunnel.pid"

start_tunnel() {
    # Перевірити чи вже запущено
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo -e "${YELLOW}⚠️  SSH-тунель вже запущено (PID: $(cat "$PID_FILE"))${NC}"
        echo ""
        show_links
        return 0
    fi

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🚇 Запуск SSH-тунелів до сервера${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Формування опцій для SSH
    SSH_OPTS="-N -f"
    for port_map in "${PORTS[@]}"; do
        IFS=':' read -r local_port remote_port desc <<< "$port_map"
        SSH_OPTS="$SSH_OPTS -L $local_port:localhost:$remote_port"
        echo -e "${YELLOW}📡 Перенаправлення:${NC} localhost:$local_port → сервер:$remote_port ($desc)"
    done

    # Якщо хочемо також пробросити Kubernetes API, додаємо вручну
    if [[ "$EXTRA" == "k8s" || "$1" == "k8s" ]]; then
        SSH_OPTS="$SSH_OPTS -L 6443:localhost:6443"
        echo -e "${YELLOW}📡 Перенаправлення:${NC} localhost:6443 → сервер:6443 (Kubernetes API)"
    fi

    echo ""
    echo -e "${YELLOW}🔐 Підключення до $SSH_HOST:$SSH_PORT...${NC}"

    # Запуск SSH-тунелю
    ssh -i "$SSH_KEY" -p "$SSH_PORT" $SSH_OPTS "$SSH_USER@$SSH_HOST"

    # Зберегти PID
    SSH_PID=$(pgrep -f "ssh.*$SSH_HOST.*-L")
    if [ -n "$SSH_PID" ]; then
        echo "$SSH_PID" > "$PID_FILE"
        echo ""
        echo -e "${GREEN}✅ SSH-тунель успішно запущено (PID: $SSH_PID)${NC}"
        echo ""
        show_links
    else
        echo ""
        echo -e "${RED}❌ Помилка запуску SSH-тунелю${NC}"
        return 1
    fi
}

stop_tunnel() {
    echo -e "${YELLOW}🛑 Зупинка SSH-тунелю...${NC}"

    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            rm "$PID_FILE"
            echo -e "${GREEN}✅ SSH-тунель зупинено (PID: $PID)${NC}"
        else
            echo -e "${YELLOW}⚠️  Процес не знайдено, видаляю PID файл${NC}"
            rm "$PID_FILE"
        fi
    else
        # Спробувати знайти процес
        SSH_PID=$(pgrep -f "ssh.*$SSH_HOST.*-L")
        if [ -n "$SSH_PID" ]; then
            kill "$SSH_PID"
            echo -e "${GREEN}✅ SSH-тунель зупинено (PID: $SSH_PID)${NC}"
        else
            echo -e "${YELLOW}⚠️  SSH-тунель не запущено${NC}"
        fi
    fi
}

show_status() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📊 Статус SSH-тунелю${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo -e "${GREEN}✅ SSH-тунель активний (PID: $(cat "$PID_FILE"))${NC}"
        echo ""
        show_links
        echo ""
        echo -e "${YELLOW}Активні з'єднання:${NC}"
        lsof -i -P | grep LISTEN | grep -E ":(9001|9082|9000|9432|9379)" || echo "  Немає активних з'єднань"
    else
        echo -e "${RED}❌ SSH-тунель не запущено${NC}"
        echo ""
        echo -e "${YELLOW}💡 Запустити тунель:${NC} ./scripts/server-tunnel.sh start"
    fi

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

show_links() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🌐 Доступні веб-інтерфейси:${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}📊 Grafana (Моніторинг):${NC}"
    echo -e "   ${BLUE}http://localhost:9001${NC}"
    echo ""
    echo -e "${GREEN}🎨 Frontend (Веб-додаток):${NC}"
    echo -e "   ${BLUE}http://localhost:9082${NC}"
    echo ""
    echo -e "${GREEN}🔧 Backend API (FastAPI):${NC}"
    echo -e "   ${BLUE}http://localhost:9000${NC}"
    echo -e "   ${BLUE}http://localhost:9000/docs${NC} (Swagger)"
    echo -e "   ${BLUE}http://localhost:9000/redoc${NC} (ReDoc)"
    echo ""
    echo -e "${GREEN}🗄️  PostgreSQL:${NC}"
    echo -e "   ${BLUE}localhost:9432${NC}"
    echo ""
    echo -e "${GREEN}💾 Redis:${NC}"
    echo -e "   ${BLUE}localhost:9379${NC}"
    echo ""
    echo -e "${GREEN}🔑 Kubernetes API:${NC}"
    echo -e "   ${BLUE}https://localhost:6443${NC}"
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Головне меню
case "${1:-start}" in
    start)
        start_tunnel "$2"
        ;;
    stop)
        stop_tunnel
        ;;
    restart)
        stop_tunnel
        sleep 2
        start_tunnel
        ;;
    status)
        show_status
        ;;
    links)
        if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
            show_links
        else
            echo -e "${RED}❌ SSH-тунель не запущено${NC}"
            echo -e "${YELLOW}💡 Спочатку запустіть:${NC} ./scripts/server-tunnel.sh start"
        fi
        ;;
    deploy)
        # simple helper: встановлює kubeconfig, запускає helm
        if [ -z "$KUBECONFIG" ]; then
            echo "🔧 Створюю тимчасовий kubeconfig у k8s/kubeconfig_proxied"
            mkdir -p k8s
            cat <<'EOF' > k8s/kubeconfig_proxied
apiVersion: v1
clusters:
- cluster:
    server: https://localhost:6443
    insecure-skip-tls-verify: true
  name: remote
contexts:
- context:
    cluster: remote
    user: remote
  name: remote
current-context: remote
users:
- name: remote
  user:
    token: $ARGOCD_TOKEN
EOF
            export KUBECONFIG=$PWD/k8s/kubeconfig_proxied
        fi
        echo "🚀 Виконуємо helm upgrade/ install"
        helm upgrade --install predator ./helm/predator-umbrella --namespace predator --create-namespace "$@"
        ;;
    *)
        echo "Використання: $0 {start|stop|restart|status|links}"
        echo ""
        echo "Команди:"
        echo "  start   - Запустити SSH-тунель"
        echo "  stop    - Зупинити SSH-тунель"
        echo "  restart - Перезапустити SSH-тунель"
        echo "  status  - Показати статус"
        echo "  links   - Показати посилання на веб-інтерфейси"
        echo "  deploy  - Запустити helm upgrade у кластері через тунель"
        exit 1
        ;;
esac
