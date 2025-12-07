#!/usr/bin/env bash

# Performance Testing Script for Predator Analytics

echo "🚀 Starting Performance Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Configuration
API_BASE="http://localhost:8000/api/v1"
CONCURRENT_USERS=10
REQUESTS_PER_USER=20

echo "Configuration:"
echo "  Base URL: $API_BASE"
echo "  Concurrent users: $CONCURRENT_USERS"
echo "  Requests per user: $REQUESTS_PER_USER"
echo ""

# Test 1: Health Endpoint Latency
echo "Test 1: Health Endpoint Performance"
echo "------------------------------------"
for i in {1..100}; do
    curl -s -o /dev/null -w "%{time_total}\n" http://localhost:8000/health >> /tmp/health_times.txt
done

AVG_HEALTH=$(awk '{ total += $1; count++ } END { print total/count*1000 }' /tmp/health_times.txt)
echo "  Average response time: ${AVG_HEALTH}ms"
rm /tmp/health_times.txt

# Test 2: Text Search Performance
echo ""
echo "Test 2: Text Search Performance"
echo "--------------------------------"

SEARCH_QUERIES=("logistics" "bank" "company" "trade" "export")

for query in "${SEARCH_QUERIES[@]}"; do
    START=$(date +%s%N)
    curl -s "$API_BASE/search/?q=$query&mode=text&limit=10" > /dev/null
    END=$(date +%s%N)
    DURATION=$(( (END - START) / 1000000 ))
    echo "  Query '$query': ${DURATION}ms"
done

# Test 3: Hybrid Search Performance
echo ""
echo "Test 3: Hybrid Search Performance (with ML)"
echo "-------------------------------------------"

for query in "${SEARCH_QUERIES[@]}"; do
    START=$(date +%s%N)
    curl -s "$API_BASE/search/?q=$query&mode=hybrid&limit=10" > /dev/null
    END=$(date +%s%N)
    DURATION=$(( (END - START) / 1000000 ))
    echo "  Query '$query': ${DURATION}ms"
done

# Test 4: Concurrent Load Test
echo ""
echo "Test 4: Concurrent Load Test"
echo "-----------------------------"

load_test_worker() {
    local user_id=$1
    local total_time=0
    local count=0
    
    for i in $(seq 1 $REQUESTS_PER_USER); do
        query=${SEARCH_QUERIES[$RANDOM % ${#SEARCH_QUERIES[@]}]}
        START=$(date +%s%N)
        curl -s "$API_BASE/search/?q=$query&mode=text&limit=5" > /dev/null 2>&1
        END=$(date +%s%N)
        duration=$(( (END - START) / 1000000 ))
        total_time=$((total_time + duration))
        count=$((count + 1))
    done
    
    avg=$((total_time / count))
    echo "$user_id,$avg" >> /tmp/load_test_results.txt
}

echo "  Launching $CONCURRENT_USERS concurrent users..."
rm -f /tmp/load_test_results.txt

for i in $(seq 1 $CONCURRENT_USERS); do
    load_test_worker $i &
done

# Wait for all background jobs
wait

# Calculate statistics
echo "  Results:"
AVG_CONCURRENT=$(awk -F',' '{ total += $2; count++ } END { print total/count }' /tmp/load_test_results.txt)
MIN_CONCURRENT=$(awk -F',' '{ if(min==""){min=$2}; if($2<min){min=$2}} END { print min }' /tmp/load_test_results.txt)
MAX_CONCURRENT=$(awk -F',' '{ if($2>max){max=$2}} END { print max }' /tmp/load_test_results.txt)

echo "    Average response time: ${AVG_CONCURRENT}ms"
echo "    Min response time: ${MIN_CONCURRENT}ms"
echo "    Max response time: ${MAX_CONCURRENT}ms"
echo "    Total requests: $((CONCURRENT_USERS * REQUESTS_PER_USER))"

rm -f /tmp/load_test_results.txt

# Test 5: OpenSearch Query Performance
echo ""
echo "Test 5: OpenSearch Direct Query Performance"
echo "-------------------------------------------"

START=$(date +%s%N)
curl -s "http://localhost:9200/documents_safe/_search" -H 'Content-Type: application/json' -d '{
  "query": {"match_all": {}},
  "size": 10
}' > /dev/null
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))
echo "  Match all query (10 docs): ${DURATION}ms"

START=$(date +%s%N)
curl -s "http://localhost:9200/documents_safe/_search" -H 'Content-Type: application/json' -d '{
  "query": {"multi_match": {"query": "logistics", "fields": ["title", "description"]}},
  "size": 10
}' > /dev/null
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))
echo "  Multi-match query: ${DURATION}ms"

# Test 6: Qdrant Query Performance
echo ""
echo "Test 6: Qdrant Vector Search Performance"
echo "-----------------------------------------"

START=$(date +%s%N)
curl -s http://localhost:6333/collections/documents_vectors > /dev/null
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))
echo "  Collection info: ${DURATION}ms"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Performance Testing Completed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Summary:"
echo "  Health endpoint: ${AVG_HEALTH}ms avg"
echo "  Concurrent load: ${AVG_CONCURRENT}ms avg (${CONCURRENT_USERS} users)"
echo "  System appears: $([ ${AVG_CONCURRENT%.*} -lt 1000 ] && echo '✅ FAST' || echo '⚠️ SLOW')"
echo ""
