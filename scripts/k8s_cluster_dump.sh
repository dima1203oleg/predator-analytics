#!/usr/bin/env bash
set -euo pipefail

# kube cluster dump helper
# Usage: scripts/k8s_cluster_dump.sh [--output-dir PATH] [--exclude-secrets] [--kubeconfig PATH] [--context NAME]
# Produces <output-dir>.tar.gz and prints size-line then tarball path on stdout (tarball path is last line).

OUTDIR="/tmp/k8s-dump-$(date +%s)"
EXCLUDE_SECRETS=false
KUBECONFIG=""
KUBECONTEXT=""

usage() {
  cat <<EOF
Usage: $0 [--output-dir PATH] [--exclude-secrets] [--include-secrets] [--kubeconfig PATH] [--context NAME]
Runs: kubectl cluster-info dump --all-namespaces --output-directory <dir>
Outputs a compressed tarball: <dir>.tar.gz and prints the tarball path as last line.
EOF
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output-dir|-o)
      shift
      OUTDIR="$1"
      ;;
    --exclude-secrets)
      EXCLUDE_SECRETS=true
      ;;
    --include-secrets|--no-exclude-secrets)
      EXCLUDE_SECRETS=false
      ;;
    --kubeconfig)
      shift
      KUBECONFIG="$1"
      ;;
    --context)
      shift
      KUBECONTEXT="$1"
      ;;
    -h|--help)
      usage
      ;;
    *)
      # ignore
      ;;
  esac
  shift
done

mkdir -p "$OUTDIR"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl not found" >&2
  exit 2
fi

KUBECTL_CMD=(kubectl cluster-info dump --all-namespaces --output-directory="$OUTDIR")
if [[ -n "$KUBECONFIG" ]]; then
  KUBECTL_CMD+=(--kubeconfig "$KUBECONFIG")
fi
if [[ -n "$KUBECONTEXT" ]]; then
  KUBECTL_CMD+=(--context "$KUBECONTEXT")
fi

echo "Running: ${KUBECTL_CMD[*]}"

# Run the command and capture stderr if any. If kubectl returns non-zero we will record
# the error but keep going and still create a tarball for diagnostics.
eval "${KUBECTL_CMD[*]}" 2> "$OUTDIR/kubectl.stderr" || true

if [[ "$EXCLUDE_SECRETS" == true ]]; then
  echo "Excluding files containing 'secret' (case-insensitive) from dump"
  find "$OUTDIR" -type f -iname '*secret*' -delete || true
fi

BASE="$(basename "$OUTDIR")"
TARBALL="${OUTDIR%/}/${BASE}.tar.gz"
echo "Compressing to: $TARBALL"
tar -czf "$TARBALL" -C "$(dirname "$OUTDIR")" "$(basename "$OUTDIR")"

# Print size and tarball path (tarball last)
du -h "$TARBALL" | awk '{print $1 " " $2}'
echo "$TARBALL"

exit 0
#!/usr/bin/env bash
set -euo pipefail

# Simple script to capture kubectl cluster-info dump to a timestamped file
# Usage: scripts/k8s_cluster_dump.sh [output_dir]

OUT_DIR=./logs
EXCLUDE_SECRETS=false

# parse cli
while [[ "$#" -gt 0 ]]; do
  key="$1"
  case $key in
    --output-dir|-o)
      OUT_DIR="$2"
      shift; shift
      ;;
    --exclude-secrets)
      EXCLUDE_SECRETS=true
      shift
      ;;
    --include-secrets)
      EXCLUDE_SECRETS=false
      shift
      ;;
    *)
      # unknown option
      shift
      ;;
  esac
done
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
OUT_FILE="$OUT_DIR/k8s-cluster-dump-$TIMESTAMP.log"

mkdir -p "$OUT_DIR"

if ! command -v kubectl >/dev/null 2>&1; then
    echo "kubectl not found" >&2
    exit 2
fi

echo "Running kubectl cluster-info dump..."

# Redirect both stdout and stderr to file so we have full context
if [ "$EXCLUDE_SECRETS" = true ]; then
  # crude filter removing lines mentioning 'secret' (case-insensitive)
  kubectl cluster-info dump 2>&1 | sed -E '/secret/Id' > "$OUT_FILE" || true
else
  kubectl cluster-info dump > "$OUT_FILE" 2>&1 || true
fi

# Print path and info line (size & name) for helpers
echo "$OUT_FILE"
if [ -f "$OUT_FILE" ]; then
  ls -lh "$OUT_FILE" | awk '{print $5 " " $9}'
fi

exit 0
#!/usr/bin/env bash
set -euo pipefail

# Simple helper to run 'kubectl cluster-info dump' into an output directory,
# optionally exclude secrets, and create a compressed tarball.

OUTDIR="${1:-/tmp/k8s-dump-$(date +%s)}"
EXCLUDE_SECRETS=false

usage() {
  echo "Usage: $0 [--output-dir PATH] [--exclude-secrets]"
  exit 1
}

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --output-dir)
      shift
      OUTDIR="$1"
      ;;
    --exclude-secrets)
      EXCLUDE_SECRETS=true
      ;;
    -h|--help)
      usage
      ;;
    *)
      # ignore
      ;;
  esac
  shift
done

mkdir -p "$OUTDIR"

echo "Running: kubectl cluster-info dump --all-namespaces --output-directory=$OUTDIR"

# Run the dump
kubectl cluster-info dump --all-namespaces --output-directory="$OUTDIR"

# Optionally exclude secrets by removing files containing 'secrets' or 'Secret' in their path
if [ "$EXCLUDE_SECRETS" = true ]; then
  echo "Excluding secrets from the dump"
  find "$OUTDIR" -type f -iname '*secret*' -delete || true
fi

# Compress
TARBALL="${OUTDIR}.tar.gz"
echo "Compressing to: $TARBALL"

tar -czf "$TARBALL" -C "$(dirname "$OUTDIR")" "$(basename "$OUTDIR")"

# Print final path and size
du -h "$TARBALL" | awk '{print $1, $2}'

echo "$TARBALL"
