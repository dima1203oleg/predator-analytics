#!/bin/bash
set -e

APP_NAME=predator
TAG=$(git rev-parse --short HEAD)

echo "Updating Helm values to tag: $TAG"
# Update Helm image tag in helm/dev-env/values.yaml
# Using a more specific path based on current structure
sed -i.bak "s/tag: .*/tag: $TAG/" helm/dev-env/values.yaml

# Push changes to git to trigger ArgoCD
git add helm/dev-env/values.yaml
git commit -m "Auto update image tag to $TAG [skip ci]" || echo "No changes to commit"
# We'll use the SSH key we have on Mac to push
GIT_SSH_COMMAND="ssh -i /Users/dima-mac/.ssh/id_rsa -o StrictHostKeyChecking=no" git push origin ci-minio-e2e
