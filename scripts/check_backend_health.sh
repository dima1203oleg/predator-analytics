#!/bin/bash

BASE_URL="http://localhost:8090"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🏥 Checking Backend Health..."

# 1. Root Health
echo -n "Checking /health... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health)
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED ($HTTP_CODE)${NC}"
fi

# 2. System Status (Infrastructure)
echo -n "Checking /api/v1/system/infrastructure... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/v1/system/infrastructure)
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED ($HTTP_CODE)${NC}"
fi

# 3. List Documents
echo -n "Checking /api/v1/documents... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/v1/documents)
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED ($HTTP_CODE)${NC}"
fi
