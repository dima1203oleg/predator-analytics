#!/bin/bash

echo "🦅 PREDATOR ANALYTICS v45 - SYSTEM HEALTH CHECK"
echo "==============================================="

# Check Docker Containers
echo -e "\n🐳 Checking Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep predator

# check backend
echo -e "\n🐍 Checking Backend API:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v45/system/status || echo "Backend unreachable"
if [ $? -eq 0 ]; then echo " OK"; else echo " FAIL"; fi

# check frontend
echo -e "\n⚛️ Checking Frontend:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "Frontend unreachable"
if [ $? -eq 0 ]; then echo " OK"; else echo " FAIL"; fi

# check opensearch
echo -e "\n🔍 Checking OpenSearch:"
curl -s -o /dev/null -w "%{http_code}" -k https://admin:admin@localhost:9200 || echo "OpenSearch unreachable"
if [ $? -eq 0 ]; then echo " OK"; else echo " FAIL"; fi

echo -e "\n✅ Check Complete"
