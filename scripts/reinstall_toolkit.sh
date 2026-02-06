#!/bin/bash
set -e

echo "☢️ NUKE AND PAVING NVIDIA CONTAINER TOOLKIT..."

ensure_nvml_soname() {
    if ldconfig -p 2>/dev/null | grep -qE 'libnvidia-ml\.so\.1\b'; then
        return 0
    fi

    local nvml_path
    nvml_path="$(find /usr/lib /usr/local/lib -type f -name 'libnvidia-ml.so.*' 2>/dev/null | grep -vE 'libnvidia-ml\.so\.1$' | head -n 1 || true)"
    if [ -z "${nvml_path}" ]; then
        echo "❌ Could not locate libnvidia-ml.so.* on host"
        return 1
    fi

    sudo ln -sf "${nvml_path}" "$(dirname "${nvml_path}")/libnvidia-ml.so.1"
    sudo ldconfig

    if ! ldconfig -p 2>/dev/null | grep -qE 'libnvidia-ml\.so\.1\b'; then
        echo "❌ libnvidia-ml.so.1 still not visible after ldconfig"
        return 1
    fi
}

ensure_docker_default_runtime_nvidia() {
    sudo mkdir -p /etc/docker
    if [ ! -f /etc/docker/daemon.json ]; then
        echo '{}' | sudo tee /etc/docker/daemon.json >/dev/null
    fi

    sudo python3 - <<'PY'
import json

path = '/etc/docker/daemon.json'
with open(path, 'r', encoding='utf-8') as f:
    try:
        data = json.load(f)
    except json.JSONDecodeError:
        data = {}

runtimes = data.get('runtimes') or {}
runtimes.setdefault('nvidia', {'path': 'nvidia-container-runtime', 'args': []})
data['runtimes'] = runtimes
data['default-runtime'] = 'nvidia'

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4, sort_keys=True)
    f.write('\n')
PY
}

# 1. Remove existing toolkit
sudo apt-get purge -y nvidia-container-toolkit nvidia-container-runtime libnvidia-container-tools libnvidia-container1 || true
sudo apt-get autoremove -y

# 2. Add repository (ensure it is correct)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
  && curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

sudo apt-get update

# 3. Install toolkit
sudo apt-get install -y nvidia-container-toolkit

ensure_nvml_soname

# 4. Generate CDI (Common Device Interface) configuration - Critical for newer setups
echo "⚙️ Generating CDI config..."
sudo nvidia-ctk cdi generate --output=/etc/cdi/nvidia.yaml

# 5. Configure Docker Daemon explicitly
echo "⚙️ Configuring Docker Runtime..."
sudo nvidia-ctk runtime configure --runtime=docker

ensure_docker_default_runtime_nvidia

# 6. Restart Docker
echo "🔄 Restarting Docker..."
sudo systemctl restart docker

# 7. Verification
echo "🧪 verification: Running nvidia-smi inside docker..."
if sudo docker run --rm --gpus all nvidia/cuda:12.2.0-base-ubuntu22.04 nvidia-smi; then
    echo "✅ SUCCESS! GPU is working in Docker."

    # 8. Restart Application
    echo "🚀 Starting Predator application..."
    cd ~/predator-analytics
    docker compose up -d
else
    echo "❌ FAILURE! GPU still not accessible."
    echo "🔍 Debug info:"
    sudo nvidia-container-cli info
    exit 1
fi
