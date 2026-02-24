#!/bin/bash
set -e

APP_NAME=predator
REGISTRY=localhost:5000
TAG=$(git rev-parse --short HEAD)

# Verify local registry accessibility
echo "Building $REGISTRY/$APP_NAME:$TAG..."
docker build -t $REGISTRY/$APP_NAME:$TAG -f devcontainer/.devcontainer/Dockerfile devcontainer/
docker push $REGISTRY/$APP_NAME:$TAG
docker tag $REGISTRY/$APP_NAME:$TAG $REGISTRY/$APP_NAME:latest
docker push $REGISTRY/$APP_NAME:latest
