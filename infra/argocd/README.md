# ArgoCD Manifests

This folder contains ArgoCD Application manifests for the helm/predator-umbrella chart.

- `predator-umbrella-dev.yaml` — dev application (values-dev.yaml)
- `predator-umbrella-staging.yaml` — staging application (values-staging.yaml)
- `predator-umbrella-prod.yaml` — prod application (values-prod.yaml)

Usage:
1. Ensure `argocd` namespace exists and ArgoCD is installed.
2. `kubectl apply -f infra/argocd/predator-umbrella-dev.yaml` (and other env files as needed)
3. ArgoCD will sync the helm chart and create the sub-resources.

> Note: credentials and tokens should be managed via Kubernetes Secrets and not kept in git.
