#!/usr/bin/env bash
set -euo pipefail

# Helper to dispatch the autofix loop test (autofix-loop-test.yml)
# Usage: ./scripts/run_autofix_test.sh [--ref main] [--simulate true]

REF=main
SIMULATE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ref) REF="$2"; shift 2;;
    --simulate) SIMULATE="$2"; shift 2;;
    *) echo "Unknown arg $1"; exit 1;;
  esac
done

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI required. Install https://cli.github.com/ and authenticate (gh auth login)"
  exit 2
fi

WORKFLOW_FILE=autofix-loop-test.yml

echo "Dispatching $WORKFLOW_FILE at ref=$REF (simulate=$SIMULATE)"
if [ "$SIMULATE" = "true" ] || [ "$SIMULATE" = "1" ]; then
  gh workflow run "$WORKFLOW_FILE" --ref "$REF" -f simulate_patch=true
else
  gh workflow run "$WORKFLOW_FILE" --ref "$REF"
fi

echo "Dispatched — check Actions UI or 'gh run list' to watch progress."
