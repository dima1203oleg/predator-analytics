#!/usr/bin/env bash
set -euo pipefail

# Helper to run tox locally or in a docker container that has Python 3.11
# Usage: ./run-tox-docker.sh [-e py311] [-w ua-sources]

ENV=${1:-py311}
WORKDIR=${2:-ua-sources}

function usage(){
  echo "Usage: $0 [TOX_ENV] [WORKDIR]"
  echo "Examples:"
  echo "  $0 py311 ua-sources"
  exit 1
}

if [ -z "${ENV}" ]; then
  usage
fi

if command -v tox >/dev/null 2>&1; then
  echo "Running local tox (${ENV})"
  (cd ${WORKDIR} && tox -e ${ENV})
  exit 0
fi

if command -v docker >/dev/null 2>&1; then
  echo "tox not found locally. Running in Docker python:3.11-slim"
  docker run --rm -it \
    -v "$(pwd)":/workspace \
    -w /workspace/${WORKDIR} \
    python:3.11-slim bash -lc "python -m pip install --upgrade pip tox && tox -e ${ENV}"
  exit 0
fi

echo "Neither tox nor docker found. Install tox (pip install tox) or docker to run the tests."
exit 1
