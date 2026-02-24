#!/bin/bash
set -e

apt-get update && apt-get install -y curl gnupg2 lsb-release

if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

if ! dpkg -l | grep -q nvidia-container-toolkit; then
    curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
    curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
    apt-get update && apt-get install -y nvidia-container-toolkit
    nvidia-ctk runtime configure --runtime=docker
    systemctl restart docker
fi

nvidia-smi

if ! id "devuser" &>/dev/null; then
    useradd -m -s /bin/bash devuser
    echo "devuser ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/devuser
fi
usermod -aG docker devuser

sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/' /etc/ssh/sshd_config
systemctl reload ssh

sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" >> /etc/sysctl.conf

echo "devuser soft nofile 65536" >> /etc/security/limits.conf
echo "devuser hard nofile 65536" >> /etc/security/limits.conf

mkdir -p /opt/dev/predator /opt/dev/infra /opt/dev/helm
chown -R devuser:devuser /opt/dev
chmod -R 755 /opt/dev

# Dev Container Hardening
echo "Hardening Dev Container environment..."

# 1. Ensure devuser is in the docker group
usermod -aG docker devuser

# 2. Ensure docker.sock has correct group permissions (660)
chmod 660 /var/run/docker.sock
chown root:docker /var/run/docker.sock

# 3. System optimization
sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" > /etc/sysctl.d/99-predator.conf
