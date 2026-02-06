#!/bin/bash
set -e
echo "🔧 Finishing installation..."

# Ensure we don't get prompted for config file replacement
export DEBIAN_FRONTEND=noninteractive

echo "📦 Installing toolkit..."
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit

echo "⚙️ Configuring Docker..."
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker

echo "✅ Docker restarted. Verifying..."
sudo docker run --rm --gpus all nvidia/cuda:12.2.0-base-ubuntu22.04 nvidia-smi
