#!/usr/bin/env bash
# Safe helper: package and optionally upload repo subset to an AI Studio endpoint
set -euo pipefail

usage() {
  cat <<EOF
Usage: $0 [--dry-run] [--paths <comma-separated paths>] [--endpoint <url>] [--token <token>]

This script packages changed paths (or a set of paths) into a tarball under ./ai-export-push
and optionally posts the tarball to an AI Studio upload endpoint.

Options:
  --dry-run       Show what would be packaged/sent
  --paths         Comma-separated list of paths to include (default: environments, frontend, backend)
  --endpoint      Override AI Studio upload endpoint
  --token         Auth token for upload (if not provided, will use AI_STUDIO_UPLOAD_TOKEN env var)
EOF
}

DRY_RUN=false
PATHS="environments,frontend,backend"
ENDPOINT="${AI_STUDIO_UPLOAD_ENDPOINT:-}"
TOKEN="${AI_STUDIO_UPLOAD_TOKEN:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --paths) PATHS="$2"; shift 2 ;;
    --endpoint) ENDPOINT="$2"; shift 2 ;;
    --token) TOKEN="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1"; usage; exit 1 ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT_DIR/ai-export-push"
mkdir -p "$OUT_DIR"

IFS=',' read -r -a path_array <<< "$PATHS"
tarball="$OUT_DIR/repo-export-$(date +%Y%m%d_%H%M%S).tar.gz"

echo "Packaging paths: ${path_array[*]} -> $tarball"
if [ "$DRY_RUN" = true ]; then
  echo "DRY RUN: Would create tarball here. No upload will be done."
  exit 0
fi

pushd "$ROOT_DIR" >/dev/null
  # ensure we only include items that exist
  includes=()
  for p in "${path_array[@]}"; do
    if [ -e "$p" ]; then
      includes+=("$p")
    fi
  done

  if [ ${#includes[@]} -eq 0 ]; then
    echo "No paths present to package: ${path_array[*]}"
    popd >/dev/null
    exit 1
  fi

  tar -czf "$tarball" "${includes[@]}"
popd >/dev/null

if [ -n "$ENDPOINT" ]; then
  if [ -z "$TOKEN" ]; then
    echo "No token provided for upload. Provide --token or set AI_STUDIO_UPLOAD_TOKEN environment variable." >&2
    exit 1
  fi
  echo "Uploading to $ENDPOINT ..."
  # best-effort robust upload
  response=$(curl -sS -w "%{http_code}" -o /tmp/ai_upload_response -X POST "$ENDPOINT" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@$tarball") || true
  code=$response
  echo "Server responded with code: $code"
  cat /tmp/ai_upload_response || true
  if [ "$code" -ge 400 ]; then
    echo "Upload failed (HTTP $code)" >&2
    exit 1
  fi
  echo "Upload succeeded"
else
  echo "No endpoint provided — tarball created at: $tarball"
fi
