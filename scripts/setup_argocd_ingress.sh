#!/usr/bin/env bash
set -euo pipefail

# Setup persistent ArgoCD external access with ingress + TLS (self-signed cert via cert-manager)
# Usage: ./scripts/setup_argocd_ingress.sh --host <hostname> [--skip-ingress-controller] [--skip-cert-manager]
# Default host: argocd.local

HOST=argocd.local
SKIP_INGRESS="false"
SKIP_CERT="false"

while [[ $# -gt 0 ]]; do
  case $1 in
    --host)
      HOST="$2"; shift 2;;
    --skip-ingress-controller)
      SKIP_INGRESS="true"; shift;;
    --skip-cert-manager)
      SKIP_CERT="true"; shift;;
    -h|--help)
      echo "Usage: $0 [--host <hostname>] [--skip-ingress-controller] [--skip-cert-manager]"; exit 0;;
    *) echo "Unknown arg: $1"; exit 2;;
  esac
done

echo "Host: $HOST"

# 1) Install ingress-nginx controller (if not skipped)
if [[ "$SKIP_INGRESS" != "true" ]]; then
  echo "Checking ingress-nginx controller..."
  if kubectl get ns ingress-nginx >/dev/null 2>&1; then
    echo "ingress-nginx namespace already present"
  else
    echo "Installing ingress-nginx (official manifests)"
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
    echo "Waiting for ingress-nginx controller to be ready..."
    kubectl -n ingress-nginx wait --for=condition=Ready --timeout=300s pod -l app.kubernetes.io/component=controller || true
  fi
fi

# 2) Install cert-manager (if not skipped)
if [[ "$SKIP_CERT" != "true" ]]; then
  echo "Checking cert-manager..."
  if kubectl get ns cert-manager >/dev/null 2>&1; then
    echo "cert-manager already present"
  else
    echo "Installing cert-manager (CRDs + controller)"
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
    echo "Waiting for cert-manager to be ready..."
    kubectl -n cert-manager wait --for=condition=Ready --timeout=300s pod -l app=cert-manager || true
  fi
fi

# 3) Ensure argocd namespace exists
kubectl get ns argocd >/dev/null 2>&1 || kubectl create ns argocd || true

# 4) Apply ClusterIssuer/Issuer/Certificate and Ingress manifests from repo
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "${PWD}")

echo "Applying cert-manager issuer & certificate..."
kubectl apply -f "$REPO_ROOT/argocd/cert-manager-selfsigned-issuer.yaml"

# Patch certificate dnsNames to use requested HOST
kubectl -n argocd patch certificate argocd-cert --type=json -p "[( { \"op\": \"replace\", \"path\": \"/spec/dnsNames/0\", \"value\": \"$HOST\" } )]" || true

# 5) Apply ArgoCD ingress manifest
echo "Creating Ingress for argocd pointing to host $HOST"
kubectl apply -f "$REPO_ROOT/argocd/ingress-argocd.yaml"

# patch ingress host to requested HOST so the manifest matches the chosen host
kubectl -n argocd patch ingress argocd-server-ingress --type=json -p "[( { \"op\": \"replace\", \"path\": \"/spec/rules/0/host\", \"value\": \"$HOST\" } , { \"op\": \"replace\", \"path\": \"/spec/tls/0/hosts/0\", \"value\": \"$HOST\" } )]" || true

# 6) Quick check
echo "Waiting for TLS secret to be present (argocd-tls) in argocd namespace..."
for i in {1..30}; do
  if kubectl -n argocd get secret argocd-tls >/dev/null 2>&1; then
    echo "TLS secret created"
    break
  fi
  echo "waiting for TLS secret... ($i/30)"
  sleep 2
done

echo "Ingress & certificate applied. If using minikube, add mapping in /etc/hosts: <minikube_ip> $HOST"
kubectl -n argocd get ingress argocd-server-ingress -o wide || true

echo "Done. You should be able to access ArgoCD at https://$HOST (TLS via cert-manager / self-signed)."
