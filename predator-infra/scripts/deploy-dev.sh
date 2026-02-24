#!/bin/bash
set -e

USERNAME=$1
if [ -z "$USERNAME" ]; then
  echo "Usage: $0 <username>"
  exit 1
fi

TAG=$(git rev-parse --short HEAD)

cd devcontainer
./build-dev-image.sh "$TAG"
cd ..

sed -i "s/tag: .*/tag: $TAG/" helm/dev-env/values.yaml

git add helm/dev-env/values.yaml
git commit -m "Update image tag for ${USERNAME} to ${TAG}"
git push origin main

echo "Waiting for rollout..."
kubectl wait --for=condition=ready pod -l app=dev -n dev-${USERNAME} --timeout=300s
