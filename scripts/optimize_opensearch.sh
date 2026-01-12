#!/usr/bin/env bash

# OpenSearch Optimization Script
# Fixes yellow cluster status and optimizes performance

echo "Optimizing OpenSearch configuration..."

# Set recommended settings for single-node cluster
curl -X PUT 'http://localhost:9200/_cluster/settings' -H 'Content-Type: application/json' -d '{
  "persistent": {
    "cluster.routing.allocation.disk.threshold_enabled": true,
    "cluster.routing.allocation.disk.watermark.low": "85%",
    "cluster.routing.allocation.disk.watermark.high": "90%",
    "cluster.routing.allocation.disk.watermark.flood_stage": "95%"
  }
}'

# Update index settings to not require replicas (single node)
curl -X PUT 'http://localhost:9200/documents_safe/_settings' -H 'Content-Type: application/json' -d '{
  "index": {
    "number_of_replicas": 0,
    "refresh_interval": "30s",
    "translog.durability": "async",
    "translog.sync_interval": "30s"
  }
}'

# Force merge to optimize segments
curl -X POST 'http://localhost:9200/documents_safe/_forcemerge?max_num_segments=1'

# Check cluster health
echo -e "\n\nCluster health after optimization:"
curl -s 'http://localhost:9200/_cluster/health?pretty'

echo -e "\n\n✅ OpenSearch optimization completed"
