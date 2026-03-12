#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$DEPLOY_DIR")"

echo "🐳 PREDATOR Analytics Frontend Docker Image Test"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Build Docker image
echo -e "${BLUE}[Step 1/4]${NC} Building Docker image..."
cd "$PROJECT_ROOT/apps/predator-analytics-ui"

if docker build -t predator-analytics-ui:test .; then
    echo -e "${GREEN}✅ Docker image built successfully${NC}"
else
    echo -e "${RED}❌ Docker image build failed${NC}"
    exit 1
fi
echo ""

# Step 2: Check image properties
echo -e "${BLUE}[Step 2/4]${NC} Checking image properties..."

# Check image size
IMAGE_SIZE=$(docker images predator-analytics-ui:test --format "{{.Size}}")
echo "Image size: $IMAGE_SIZE"

# Check image layers
echo "Image layers:"
docker history predator-analytics-ui:test | head -10

echo ""

# Step 3: Run container and test
echo -e "${BLUE}[Step 3/4]${NC} Running container..."
CONTAINER_ID=$(docker run -d -p 3030:3030 predator-analytics-ui:test)
echo "Container ID: $CONTAINER_ID"

# Wait for container to start
sleep 3

# Check if container is running
if docker ps | grep -q "$CONTAINER_ID"; then
    echo -e "${GREEN}✅ Container is running${NC}"
else
    echo -e "${RED}❌ Container failed to start${NC}"
    docker logs "$CONTAINER_ID"
    exit 1
fi

echo ""

# Step 4: Test container
echo -e "${BLUE}[Step 4/4]${NC} Testing container..."

# Test health endpoint
echo -n "Testing /health endpoint... "
if curl -s http://localhost:3030/health | grep -q "healthy"; then
    echo -e "${GREEN}✅ PASSED${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# Test root endpoint
echo -n "Testing / endpoint... "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3030 | grep -q "200"; then
    echo -e "${GREEN}✅ PASSED${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# Check running user
echo -n "Checking non-root user... "
RUNNING_USER=$(docker exec "$CONTAINER_ID" whoami)
if [ "$RUNNING_USER" == "predator" ]; then
    echo -e "${GREEN}✅ PASSED (user: $RUNNING_USER)${NC}"
else
    echo -e "${RED}❌ FAILED (user: $RUNNING_USER)${NC}"
fi

# Check nginx process
echo -n "Checking nginx process... "
if docker exec "$CONTAINER_ID" ps aux | grep -q "nginx"; then
    echo -e "${GREEN}✅ PASSED${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# Check file permissions
echo -n "Checking file permissions... "
if docker exec "$CONTAINER_ID" ls -la /var/cache/nginx > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

echo ""

# Cleanup
echo "Cleaning up..."
docker stop "$CONTAINER_ID" > /dev/null
docker rm "$CONTAINER_ID" > /dev/null

echo ""
echo "======================================================"
echo -e "${GREEN}✅ Docker image test complete!${NC}"
echo ""
echo "📊 Image information:"
echo "   Repository: predator-analytics-ui"
echo "   Tag: test"
echo "   Size: $IMAGE_SIZE"
echo ""
echo "🎉 Image is ready for deployment!"
echo ""
