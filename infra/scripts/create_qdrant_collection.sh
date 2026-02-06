#!/usr/bin/env bash
# Create Qdrant collection from infra/configs/qdrant/collection_multimodal.yaml (simple curl template)
set -euo pipefail
QDRANT_URL=${QDRANT_URL:-http://localhost:6333}
COLL_NAME=multimodal_index

# Replace with a programmatic conversion if necessary; here we use the JSON payload inline
curl -X POST "$QDRANT_URL/collections/$COLL_NAME" -H 'Content-Type: application/json' -d '{
  "vectors": {
    "text_dense": {"size": 768, "distance": "Cosine"},
    "image_clip": {"size": 512, "distance": "Cosine"}
  },
  "hnsw_config": {"m": 0, "payload_m": 16},
  "on_disk": true
}'

echo "Created collection $COLL_NAME (or updated)"

# Create payload index for tenant_id
curl -X POST "$QDRANT_URL/collections/$COLL_NAME/payload/indexes" -H 'Content-Type: application/json' -d '{
  "field_name": "tenant_id",
  "field_schema": {"type": "keyword", "is_tenant": true}
}'

echo "Created payload index for tenant_id"
