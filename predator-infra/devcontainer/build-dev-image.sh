#!/bin/bash
set -e

TAG=$1
if [ -z "$TAG" ]; then
  echo "Usage: $0 <TAG>"
  exit 1
fi

IMAGE_NAME="localhost:5000/dev-image:${TAG}"

docker build -t "$IMAGE_NAME" -f .devcontainer/Dockerfile .
docker push "$IMAGE_NAME"
