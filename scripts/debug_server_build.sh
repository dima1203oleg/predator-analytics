#!/bin/bash
set -e

echo "1. Checking directory structure..."
ls -R predator-analytics/apps/backend/src | head -n 20

echo "2. Building Docker image explicitly..."
cd predator-analytics
export DOCKER_BUILDKIT=1
docker build --no-cache -f apps/backend/Dockerfile.prod -t debug_backend .

echo "3. Verifying /app/src in the new image..."
docker run --rm debug_backend ls -R /app/src || echo "Listing failed"

echo "4. Verifying /app content..."
docker run --rm debug_backend ls -R /app | grep src || echo "No src in /app"
