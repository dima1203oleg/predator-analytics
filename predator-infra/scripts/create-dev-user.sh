#!/bin/bash
set -e

USERNAME=$1
if [[ -z "$USERNAME" || ! "$USERNAME" =~ ^[a-z0-9-]+$ ]]; then
  echo "Usage: $0 <username> (alphanumeric and dashes only)"
  exit 1
fi

mkdir -p gitops/argocd/apps

sed "s/USERNAME/${USERNAME}/g" gitops/argocd/dev-user-template.yaml > gitops/argocd/apps/dev-${USERNAME}.yaml

git add gitops/argocd/apps/dev-${USERNAME}.yaml
git commit -m "Add dev environment for ${USERNAME}"
git push origin main
