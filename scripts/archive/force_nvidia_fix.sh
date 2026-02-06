#!/bin/bash
# Force cleanup and reinstall of NVIDIA libraries
echo "🔧 FORCE FIXING NVIDIA LIBRARIES..."

# 1. Manually remove conflicting packages
sudo dpkg --remove --force-all libnvidia-egl-gbm1
sudo dpkg --remove --force-all libnvidia-gl-575
sudo dpkg --remove --force-all nvidia-driver-575

# 2. Fix broken install
sudo apt-get install -f -y

# 3. Explicitly install stable driver version
sudo apt-get install -y nvidia-driver-535-server

# 4. Reload libraries
sudo ldconfig

# 5. Restart Docker
sudo systemctl restart docker

echo "✅ Libraries patched. Retrying orchestrator..."
cd ~/predator-analytics
docker compose up -d orchestrator
