#!/usr/bin/env bash
set -euo pipefail

# Build and push frontend/backend images to GHCR if GHCR_PAT is present.
GHCR=${GHCR:-ghcr.io}
REPO=${REPO:-${GITHUB_REPOSITORY:-your-org/predator_v22}}
RUN_NUM=${RUN_NUM:-local}
BACKEND_TAG=${1:-v22.0.${RUN_NUM}}
FRONTEND_TAG=${2:-v22.0.${RUN_NUM}}

if [ -z "${GHCR_PAT:-}" ]; then
  echo "GHCR_PAT not set. Aborting push. To push, export GHCR_PAT or set it in env." >&2
  exit 1
fi

echo "Logging in to GHCR"
echo "${GHCR_PAT}" | docker login ghcr.io -u "${GITHUB_ACTOR:-your-user}" --password-stdin

echo "Building and pushing frontend image"
docker buildx build --platform linux/amd64 --push -t ${GHCR}/${REPO}/frontend:${FRONTEND_TAG} ./frontend

echo "Building and pushing backend image"
docker buildx build --platform linux/amd64 --push -t ${GHCR}/${REPO}/backend:${BACKEND_TAG} -f ./ua-sources/Dockerfile ./ua-sources

echo "Push complete"
