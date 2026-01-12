# Predator Analytics — Production Runbook

## 1) Public URLs
- UI: https://predator.analytics.local
- API: https://api.predator.analytics.local
- Grafana: https://grafana.predator.analytics.local
- MLflow: https://mlflow.predator.analytics.local

Temporary (without DNS):
- UI: https://194.177.1.240

## 2) Prerequisites (Kubernetes)
- Ingress controller installed (ingress-nginx)
- cert-manager installed
- DNS A-records:
  - predator.analytics.local -> 194.177.1.240
  - api.predator.analytics.local -> 194.177.1.240
  - grafana.predator.analytics.local -> 194.177.1.240
  - mlflow.predator.analytics.local -> 194.177.1.240

## 3) Container images (GHCR)
Expected images:
- ghcr.io/dima1203oleg/predator-ui:latest
- ghcr.io/dima1203oleg/predator-api:latest
- ghcr.io/dima1203oleg/predator-worker:latest

Helm is configured via:
- helm/predator-analytics/values-production.yaml

## 4) Create GHCR pull secret
Namespace MUST match ArgoCD destination namespace.
Destination namespace:
- predator-analytics

Create secret:

kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=dima1203oleg \
  --docker-password=<PAT_with_read:packages> \
  --namespace=predator-analytics

## 5) Deploy (GitOps)
ArgoCD Application:
- argocd/application.yaml

Workflow:
1) Push images to GHCR (tags must exist)
2) ArgoCD Sync application
3) Verify pods and ingresses

## 6) Verify
Pods:
- kubectl -n predator-analytics get pods

Ingress:
- kubectl -n predator-analytics get ingress

Check pulled images:
- kubectl -n predator-analytics describe pod <pod> | grep -i "Image:"

## 7) Troubleshooting
- ImagePullBackOff:
  - verify ghcr-secret exists in namespace predator-analytics
  - verify PAT has read:packages
  - verify image names/tags exist in GHCR

- TLS not issued:
  - verify ClusterIssuer exists: kubectl get clusterissuer
  - verify DNS points to 194.177.1.240
  - check cert-manager logs
