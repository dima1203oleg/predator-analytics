#!/usr/bin/env bash
# Generate ArgoCD token for a service account and set it as a GitHub Actions secret using gh CLI
# Usage:
#   ./scripts/argocd_generate_and_set_secret.sh --account cicd --secret-name ARGOCD_MAC_TOKEN [--repo owner/repo] [--server localhost:8080] [--username admin] [--password <pass>] [--insecure] [--url-secret-name ARGOCD_MAC_URL --url-value http://localhost:8080]

set -euo pipefail

show_help() {
  cat <<EOF
Usage: $0 --account <account> --secret-name <secret> [--repo owner/repo] [--server <argocd-server>] [--username <user>] [--password <pass>] [--insecure] [--url-secret-name <name> --url-value <url>]

This script requires:
  - argocd CLI logged in (or provide username/password to login)
  - gh CLI authenticated and access to the target repo to set secrets

Examples:
  ./scripts/argocd_generate_and_set_secret.sh --account cicd --secret-name ARGOCD_MAC_TOKEN --repo dima1203oleg/predator-analytics --server localhost:8080 --username admin --password 's3cr3t' --insecure

EOF
}

# Parse arguments
ACCOUNT=""
SECRET_NAME=""
REPO=""
SERVER="localhost:8080"
USERNAME="admin"
PASSWORD=""
INSECURE=""
URL_SECRET_NAME=""
URL_VALUE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --account) ACCOUNT="$2"; shift 2;;
    --secret-name) SECRET_NAME="$2"; shift 2;;
    --repo) REPO="$2"; shift 2;;
    --server) SERVER="$2"; shift 2;;
    --username) USERNAME="$2"; shift 2;;
    --password) PASSWORD="$2"; shift 2;;
    --insecure) INSECURE="--insecure"; shift;;
    --url-secret-name) URL_SECRET_NAME="$2"; shift 2;;
    --url-value) URL_VALUE="$2"; shift 2;;
    -h|--help) show_help; exit 0;;
    *) echo "Unknown arg: $1"; show_help; exit 2;;
  esac
done

if [[ -z "$ACCOUNT" ]] || [[ -z "$SECRET_NAME" ]]; then
  echo "--account and --secret-name are required"
  show_help
  exit 2
fi

# Determine repo if not provided
if [[ -z "$REPO" ]]; then
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    # try to parse origin URL
    ORIGIN_URL=$(git remote get-url origin 2>/dev/null || true)
    if [[ -n "$ORIGIN_URL" ]]; then
      # handle ssh and https formats
      if [[ "$ORIGIN_URL" =~ git@github.com:(.+)/(.+)\.git ]]; then
        REPO="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
      elif [[ "$ORIGIN_URL" =~ https://github.com/(.+)/(.+)\.git ]]; then
        REPO="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
      else
        echo "Cannot parse git origin URL: $ORIGIN_URL"
      fi
    fi
  fi
fi

if [[ -z "$REPO" ]]; then
  echo "Repository not determined. Provide --repo owner/repo or ensure git origin points to GitHub."
  exit 2
fi

# Check prerequisites
if ! command -v argocd >/dev/null 2>&1; then
  echo "argocd CLI not found in PATH. Install it first: https://argo-cd.readthedocs.io/"
  exit 3
fi
if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found in PATH. Install it and authenticate: https://cli.github.com/"
  exit 3
fi

# verify gh auth
if ! gh auth status --hostname github.com >/dev/null 2>&1; then
  echo "gh CLI not authenticated. Run: gh auth login"
  exit 3
fi

# Login to argocd if password provided
if [[ -n "$PASSWORD" ]]; then
  echo "Logging into ArgoCD at $SERVER as $USERNAME"
  argocd login "$SERVER" --username "$USERNAME" --password "$PASSWORD" $INSECURE >/dev/null
else
  echo "Assuming argocd CLI is already authenticated. If not, pass --username/--password or login first."
fi

# Generate token
echo "Generating ArgoCD token for account: $ACCOUNT"
TOKEN=$(argocd account generate-token --account "$ACCOUNT" $INSECURE 2>/dev/null || true)
if [[ -z "$TOKEN" ]]; then
  echo "Failed to generate token for account '$ACCOUNT'. Ensure the account exists and has apiKey capability."
  echo "If the account lacks apiKey capability, patch argocd-cm to enable it for the account. Example:"
  echo "  kubectl -n argocd patch configmap argocd-cm --type merge -p '{\"data\":{\"accounts.${ACCOUNT}\":\"apiKey,login\"}}'"
  exit 4
fi

# Set the secret in GitHub - prefer gh secret set reading from stdin
echo "Storing token in GitHub Actions secret '$SECRET_NAME' for repo '$REPO'"
# Use --body to avoid exposing token in args
if gh secret set "$SECRET_NAME" --repo "$REPO" --body "$TOKEN" >/dev/null 2>&1; then
  echo "Secret '$SECRET_NAME' set successfully in repo '$REPO'."
else
  echo "gh secret set failed. Retrying by writing via stdin..."
  if echo -n "$TOKEN" | gh secret set "$SECRET_NAME" --repo "$REPO" --stdin; then
    echo "Secret '$SECRET_NAME' set successfully (via stdin) in repo '$REPO'."
  else
    echo "Failed to set secret '$SECRET_NAME'. Ensure gh token has repo:repo 'secrets' privileges and you have access."
    exit 5
  fi
fi

# Optionally set ARGOCD URL secret
if [[ -n "$URL_SECRET_NAME" && -n "$URL_VALUE" ]]; then
  echo "Setting URL secret '$URL_SECRET_NAME' -> $URL_VALUE"
  if gh secret set "$URL_SECRET_NAME" --repo "$REPO" --body "$URL_VALUE" >/dev/null 2>&1; then
    echo "Secret '$URL_SECRET_NAME' set successfully."
  else
    echo "Failed to set URL secret '$URL_SECRET_NAME'. Trying via stdin..."
    if echo -n "$URL_VALUE" | gh secret set "$URL_SECRET_NAME" --repo "$REPO" --stdin; then
      echo "Secret '$URL_SECRET_NAME' set successfully via stdin."
    else
      echo "Failed to set URL secret '$URL_SECRET_NAME'."
    fi
  fi
fi

echo "Done. Token stored and ready for CI usage."
