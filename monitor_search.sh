#!/usr/bin/env bash

# Monitoring script for Predator Analytics
LOG=~/predator_monitor.log
DATE=$(date +"%Y-%m-%d %H:%M:%S")

# 1. Health check
if [[ $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health) != "200" ]]; then
  echo "$DATE - ❌ Server health check failed" >> $LOG
  exit 1
fi
echo "$DATE - ✅ Server health OK" >> $LOG

# 2. Check OpenSearch indices
if curl -s "http://localhost:9200/_cat/indices?v" | grep -q "documents_safe"; then
  DOCS_COUNT=$(curl -s "http://localhost:9200/_cat/indices?v" | grep documents_safe | awk '{print $7}')
  echo "$DATE - ✅ OpenSearch index present ($DOCS_COUNT documents)" >> $LOG
else
  echo "$DATE - ⚠️ OpenSearch index missing" >> $LOG
fi

# 3. Check Qdrant collection
if curl -s http://localhost:6333/collections | grep -q "documents_vectors"; then
  echo "$DATE - ✅ Qdrant collection present" >> $LOG
else
  echo "$DATE - ⚠️ Qdrant collection missing" >> $LOG
fi

# 4. Perform search test
RESULT=$(curl -s "http://localhost:8000/api/v1/search?q=test&mode=hybrid")
if [[ -z "$RESULT" ]]; then
  echo "$DATE - ❗ Empty search result" >> $LOG
else
  RESULT_COUNT=$(echo $RESULT | grep -o '"results"' | wc -l)
  echo "$DATE - 🔍 Search succeeded (response received)" >> $LOG
fi

# 5. Check Docker containers
RUNNING=$(docker ps --filter "name=predator" --format "{{.Names}}" | wc -l)
echo "$DATE - 🐳 Docker containers running: $RUNNING" >> $LOG

exit 0
