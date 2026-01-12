#!/bin/bash
echo "🔌 Disabling NVIDIA default runtime..."
# Reset daemon.json to standard safe defaults
echo '{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}' | sudo tee /etc/docker/daemon.json

echo "🔄 Restarting Docker..."
sudo systemctl restart docker

echo "✅ Docker restarted in standard mode (CPU only)."
