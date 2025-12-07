#!/usr/bin/env bash

# Production Health Check and Auto-Healing Script
# Monitors all services and automatically restarts failed containers

LOG_FILE=~/predator_health.log
DATE=$(date +"%Y-%m-%d %H:%M:%S")
RESTART_THRESHOLD=3

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> $LOG_FILE
echo "$DATE - Running production health check..." >> $LOG_FILE

# Function to check and restart container if needed
check_container() {
    local container_name=$1
    local health_endpoint=$2
    
    if ! docker ps | grep -q "$container_name"; then
        echo "$DATE - ❌ $container_name not running. Restarting..." >> $LOG_FILE
        docker-compose restart $container_name
        return 1
    fi
    
    # Check if container is in restart loop
    RESTART_COUNT=$(docker inspect $container_name --format='{{.RestartCount}}')
    if [ "$RESTART_COUNT" -gt "$RESTART_THRESHOLD" ]; then
        echo "$DATE - ⚠️ $container_name restarting too many times ($RESTART_COUNT). Needs attention." >> $LOG_FILE
        return 1
    fi
    
    echo "$DATE - ✅ $container_name running (restarts: $RESTART_COUNT)" >> $LOG_FILE
    return 0
}

# Check critical services
check_container "predator_backend" "http://localhost:8000/health"
check_container "predator_frontend" 
check_container "predator_postgres"
check_container "predator_opensearch"
check_container "predator_qdrant"
check_container "predator_redis"

# Check backend health endpoint
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
if [ "$HEALTH_STATUS" != "200" ]; then
    echo "$DATE - ❌ Backend health check failed (HTTP $HEALTH_STATUS). Restarting backend..." >> $LOG_FILE
    docker-compose restart backend
else
    echo "$DATE - ✅ Backend health OK (HTTP $HEALTH_STATUS)" >> $LOG_FILE
fi

# Check OpenSearch cluster health
OS_HEALTH=$(curl -s http://localhost:9200/_cluster/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
echo "$DATE - 📊 OpenSearch cluster status: $OS_HEALTH" >> $LOG_FILE

if [ "$OS_HEALTH" = "red" ]; then
    echo "$DATE - ❌ OpenSearch in RED state. Restarting..." >> $LOG_FILE
    docker-compose restart opensearch
fi

# Check Qdrant health
QDRANT_STATUS=$(curl -s http://localhost:6333/collections | grep -o '"status":"ok"' || echo "failed")
if [ "$QDRANT_STATUS" = "failed" ]; then
    echo "$DATE - ❌ Qdrant health check failed. Restarting..." >> $LOG_FILE
    docker-compose restart qdrant
else
    echo "$DATE - ✅ Qdrant healthy" >> $LOG_FILE
fi

# Disk space check
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "$DATE - ⚠️ Disk usage at ${DISK_USAGE}% - cleanup recommended" >> $LOG_FILE
fi

# Memory check
MEM_USAGE=$(vm_stat | awk '/Pages free/ {free=$3} /Pages active/ {active=$3} /Pages inactive/ {inactive=$3} END {total=free+active+inactive; used=active+inactive; print int(used/total*100)}')
echo "$DATE - 💾 Memory usage: ${MEM_USAGE}%" >> $LOG_FILE

# Count running containers
CONTAINER_COUNT=$(docker ps --filter "name=predator" --format "{{.Names}}" | wc -l | tr -d ' ')
echo "$DATE - 🐳 Containers running: $CONTAINER_COUNT/14" >> $LOG_FILE

# Test search functionality
SEARCH_TEST=$(curl -s "http://localhost:8000/api/v1/search/?q=test&mode=text&limit=1" | grep -o '"searchType"' || echo "failed")
if [ "$SEARCH_TEST" = "failed" ]; then
    echo "$DATE - ❌ Search functionality test failed" >> $LOG_FILE
else
    echo "$DATE - ✅ Search functionality OK" >> $LOG_FILE
fi

echo "$DATE - Health check completed" >> $LOG_FILE
echo "" >> $LOG_FILE

# Keep only last 1000 lines of log
tail -n 1000 $LOG_FILE > ${LOG_FILE}.tmp && mv ${LOG_FILE}.tmp $LOG_FILE

exit 0
