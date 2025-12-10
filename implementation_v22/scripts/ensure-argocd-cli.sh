#!/usr/bin/env bash
set -euo pipefail

if command -v argocd >/dev/null 2>&1; then
  echo "argocd CLI is installed: $(argocd version --client)"
  exit 0
fi

echo "argocd CLI not found. To install, run one of the following depending on your platform."
echo "Linux (x86_64) example:"
echo "  curl -sSL -o /tmp/argocd.gz https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64.gz"
echo "  gunzip /tmp/argocd.gz && sudo mv /tmp/argocd /usr/local/bin/argocd && sudo chmod +x /usr/local/bin/argocd"

echo "MacOS (brew): brew install argocd"
exit 1
