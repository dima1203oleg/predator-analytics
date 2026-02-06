#!/bin/bash
echo "🔗 Creating fallback symlink..."
sudo ln -sf /usr/lib/x86_64-linux-gnu/libnvidia-ml.so.1 /usr/lib/libnvidia-ml.so.1
sudo ldconfig
echo "🧪 Verifying Docker..."
sudo docker run --rm --gpus all nvidia/cuda:12.2.0-base-ubuntu22.04 nvidia-smi
