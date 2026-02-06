#!/bin/bash
# Deep fix for NVIDIA drivers & Container Toolkit
echo "🔧 Deep fixing NVIDIA setup..."

# 1. Update Drivers (headless mode)
sudo ubuntu-drivers autoinstall

# 2. Reset Docker config
sudo rm -f /etc/docker/daemon.json
sudo nvidia-ctk runtime configure --runtime=docker

# 3. Force reload libraries
sudo ldconfig

# 4. Restart services
sudo systemctl restart docker

echo "✅ Drivers reloaded. Trying to start orchestrator..."
cd ~/predator-analytics
docker compose up -d orchestrator
