#!/bin/bash
# 🦅 PREDATOR Analytics — Node Status Report (Bash Edition)

NODES=(
    "NVIDIA Direct|http://194.177.1.240:8000/health"
    "NVIDIA ZROK|https://predator.share.zrok.io/health"
    "NVIDIA Colab Mirror|https://predator-mirror.share.zrok.io/health"
    "Local Mock API|http://localhost:9080/api/v1/health"
)

echo "🦅 PREDATOR Analytics — Node Status Report"
echo "============================================================"
printf "%-25s | %-12s | %-8s | %s\n" "Node Name" "Status" "Latency" "Version"
echo "------------------------------------------------------------"

for node in "${NODES[@]}"; do
    IFS='|' read -r name url <<< "$node"
    
    start_time=$(python3 -c "import time; print(time.time())")
    response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "$url")
    end_time=$(python3 -c "import time; print(time.time())")
    
    latency=$(python3 -c "print(int(($end_time - $start_time) * 1000))")
    
    if [ "$response" == "200" ]; then
        version=$(curl -s "$url" | python3 -c "import sys, json; print(json.load(sys.stdin).get('version', 'n/a'))" 2>/dev/null || echo "n/a")
        printf "%-25s | \033[0;32m%-12s\033[0m | %-8s | %s\n" "$name" "✅ ONLINE" "${latency}ms" "$version"
    elif [ "$response" == "000" ]; then
        printf "%-25s | \033[0;31m%-12s\033[0m | %-8s | %s\n" "$name" "🔴 OFFLINE" "-" "-"
    else
        printf "%-25s | \033[0;33m%-12s\033[0m | %-8s | %s\n" "$name" "❌ ERR ($response)" "-" "-"
    fi
done

echo "============================================================"
