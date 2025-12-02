#!/usr/bin/env bash
set -euo pipefail

# register_selfhosted_runner.sh
# Helper to install and register a GitHub Actions self-hosted runner on a Linux host.
# Designed to be run on the host where you want the runner to live.
#
# Usage (interactive):
#   GITHUB_OWNER=your-user-or-org GITHUB_REPO=your-repo ./scripts/register_selfhosted_runner.sh
#
# Non-interactive (recommended in automation):
#   GITHUB_OWNER=... GITHUB_REPO=... RUNNER_NAME=my-host RUNNER_LABELS=onprem-nvidia GITHUB_PAT=ghp_xxx ./scripts/register_selfhosted_runner.sh --non-interactive
#
# Requirements:
# - curl, tar, jq (jq optional but helpful)
# - A GitHub PAT with permissions to create runner registration tokens (repo scope for repo-level runner or admin:org for org-level).

OWNER=${GITHUB_OWNER:-}
REPO=${GITHUB_REPO:-}
RUNNER_NAME=${RUNNER_NAME:-}
RUNNER_LABELS=${RUNNER_LABELS:-onprem}
PAT=${GITHUB_PAT:-}
NONINTERACTIVE=0
INSTALL_DIR=${RUNNER_INSTALL_DIR:-/opt/actions-runner}

print_help() {
  cat <<HELP
Usage: $0 [--non-interactive]

Environment variables that matter:
  GITHUB_OWNER   - repo owner (user or org)   (required)
  GITHUB_REPO    - repo name                  (required)
  GITHUB_PAT     - Personal Access Token with repo or admin:org scope (recommended)
  RUNNER_NAME    - Name for the runner (default: auto hostname)
  RUNNER_LABELS  - Comma separated runner labels (default: onprem)
  RUNNER_INSTALL_DIR - Where to install the runner (default: /opt/actions-runner)

If GITHUB_PAT is not provided and --non-interactive is not set you'll be prompted how to finish registration manually.

This script will:
  - download the latest GitHub Actions runner
  - request a registration token (if GITHUB_PAT provided)
  - configure the runner with the token
  - provide instructions to run as a service

HELP
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --non-interactive) NONINTERACTIVE=1; shift ;;
    -h|--help) print_help; exit 0 ;;
    *) echo "Unknown arg: $1"; print_help; exit 1 ;;
  esac
done

if [ -z "$OWNER" ] || [ -z "$REPO" ]; then
  echo "ERROR: GITHUB_OWNER and GITHUB_REPO environment variables must be set."
  print_help
  exit 2
fi

if [ -z "$RUNNER_NAME" ]; then
  RUNNER_NAME="$(hostname -s)"
fi

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "---- Installing GitHub Actions runner to: $INSTALL_DIR"

# fetch latest runner version and download url from GitHub API
echo "Fetching latest runner release info..."
RELEASE_JSON=$(curl -sSfL "https://api.github.com/repos/actions/runner/releases/latest")
TAR_URL=$(echo "$RELEASE_JSON" | awk -v RS="," '/linux.*x86_64.*actions-runner/ {gsub(/^[^{]*|[}]$/,"",$0); print $0}' | grep -o 'https[^\"]*linux-x64[^\"]*tar.gz' || true)

if [ -z "$TAR_URL" ]; then
  # fallback - try to parse assets differently (no jq dependency):
  TAR_URL=$(echo "$RELEASE_JSON" | grep -o 'https://[^" ]*actions-runner-linux-x64-[^"]*\.tar\.gz' | head -n1 || true)
fi

if [ -z "$TAR_URL" ]; then
  echo "Could not determine the latest runner tarball URL. Please visit https://github.com/actions/runner/releases to manually download." >&2
  exit 3
fi

echo "Downloading runner from: $TAR_URL"
curl -sSfL "$TAR_URL" -o actions-runner.tar.gz
tar xzf actions-runner.tar.gz

if [ -n "$(command -v jq || true)" ]; then
  echo "jq available — good for debugging."
fi

REG_TOKEN=""
if [ -n "$PAT" ]; then
  echo "Requesting registration token from GitHub API using provided PAT..."
  API_URL="https://api.github.com/repos/${OWNER}/${REPO}/actions/runners/registration-token"
  RESPONSE=$(curl -sSfL -XPOST -H "Authorization: token $PAT" -H "Accept: application/vnd.github+json" "$API_URL" || true)
  if echo "$RESPONSE" | grep -q 'token"'; then
    REG_TOKEN=$(echo "$RESPONSE" | sed -n 's/.*"token"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
  fi

  if [ -z "$REG_TOKEN" ]; then
    echo "Failed to obtain registration token via API. Response:" >&2
    echo "$RESPONSE" >&2
    if [ "$NONINTERACTIVE" -eq 1 ]; then
      echo "Non-interactive mode: cannot continue without a token." >&2
      exit 4
    fi
  fi
fi

if [ -z "$REG_TOKEN" ]; then
  echo
  echo "No registration token available automatically."
  echo "You can generate one from the web UI:"
  echo "  GitHub → repo Settings → Actions → Runners → New self-hosted runner → Follow instructions"
  echo
  if [ "$NONINTERACTIVE" -eq 1 ]; then
    echo "Non-interactive mode: token required but not provided. Exiting." >&2
    exit 5
  fi
  read -r -p "Paste the runner registration token here (or press Enter to exit): " REG_TOKEN
  if [ -z "$REG_TOKEN" ]; then
    echo "No token provided — aborting." >&2
    exit 6
  fi
fi

echo "Configuring runner with name='$RUNNER_NAME' labels='$RUNNER_LABELS'..."
./config.sh --unattended --url "https://github.com/${OWNER}/${REPO}" --token "$REG_TOKEN" --name "$RUNNER_NAME" --labels "$RUNNER_LABELS"

echo "Runner configured. To run it as a service (recommended), run the following commands as root or sudo:"

cat <<'INSTR'
# (on systemd systems)
sudo ./svc.sh install
sudo ./svc.sh start

# Check runner status via GitHub UI: https://github.com/<owner>/<repo>/settings/actions/runners
INSTR

echo
echo "Quick verification:"
./svc.sh status 2>/dev/null || echo "Service not started — run the install/start commands above or run ./run.sh to test interactively."

echo
echo "Done — if the runner appears in the repository's Actions > Runners list, you can use the label(s) '$RUNNER_LABELS' in workflows (e.g. 'runs-on: [self-hosted, $RUNNER_LABELS]')."

exit 0
