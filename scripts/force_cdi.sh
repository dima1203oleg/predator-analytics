#!/bin/bash
echo "🔧 Forcing CDI mode in config..."
sudo sed -i 's/mode = "auto"/mode = "cdi"/' /etc/nvidia-container-runtime/config.toml
echo "Config updated:"
grep "mode =" /etc/nvidia-container-runtime/config.toml

echo "🔄 Restarting Docker..."
sudo systemctl restart docker

echo "🧪 Verifying Docker (CDI)..."
sudo docker run --rm --device=nvidia.com/gpu=all ubuntu nvidia-smi
# Note: CDI usage usually requires --device or standard --gpus depending on integration.
# If mode=cdi, --gpus all should ideally translate or use the cdi spec injection.
# But let's try standard way first.
sudo docker run --rm --gpus all nvidia/cuda:12.2.0-base-ubuntu22.04 nvidia-smi
