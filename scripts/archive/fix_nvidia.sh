#!/bin/bash
# Fix NVIDIA Container Toolkit issue
echo "🔧 Fixing NVIDIA Container Runtime..."
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
echo "✅ Docker restarted. Trying to start orchestrator..."
cd ~/predator-analytics
docker compose up -d orchestrator
