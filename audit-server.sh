#!/bin/bash
set -e

echo "🚀 [AUDIT] Starting Predator v29-S Server Audit..."

# Detect OS
OS_TYPE=$(uname -s)

# 1. CPU Audit
echo "--- CPU ---"
if [ "$OS_TYPE" == "Darwin" ]; then
    CPU_CORES=$(sysctl -n hw.ncpu)
elif [ "$OS_TYPE" == "Linux" ]; then
    CPU_CORES=$(nproc)
else
    CPU_CORES="Unknown"
fi
echo "Cores: $CPU_CORES"
if [ "$CPU_CORES" != "Unknown" ] && [ "$CPU_CORES" -lt 16 ]; then
    echo "⚠️ WARNING: CPU cores < 16 (Recommended 20+)"
else
    echo "✅ CPU cores sufficient ($CPU_CORES cores)"
fi

# 2. RAM Audit
echo "--- RAM ---"
if [ "$OS_TYPE" == "Darwin" ]; then
    RAM_BYTES=$(sysctl -n hw.memsize)
    RAM_GB=$(echo "scale=0; $RAM_BYTES/1024/1024/1024" | bc)
elif [ "$OS_TYPE" == "Linux" ]; then
    RAM_GB=$(free -g | awk '/Mem:/ {print $2}')
else
    RAM_GB="Unknown"
fi
echo "Total RAM: ${RAM_GB} GB"
if [ "$RAM_GB" != "Unknown" ] && [ "$RAM_GB" -lt 48 ]; then
    echo "⚠️ WARNING: RAM < 48 GB (Recommended 64+)"
else
    echo "✅ RAM sufficient (${RAM_GB} GB)"
fi

# 3. GPU Audit
echo "--- GPU ---"
if command -v nvidia-smi &> /dev/null; then
    nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader
    echo "✅ NVIDIA GPU detected"
else
    echo "⚠️ WARNING: No NVIDIA GPU detected or nvidia-smi not in PATH"
fi

# 4. Storage Audit
echo "--- Storage ---"
df -h / | grep /
if [ "$OS_TYPE" == "Darwin" ]; then
    FREE_SPACE=$(df -g / | awk 'NR==2 {print $4}')
elif [ "$OS_TYPE" == "Linux" ]; then
    FREE_SPACE=$(df -BG / | awk 'NR==2 {gsub("G",""); print $4}')
else
    FREE_SPACE=0
fi
echo "Free Space on root: ${FREE_SPACE} GB"
if [ "$FREE_SPACE" -lt 100 ]; then
    echo "⚠️ WARNING: Free disk space < 100 GB"
else
    echo "✅ Storage sufficient (${FREE_SPACE} GB free)"
fi

# 5. OS Audit
echo "--- OS ---"
if [ "$OS_TYPE" == "Darwin" ]; then
    sw_vers
elif [ "$OS_TYPE" == "Linux" ]; then
    cat /etc/os-release | head -5
else
    echo "Unknown OS"
fi

# 6. Docker Audit (v29-S specific)
echo "--- Docker ---"
if command -v docker &> /dev/null; then
    docker --version
    RUNNING_CONTAINERS=$(docker ps -q 2>/dev/null | wc -l | tr -d ' ')
    echo "Running containers: $RUNNING_CONTAINERS"
    echo "✅ Docker available"
else
    echo "❌ Docker NOT FOUND (Required for v29-S)"
fi

# 7. v29-S Services Check
echo "--- v29-S Critical Services ---"
REQUIRED_SERVICES=("postgres" "redis" "backend" "frontend" "som" "vpc")
if command -v docker &> /dev/null; then
    for svc in "${REQUIRED_SERVICES[@]}"; do
        if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "predator_$svc"; then
            echo "✅ $svc: Running"
        else
            echo "⚠️ $svc: Not running"
        fi
    done
fi

echo ""
echo "✅ Audit Complete."
