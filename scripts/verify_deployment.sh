#!/bin/bash
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Starting Predator Deployment Verification...${NC}"

# 1. Backend Health
echo ""
./scripts/check_backend_health.sh
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend Check Failed${NC}"
    exit 1
fi

# 2. Frontend Availability
echo ""
echo -n "Checking Frontend on port 80... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80)
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED ($HTTP_CODE)${NC}"
fi

# 3. Operations Status
echo ""
echo -n "Checking Orchestrator Status... "
ORCH_STATUS=$(docker inspect -f '{{.State.Status}}' predator_orchestrator 2>/dev/null)
if [ "$ORCH_STATUS" == "running" ]; then
    echo -e "${GREEN}RUNNING${NC}"
else
    echo -e "${RED}FAILED ($ORCH_STATUS)${NC}"
fi

# 4. Telegram Bot Status
echo -n "Checking Telegram Bot Status... "
BOT_STATUS=$(docker inspect -f '{{.State.Status}}' predator_telegram_bot 2>/dev/null)
if [ "$BOT_STATUS" == "running" ]; then
    echo -e "${GREEN}RUNNING${NC}"
else
    echo -e "${RED}FAILED ($BOT_STATUS)${NC}"
fi

# 5. Check for Critical Errors in Logs
echo ""
echo "Checking for recent critical errors..."
ERRORS=$(docker logs predator_backend --tail=100 2>&1 | grep -i "critical" | wc -l)
if [ "$ERRORS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️ Found $ERRORS critical errors in backend logs${NC}"
else
    echo -e "${GREEN}✅ No recent critical errors in backend${NC}"
fi

echo ""
echo -e "${GREEN}✨ Verification Complete!${NC}"
