#!/usr/bin/env bash

# Production Tests - Comprehensive validation of all features

TEST_LOG=~/predator_tests.log
DATE=$(date +"%Y-%m-%d %H:%M:%S")
FAILED=0
PASSED=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a $TEST_LOG
echo "$DATE - Running production tests..." | tee -a $TEST_LOG
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a $TEST_LOG

# Test 1: Backend Health
echo -n "Test 1: Backend health endpoint... " | tee -a $TEST_LOG
HEALTH=$(curl -s http://localhost:8000/health | grep -o '"status":"ok"')
if [ -n "$HEALTH" ]; then
    echo "✅ PASSED" | tee -a $TEST_LOG
    ((PASSED++))
else
    echo "❌ FAILED" | tee -a $TEST_LOG
    ((FAILED++))
fi

# Test 2: Frontend Loading
echo -n "Test 2: Frontend loading... " | tee -a $TEST_LOG
FRONTEND=$(curl -s http://localhost:8082 | grep -o "Predator")
if [ -n "$FRONTEND" ]; then
    echo "✅ PASSED" | tee -a $TEST_LOG
    ((PASSED++))
else
    echo "❌ FAILED" | tee -a $TEST_LOG
    ((FAILED++))
fi

# Test 3: Text Search
echo -n "Test 3: Text search functionality... " | tee -a $TEST_LOG
SEARCH_RESULT=$(curl -s "http://localhost:8000/api/v1/search/?q=logistics&mode=text&limit=3" | grep -o '"searchType":"text"')
if [ -n "$SEARCH_RESULT" ]; then
    echo "✅ PASSED" | tee -a $TEST_LOG
    ((PASSED++))
else
    echo "❌ FAILED" | tee -a $TEST_LOG
    ((FAILED++))
fi

# Test 4: OpenSearch Index
echo -n "Test 4: OpenSearch index exists... " | tee -a $TEST_LOG
INDEX=$(curl -s "http://localhost:9200/_cat/indices" | grep "documents_safe")
if [ -n "$INDEX" ]; then
    echo "✅ PASSED" | tee -a $TEST_LOG
    ((PASSED++))
else
    echo "❌ FAILED" | tee -a $TEST_LOG
    ((FAILED++))
fi

# Test 5: Qdrant Collection
echo -n "Test 5: Qdrant collection exists... " | tee -a $TEST_LOG
COLLECTION=$(curl -s http://localhost:6333/collections | grep "documents_vectors")
if [ -n "$COLLECTION" ]; then
    echo "✅ PASSED" | tee -a $TEST_LOG
    ((PASSED++))
else
    echo "❌ FAILED" | tee -a $TEST_LOG
    ((FAILED++))
fi

# Test 6: PostgreSQL Connection
echo -n "Test 6: PostgreSQL connection... " | tee -a $TEST_LOG
PGTEST=$(docker exec predator_postgres pg_isready -U predator 2>&1 | grep "accepting connections")
if [ -n "$PGTEST" ]; then
    echo "✅ PASSED" | tee -a $TEST_LOG
    ((PASSED++))
else
    echo "❌ FAILED" | tee -a $TEST_LOG
    ((FAILED++))
fi

# Test 7: Redis Connection
echo -n "Test 7: Redis connection... " | tee -a $TEST_LOG
REDISTEST=$(docker exec predator_redis redis-cli ping 2>&1 | grep "PONG")
if [ -n "$REDISTEST" ]; then
    echo "✅ PASSED" | tee -a $TEST_LOG
    ((PASSED++))
else
    echo "❌ FAILED" | tee -a $TEST_LOG
    ((FAILED++))
fi

# Test 8: Container Count
echo -n "Test 8: Expected containers running... " | tee -a $TEST_LOG
CONTAINERS=$(docker ps --filter "name=predator" | wc -l | tr -d ' ')
if [ "$CONTAINERS" -ge 12 ]; then
    echo "✅ PASSED ($CONTAINERS containers)" | tee -a $TEST_LOG
    ((PASSED++))
else
    echo "❌ FAILED (only $CONTAINERS containers)" | tee -a $TEST_LOG
    ((FAILED++))
fi

# Test 9: OpenSearch Cluster Health
echo -n "Test 9: OpenSearch cluster health... " | tee -a $TEST_LOG
OSHEALTH=$(curl -s 'http://localhost:9200/_cluster/health' | grep -o '"status":"green"')
if [ -n "$OSHEALTH" ]; then
    echo "✅ PASSED (green)" | tee -a $TEST_LOG
    ((PASSED++))
else
    # Check if yellow
    OSYELLOW=$(curl -s 'http://localhost:9200/_cluster/health' | grep -o '"status":"yellow"')
    if [ -n "$OSYELLOW" ]; then
        echo "⚠️  WARNING (yellow status)" | tee -a $TEST_LOG
        ((PASSED++))
    else
        echo "❌ FAILED (red status)" | tee -a $TEST_LOG
        ((FAILED++))
    fi
fi

# Test 10: ML Services (Embeddings)
echo -n "Test 10: ML embedding service... " | tee -a $TEST_LOG
BACKEND_LOGS=$(docker logs predator_backend 2>&1 | grep "Embedding service initialized")
if [ -n "$BACKEND_LOGS" ]; then
    echo "✅ PASSED" | tee -a $TEST_LOG
    ((PASSED++))
else
    echo "❌ FAILED" | tee -a $TEST_LOG
    ((FAILED++))
fi

# Summary
echo "" | tee -a $TEST_LOG
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a $TEST_LOG
echo "Test Results Summary:" | tee -a $TEST_LOG
echo "  ✅ Passed: $PASSED" | tee -a $TEST_LOG
echo "  ❌ Failed: $FAILED" | tee -a $TEST_LOG
echo "  📊 Total:  $(($PASSED + $FAILED))" | tee -a $TEST_LOG
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a $TEST_LOG

if [ $FAILED -eq 0 ]; then
    echo "🎉 All tests passed!" | tee -a $TEST_LOG
    exit 0
else
    echo "⚠️  Some tests failed. Check logs for details." | tee -a $TEST_LOG
    exit 1
fi
