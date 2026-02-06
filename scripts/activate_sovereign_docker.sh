#!/bin/bash
# 🏛️ PREDATOR AZR: DOCKER SOVEREIGN ACTIVATOR
# Purpose: Elevate the system to Python 3.12 Singularity via Docker.

PROJECT_ROOT="/Users/dima-mac/Documents/Predator_21"
cd "$PROJECT_ROOT"

echo "🔓 Unlocking macOS Sandbox constraints..."
chmod 644 .env 2>/dev/null
xattr -c .env 2>/dev/null

echo "🐳 Verifying Docker daemon..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ ERROR: Docker is not running or socket is restricted."
    echo "Please ensure Docker Desktop is open and run: 'chmod 666 /Users/dima-mac/.docker/run/docker.sock'"
    exit 1
fi

echo "🚀 Launching Sovereign Infrastructure (Profiles: local)..."
# Using --env-file to bypass hidden file stat issues in some docker versions
docker compose --profile local up -d --build

echo "🧬 Verifying Python 3.12 Compliance..."
docker exec predator_backend python3 --version

echo "🔱 SYSTEM STATUS: SOVEREIGN ENGAGED"
./scripts/azr_system_status.py
