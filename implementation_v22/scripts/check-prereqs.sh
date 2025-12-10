#!/usr/bin/env bash
set -euo pipefail

req_tools=(kubectl helm argocd docker node pnpm tox)

echo "Checking required CLI tools..."
missing=()
for t in "${req_tools[@]}"; do
  if ! command -v $t >/dev/null 2>&1; then
    missing+=("$t")
  fi
done

# Check Python >= 3.11
PY_OK=false
if command -v python3.11 >/dev/null 2>&1; then
  PY_OK=true
elif command -v python3 >/dev/null 2>&1; then
  if python3 -c "import sys; sys.exit(0 if sys.version_info >= (3,11) else 1)" >/dev/null 2>&1; then
    PY_OK=true
  fi
fi

if [ "$PY_OK" = false ]; then
  missing+=("python3.11 (or python3 >= 3.11)")
fi

if [ ${#missing[@]} -ne 0 ]; then
  echo "Missing tools: ${missing[*]}"
  echo "Please install them before proceeding. Suggested installs:" 
  echo "  - kubectl: https://kubernetes.io/docs/tasks/tools/"
  echo "  - helm: https://helm.sh/docs/intro/install/"
  echo "  - argocd CLI: https://argo-cd.readthedocs.io/cli_installation/"
  echo "  - docker: https://docs.docker.com/get-docker/"
  echo "  - node & pnpm: https://nodejs.org/ and https://pnpm.io/installation"
  exit 1
fi

echo "All required CLI tools are present." 
