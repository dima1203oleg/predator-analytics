#!/bin/bash
# CHAOS EXPERIMENT: Network Partition Isolation
# Target: Isolates a specific container from the network to test Arbiter failover.
# Usage: ./network_partition.sh <container_name> <duration_seconds>

CONTAINER=$1
DURATION=$2

if [ -z "$CONTAINER" ]; then
    echo "Usage: $0 <container_name> <duration>"
    exit 1
fi

echo "🔥 [CHAOS] Initiating Network Partition on $CONTAINER for ${DURATION}s..."

# 1. Inject Fault (Disconnect from bridge)
docker network disconnect predator-net $CONTAINER
echo "✅ [CHAOS] $CONTAINER isolated."

# 2. Wait
sleep $DURATION

# 3. Rollback (Heal)
echo "🚑 [CHAOS] Healing network partition..."
docker network connect predator-net $CONTAINER
echo "✅ [CHAOS] Connectivity restored."
