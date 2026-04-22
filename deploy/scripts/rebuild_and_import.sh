#!/bin/bash
set -e

CLUSTER_NAME="predator-local"
VERSION="v56.5-ELITE"
REGISTRY="ghcr.io/dima1203oleg"

echo "📥 Pulling infrastructure images..."
docker pull bitnami/postgresql:16.3.0 || echo "⚠️ Failed to pull bitnami/postgresql:16.3.0"
docker pull neo4j:5.21.0

# 1. Core API
echo "📦 Building Core API..."
docker build --no-cache -t $REGISTRY/predator-core-api:$VERSION -f services/core-api/Dockerfile .


# 2. Ingestion Worker
echo "📦 Building Ingestion Worker..."
docker build -t $REGISTRY/predator-ingestion-worker:$VERSION -f services/ingestion-worker/Dockerfile .

# 3. Frontend (Thin)
echo "📦 Building Frontend (Thin)..."
docker build -t $REGISTRY/predator-frontend:$VERSION -f apps/predator-analytics-ui/Dockerfile.thin .

echo "🚢 Importing images into k3d cluster: $CLUSTER_NAME..."
k3d image import \
  $REGISTRY/predator-core-api:$VERSION \
  $REGISTRY/predator-ingestion-worker:$VERSION \
  $REGISTRY/predator-frontend:$VERSION \
  bitnami/postgresql:16.3.0-debian-12-r10 \
  neo4j:5.21.0 \
  -c $CLUSTER_NAME


echo "🔄 Restarting pods to apply changes..."
kubectl rollout restart rollout predator-core-api -n predator
kubectl rollout restart deployment predator-ingestion-worker -n predator
kubectl rollout restart deployment predator-frontend -n predator

echo "✅ All core services rebuilt, imported, and restarted!"
