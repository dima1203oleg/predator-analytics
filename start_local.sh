#!/bin/bash

# Predator Analytics - Local Start Script
# This script uses Docker Compose to start the entire stack.

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Predator Analytics v21.0...${NC}"

# Check for Docker
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not installed or not in PATH.${NC}"
    exit 1
fi

# Check for Docker Compose
if ! command -v docker-compose >/dev/null 2>&1; then
    echo -e "${RED}Error: docker-compose is not installed.${NC}"
    echo -e "${YELLOW}Tip: Ensure Docker Desktop is running.${NC}"
    exit 1
fi

# Check for .env
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found.${NC}"
    echo "Creating default .env..."
    # (Content is already created by agent, but just in case)
    exit 1
fi

echo -e "${YELLOW}Building and starting services...${NC}"
echo "This may take a few minutes on the first run."

# Run Docker Compose
docker-compose up -d --build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}==========================================${NC}"
    echo -e "${GREEN}   System Started Successfully!           ${NC}"
    echo -e "${GREEN}==========================================${NC}"
    echo ""
    echo -e "📱 Frontend:   ${YELLOW}http://localhost:8082${NC}"
    echo -e "🔌 API Docs:   ${YELLOW}http://localhost:8000/docs${NC}"
    echo -e "💾 MinIO:      ${YELLOW}http://localhost:9001${NC}"
    echo ""
    echo "To stop the system, run: docker-compose down"
else
    echo -e "${RED}Failed to start services.${NC}"
    exit 1
fi
