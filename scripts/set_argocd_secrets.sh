#!/usr/bin/env bash
# Interactive helper to set ArgoCD credentials as GitHub repository secrets using gh CLI
# Usage: ./scripts/set_argocd_secrets.sh --repo owner/repo
# You can set values via environment variables or interactively will be prompted.

set -euo pipefail

REPO=""

usage() {
  cat <<EOF
Usage: $0 --repo owner/repo [--non-interactive]

This script will set these repository secrets using gh CLI:
  ARGOCD_NVIDIA_URL, ARGOCD_NVIDIA_USERNAME, ARGOCD_NVIDIA_PASSWORD
  ARGOCD_ORACLE_URL,  ARGOCD_ORACLE_USERNAME,  ARGOCD_ORACLE_PASSWORD

It reads values from environment variables if present, otherwise prompts securely.
Examples:
  REPO=dima1203oleg/predator-analytics ./scripts/set_argocd_secrets.sh --non-interactive
  ./scripts/set_argocd_secrets.sh --repo dima1203oleg/predator-analytics

NOTE: Requires `gh` CLI authenticated with permission to set repo secrets (repo scope).
EOF
}

# Parse args
NON_INTERACTIVE=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      REPO="$2"
      shift 2
      ;;
    --non-interactive)
      NON_INTERACTIVE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if [[ -z "$REPO" ]]; then
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    ORIGIN_URL=$(git remote get-url origin 2>/dev/null || true)
    if [[ -n "$ORIGIN_URL" ]]; then
      if [[ "$ORIGIN_URL" =~ git@github.com:(.+)/(.+)\.git ]]; then
        REPO="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
      elif [[ "$ORIGIN_URL" =~ https://github.com/(.+)/(.+)\.git ]]; then
        REPO="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
      fi
    fi
  fi
fi

if [[ -z "$REPO" ]]; then
  echo "Repository not determined - pass --repo owner/repo or run inside a git clone with origin." >&2
  exit 2
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install gh and authenticate (gh auth login)." >&2
  exit 3
fi

# confirm gh auth
if ! gh auth status --hostname github.com >/dev/null 2>&1; then
  echo "gh CLI not authenticated. Run 'gh auth login' and ensure token has repo:secrets privileges." >&2
  exit 3
fi

# helper to set a single secret from value or prompt
set_secret() {
  local name="$1"
  local prompt_msg="$2"
  local value

  # try environment variable first
  value="${!name:-}"

  if [[ -z "$value" && $NON_INTERACTIVE -eq 1 ]]; then
    echo "Error: $name not set in environment and non-interactive mode set" >&2
    return 1
  fi

  if [[ -z "$value" ]]; then
    read -rs -p "Enter value for $name: " value
    echo
  fi

  if [[ -z "$value" ]]; then
    echo "Skipping $name (empty)" >&2
    return 1
  fi

  echo -n "$value" | gh secret set "$name" --repo "$REPO" --body -
}

# Set NVIDIA secrets
set_secret ARGOCD_NVIDIA_URL "ArgoCD Nvidia URL"
set_secret ARGOCD_NVIDIA_USERNAME "ArgoCD Nvidia username"
set_secret ARGOCD_NVIDIA_PASSWORD "ArgoCD Nvidia password"

# Set ORACLE secrets
set_secret ARGOCD_ORACLE_URL "ArgoCD Oracle URL"
set_secret ARGOCD_ORACLE_USERNAME "ArgoCD Oracle username"
set_secret ARGOCD_ORACLE_PASSWORD "ArgoCD Oracle password"

# Provide quick feedback
echo "
Done. Verify secrets in GitHub UI: Settings → Secrets and variables → Actions for $REPO"
