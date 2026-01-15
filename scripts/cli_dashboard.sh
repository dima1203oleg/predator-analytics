#!/bin/bash
# PREDATOR v30 - АВТОНОМНА КОНСОЛЬ УПРАВЛІННЯ (UA)
# Обхід Nginx/Ngrok для прямого зв'язку з Ядром Системи.

SERVER="dima@194.177.1.240"
PORT="6666"

RESET="\033[0m"
BOLD="\033[1m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[36m"

clear
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BLUE}║          PREDATOR v30 - АВТОНОМНА КОНСОЛЬ УПРАВЛІННЯ         ║${RESET}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# 1. Перевірка статусу системи (SOM)
echo -e "${BOLD}📡 СТАТУС СИСТЕМИ (Внутрішнє Ядро):${RESET}"
HEALTH_JSON=$(ssh -p $PORT $SERVER "curl -s http://localhost:8095/api/v1/som/health")

if [[ $HEALTH_JSON == *"healthy"* ]]; then
    VERSION=$(echo $HEALTH_JSON | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    CORE=$(echo $HEALTH_JSON | grep -o '"constitutional_core":true')
    if [[ -n "$CORE" ]]; then
        CORE_STATUS="${GREEN}АКТИВНО${RESET}"
    else
        CORE_STATUS="${RED}НЕАКТИВНО${RESET}"
    fi
    echo -e "   • Версія SOM: ${BOLD}$VERSION${RESET}"
    echo -e "   • Конституційне Ядро: $CORE_STATUS"
    echo -e "   • Статус: ${GREEN}ОПЕРАЦІЙНИЙ${RESET}"
else
    echo -e "   • Статус: ${RED}КРИТИЧНИЙ ЗБІЙ${RESET} (З'єднання втрачено)"
fi
echo ""

# 2. Перевірка Реєстру Правди
echo -e "${BOLD}⚖️  РЕЄСТР ПРАВДИ (Truth Ledger):${RESET}"
LEDGER_JSON=$(ssh -p $PORT $SERVER "curl -s http://localhost:8095/api/v1/ledger/entries?limit=3")

if [[ $LEDGER_JSON == *"entries"* ]]; then
    TOTAL=$(echo $LEDGER_JSON | grep -o '"total":[0-9]*' | cut -d':' -f2)
    echo -e "   • Всього записів: ${BOLD}$TOTAL${RESET}"
    echo -e "   • Останні події:"
    # Безпечний парсинг JSON без jq
    echo "$LEDGER_JSON" | grep -o '{"id"[^}]*}' | head -n 3 | while read -r line; do
        ACTOR=$(echo $line | grep -o '"actor":"[^"]*"' | cut -d'"' -f4)
        ACTION=$(echo $line | grep -o '"action_type":"[^"]*"' | cut -d'"' -f4)
        TIME=$(echo $line | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4)
        # Форматування часу (обрізання до секунд)
        TIME_SHORT=$(echo $TIME | cut -d'.' -f1 | sed 's/T/ /')
        echo -e "     - [${YELLOW}$TIME_SHORT${RESET}] ${BLUE}$ACTOR${RESET} -> $ACTION"
    done
else
    echo -e "   • Статус: ${RED}НЕДОСТУПНИЙ${RESET}"
fi
echo ""

# 3. Статус Нічної Зміни
echo -e "${BOLD}🌙 ПРОТОКОЛ 'НІЧНА ЗМІНА' (Автономні Агенти):${RESET}"
AGENTS_RUNNING=$(ssh -p $PORT $SERVER "ps aux | grep night_shift_protocol.sh | grep -v grep | wc -l")

if [ "$AGENTS_RUNNING" -gt "0" ]; then
    echo -e "   • Протокол: ${GREEN}АКТИВНИЙ${RESET} (Запущені процеси: $AGENTS_RUNNING)"
    echo -e "   • Останні дані розвідки:"
    ssh -p $PORT $SERVER "tail -n 5 ~/logs/night_shift/*.log 2>/dev/null" | sed 's/^/     /'
else
    echo -e "   • Протокол: ${RED}НЕАКТИВНИЙ${RESET}"
fi

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════════════${RESET}"
echo -e "Система працює автономно. Натисніть Ctrl+C для виходу."
