#!/bin/bash

# Robust Docker Image Puller
# Pulls images sequentially to avoid network timeouts

IMAGES=(
    "postgres:15-alpine"
    "redis:7-alpine"
    "minio/minio"
    "qdrant/qdrant:latest"
    "opensearchproject/opensearch:2.11.0"
    "opensearchproject/opensearch-dashboards:2.11.0"
    "quay.io/keycloak/keycloak:23.0"
    "ghcr.io/mlflow/mlflow:latest"
    "grafana/grafana:latest"
    "prom/prometheus:latest"
)

echo "Starting sequential pull of ${#IMAGES[@]} images..."

for img in "${IMAGES[@]}"; do
    echo "---------------------------------------------------"
    echo "Pulling $img..."
    
    # Retry loop
    n=0
    until [ "$n" -ge 5 ]
    do
       docker pull "$img" && break
       n=$((n+1)) 
       echo "Pull failed. Retrying in 5 seconds... ($n/5)"
       sleep 5
    done
    
    if [ "$n" -eq 5 ]; then 
        echo "Failed to pull $img after 5 attempts."
        exit 1
    fi
done

echo "---------------------------------------------------"
echo "All images pulled successfully!"
echo "Now you can run: ./start_local.sh"
