#!/usr/bin/env bash
set -euo pipefail

echo "This script lists candidate files to remove from the main workspace if you accept consolidation to implementation_v22/"
echo "*** THIS IS A PROPOSAL: script only prints files. Delete only after review and approval. ***"

repo_root="$(cd "$(dirname "$0")/.." && pwd)"

declare -a candidates=(
  "values.yaml"
  "values-prod.yaml"
  "values-staging.yaml"
  "helm/" # top-level helm folder (if you keep infra/helm, ignore)
  "qdrant/" # existing qdrant config sets
  "opensearch/" # root opensearch configs
  "dvc/" # root dvc config folder
  "scripts/" # old top-level scripts (migrate to implementation_v22/scripts)
  "TECH_SPEC.md" # will be replaced with new implementation_v22/TECH_SPEC
  "TECH_SPEC.old.md" # backup of old spec
  "README.md" # root README
)

echo "Candidate files/folders in repo root to be reviewed and possibly removed/moved to implementation_v22/:
"

for c in "${candidates[@]}"; do
  if [ -e "$repo_root/$c" ]; then
    echo "  - $repo_root/$c"
  else
    echo "  - (not found) $repo_root/$c"
  fi
done

echo "\nIf you approve the cleanup, run: ./cleanup_proposal.sh --delete (after review and backup)"

if [ "${1:-}" == "--delete" ]; then
  echo "*** DELETE MODE ENABLED: proceeding to move files to backup and/or remove ***"
  for c in "${candidates[@]}"; do
    path="$repo_root/$c"
    if [ -e "$path" ]; then
      if [ -d "$path" ]; then
        echo "Backing up and removing directory: $path"; mv "$path" "$path".backup || true; rm -rf "$path"
      else
        echo "Backing up and removing file: $path"; mv "$path" "$path".backup || true; rm -f "$path"
      fi
    fi
  done
  echo "Cleanup completed (moved files to <file>.backup). Please review before committing."
fi
