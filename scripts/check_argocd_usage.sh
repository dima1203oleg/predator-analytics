#!/usr/bin/env bash
# Check if ArgoCD is used and reachable
set -euo pipefail

ARGOCD_URL=${ARGOCD_NVIDIA_URL:-${ARGOCD_SERVER:-}}
ARGOCD_TOKEN=${ARGOCD_NVIDIA_TOKEN:-${ARGOCD_TOKEN:-}}
if [[ "${ARGOCD_INSECURE:-false}" =~ ^(1|true|yes)$ ]]; then
  CURL_INSECURE="-k"
else
  CURL_INSECURE=""
fi

echo "🔎 Checking repository for ArgoCD manifests..."
if [ -d "./argocd" ] || ls k8s/argocd* >/dev/null 2>&1; then
  echo "✅ ArgoCD manifests found in repo (argocd/ dirs present)."
else
  echo "⚠️ No ArgoCD manifests found in repo (argocd/). It may still be used externally."
fi

if [ -n "${ARGOCD_URL}" ]; then
  echo "🔗 ArgoCD server: ${ARGOCD_URL}"
  if [ -z "${ARGOCD_TOKEN}" ]; then
    echo "⚠️ ARGOCD token not set — cannot call ArgoCD API. Set ARGOCD_NVIDIA_TOKEN or ARGOCD_TOKEN to allow checks."
    exit 0
  fi

  echo "🔐 Testing ArgoCD API..."
  set +e
  HTTP_STATUS=$(curl $CURL_INSECURE -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${ARGOCD_TOKEN}" ${ARGOCD_URL}/api/v1/applications)
  set -e
  if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ ArgoCD API reachable and authentication OK (status 200)."
  else
    echo "❌ ArgoCD API returned status: ${HTTP_STATUS}. Token or URL may be incorrect."
  fi
else
  echo "⚠️ ARGOCD_URL not configured (ARGOCD_NVIDIA_URL/ARGOCD_SERVER not set)."
fi

echo "🔚 Check finished."
