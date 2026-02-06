#!/bin/bash
echo "🔧 Configuring NVIDIA Container Toolkit..."

# 1. Generate CDI specification (sometimes needed for newer versions)
# sudo nvidia-ctk cdi generate --output=/etc/cdi/nvidia.yaml

# 2. Configure Docker daemon
sudo nvidia-ctk runtime configure --runtime=docker

# 3. Restart Docker to apply changes
echo "🔄 Restarting Docker..."
sudo systemctl restart docker

# 4. Test Docker GPU access
echo "🧪 Testing Docker GPU access..."
if sudo docker run --rm --gpus all ubuntu:latest nvidia-smi; then
    echo "✅ GPU is accessible from Docker!"
else
    echo "❌ GPU is NOT accessible from Docker check logs."
    # Fallback: try legacy setup
    # echo "⚠️ Attempting legacy setup..."
    # sudo nvidia-container-toolkit configure --runtime=docker
    # sudo systemctl restart docker
fi

echo "🚀 Restarting containers..."
cd ~/predator-analytics
docker compose up -d
