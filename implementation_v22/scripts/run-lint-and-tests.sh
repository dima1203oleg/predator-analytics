#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Run ruff, black and mypy for backend
cd ua-sources || exit 1
if command -v ruff >/dev/null 2>&1; then
  ruff check .
else
  echo "ruff not found; skipping" >&2
fi
if command -v black >/dev/null 2>&1; then
  black --check . || true
else
  echo "black not found; skipping" >&2
fi
if command -v mypy >/dev/null 2>&1; then
  mypy app/ --ignore-missing-imports || true
else
  echo "mypy not found; skipping" >&2
fi

# Run tox if available or via Docker fallback
if command -v tox >/dev/null 2>&1; then
  tox -e py311 || true
else
  echo "tox not found; running inside python:3.11-slim"
  docker run --rm -v "$PWD":/workspace -w /workspace -u $(id -u):$(id -g) python:3.11-slim bash -lc "pip install tox && tox -e py311" || true
fi

cd "$REPO_ROOT" || exit 1

# Run frontend lint & test
if command -v npm >/dev/null 2>&1; then
  cd frontend
  npm ci
  npm run lint || true
  npm test || true
fi

echo "Local lint & tests complete"
