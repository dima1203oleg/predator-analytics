#!/usr/bin/env bash
set -euo pipefail

INDEXER=${1:-index}
echo "Starting indexer: ${INDEXER}"

# Example: call local indexer for a dataset
python -m app.indexer --dataset ${INDEXER}

echo "Indexing job done"
