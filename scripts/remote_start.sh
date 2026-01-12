#!/bin/bash
cd ~/predator-analytics
echo "🏗️ Building services..."
# Use default build (cached)
docker compose build
echo "🚀 Starting services..."
docker compose up -d --remove-orphans
echo "✅ Services started."
docker compose ps
