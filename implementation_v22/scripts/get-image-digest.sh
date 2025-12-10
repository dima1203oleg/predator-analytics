#!/usr/bin/env bash
# Print the digests for an image tag using docker buildx imagetools inspect
# Usage: get-image-digest.sh <image:tag>
set -euo pipefail
IMAGE=${1:-}
if [[ -z "$IMAGE" ]]; then
  echo "Usage: $0 <image:tag>"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required"
  exit 1
fi

if ! docker buildx imagetools inspect "$IMAGE" --raw >/dev/null 2>&1; then
  echo "Unable to inspect $IMAGE; ensure it exists and you are logged in to the registry"
  exit 1
fi

DIGEST=$(docker buildx imagetools inspect "$IMAGE" --raw | jq -r '.manifests[0].digest')

echo "$DIGEST"
