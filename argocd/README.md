# Папка argocd/
# Тут зберігаються ArgoCD Application manifests для керування GitOps-деплоєм.

## Exposing ArgoCD via Ingress + TLS (added)

This repo now contains manifests and a helper script to expose Argo CD via an Ingress with TLS (using cert-manager self-signed Certificate).

Files added:
- `ingress-argocd.yaml` — Ingress resource that routes host to `argocd-server` service in `argocd` namespace.
- `cert-manager-selfsigned-issuer.yaml` — ClusterIssuer + Issuer + Certificate using a self-signed issuer.
- `../scripts/setup_argocd_ingress.sh` — script to install ingress-nginx & cert-manager (if missing) and create the issuer/certificate and ingress.

See `../scripts/setup_argocd_ingress.sh --help` for usage and testing examples.
