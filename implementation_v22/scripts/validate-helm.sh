#!/usr/bin/env bash
set -euo pipefail

# Validate umbrella chart rendering locally
# Usage: ./validate-helm.sh [chart-dir]
CHART_DIR=${1:-"./helm/charts/umbrella"}
shift || true
EXTRA_ARGS="$@"

if ! command -v helm >/dev/null 2>&1; then
	echo "Helm not found. Please install Helm: https://helm.sh/docs/intro/install/" >&2
	exit 1
fi

echo "Rendering umbrella chart at ${CHART_DIR}"
if [ ! -d "${CHART_DIR}" ]; then
	echo "ERROR: Chart directory not found: ${CHART_DIR}" >&2
	exit 2
fi

helm dependency update ${CHART_DIR} || true
helm template predator ${CHART_DIR} --values ${CHART_DIR}/values.yaml ${EXTRA_ARGS}

echo "Helm template executed without errors. If errors appear, inspect the templates and values." 
