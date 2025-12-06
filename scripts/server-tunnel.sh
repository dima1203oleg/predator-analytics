#!/bin/bash

# SSH Port Forwarding для доступу до веб-інтерфейсів Predator Analytics
# Використання: ./scripts/server-tunnel.sh [start|stop|status]

SSH_KEY="$HOME/.ssh/id_ed25519_ngrok"
SSH_HOST="5.tcp.eu.ngrok.io"
SSH_PORT="14651"
SSH_USER="dima"

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
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Головне меню
case "${1:-start}" in
    start)
        start_tunnel
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
    *)
        echo "Використання: $0 {start|stop|restart|status|links}"
        echo ""
        echo "Команди:"
        echo "  start   - Запустити SSH-тунель"
        echo "  stop    - Зупинити SSH-тунель"
        echo "  restart - Перезапустити SSH-тунель"
        echo "  status  - Показати статус"
        echo "  links   - Показати посилання на веб-інтерфейси"
        exit 1
        ;;
esac
