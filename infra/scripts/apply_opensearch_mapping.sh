#!/usr/bin/env bash
# Apply OpenSearch mapping from infra/configs/opensearch/documents_mapping.json
set -euo pipefail
OPENSEARCH_URL=${OPENSEARCH_URL:-http://localhost:9200}
INDEX_NAME=${1:-documents}

curl -X PUT "$OPENSEARCH_URL/$INDEX_NAME" -H 'Content-Type: application/json' --data-binary @infra/configs/opensearch/documents_mapping.json

echo "Applied mapping to index $INDEX_NAME"
