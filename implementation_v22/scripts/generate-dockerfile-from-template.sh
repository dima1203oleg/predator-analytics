#!/usr/bin/env bash
# Simple generator to copy chosen Dockerfile template to target service dir
# Usage: ./generate-dockerfile-from-template.sh backend|frontend|mlflow target-dir

set -euo pipefail

TEMPLATE_DIR="$(dirname "$0")/../dockerfile-templates"
TYPE="${1:-}"
TARGET_DIR="${2:-.}"

if [[ -z "$TYPE" ]]; then
  echo "Usage: $0 backend|frontend|mlflow <target-dir>"
  exit 1
fi

case "$TYPE" in
  backend)
    TEMPLATE="$TEMPLATE_DIR/backend-python.Dockerfile"
    ;;
  frontend)
    TEMPLATE="$TEMPLATE_DIR/frontend-node.Dockerfile"
    ;;
  mlflow)
    TEMPLATE="$TEMPLATE_DIR/mlflow.Dockerfile"
    ;;
  *)
    echo "Unknown type: $TYPE"
    exit 1
    ;;
esac

mkdir -p "$TARGET_DIR"
cp "$TEMPLATE" "$TARGET_DIR/Dockerfile"

echo "Dockerfile generated at $TARGET_DIR/Dockerfile from $TEMPLATE"
