#!/bin/bash
set -e

# PREDATOR ANALYTICS v28-S Deployment Script (Server Edition)
# Usage: ./deploy_v28s_server.sh [ENVIRONMENT]
# Example: ./deploy_v28s_server.sh production

ENV=${1:-production}
VALUES_FILE="values-${ENV}.yaml"

echo "🦅 PREDATOR ANALYTICS v28-S DEPLOYMENT SEQUENCE STARTED"
echo "------------------------------------------------------"
echo "Target Environment: $ENV"
echo "Using Values File: helm/predator-analytics/$VALUES_FILE"
echo "------------------------------------------------------"

# 1. Update Dependencies
echo "📦 Updating Helm Dependencies..."
cd helm/predator-analytics
helm dependency update
cd ../..

# 2. Check Kubernetes Context
CURRENT_CTX=$(kubectl config current-context)
echo "🌐 Using Kubernetes Context: $CURRENT_CTX"

# 3. Create Namespace (if not exists)
echo "🏗️ Ensuring Namespace 'predator-analytics'..."
kubectl create namespace predator-analytics --dry-run=client -o yaml | kubectl apply -f -

# 4. Handle Secrets Ownership (Reconcile with Helm)
# If secret exists but is not managed by Helm, we must add ownership labels/annotations
echo "🔐 Reconciling Secrets Ownership..."
if kubectl get secret predator-secrets -n predator-analytics > /dev/null 2>&1; then
    echo "⚠️ Patching existing secret for Helm ownership..."
    kubectl label secret predator-secrets -n predator-analytics app.kubernetes.io/managed-by=Helm --overwrite
    kubectl annotate secret predator-secrets -n predator-analytics meta.helm.sh/release-name=predator-analytics --overwrite
    kubectl annotate secret predator-secrets -n predator-analytics meta.helm.sh/release-namespace=predator-analytics --overwrite
else
    echo "⚠️ Secrets not found. Creating placeholder secret..."
    kubectl create secret generic predator-secrets \
        --from-literal=database-url="postgresql://predator:predator_password@predator-analytics-postgresql:5432/predator_db" \
        --from-literal=jwt-secret="$(openssl rand -hex 32)" \
        -n predator-analytics
    # Add Helm metadata to the new secret as well
    kubectl label secret predator-secrets -n predator-analytics app.kubernetes.io/managed-by=Helm --overwrite
    kubectl annotate secret predator-secrets -n predator-analytics meta.helm.sh/release-name=predator-analytics --overwrite
    kubectl annotate secret predator-secrets -n predator-analytics meta.helm.sh/release-namespace=predator-analytics --overwrite
fi

# 5. Deploy / Upgrade via Helm
echo "🚀 Deploying via Helm (v28-S)..."
# Use environment-specific values after base values
set +e # Temporarily allow failure for retry logic
helm upgrade --install predator-analytics ./helm/predator-analytics \
    --namespace predator-analytics \
    --values ./helm/predator-analytics/values.yaml \
    --values ./helm/predator-analytics/$VALUES_FILE \
    --timeout 10m0s \
    --wait

HELM_STATUS=$?
if [ $HELM_STATUS -ne 0 ]; then
    echo "⚠️ Helm deployment failed. Checking if it's a secret ownership issue..."
    # Attempt one-time force reconciliation if it looks like the ownership error
    kubectl label secret predator-secrets -n predator-analytics app.kubernetes.io/managed-by=Helm --overwrite || true
    kubectl annotate secret predator-secrets -n predator-analytics meta.helm.sh/release-name=predator-analytics --overwrite || true
    kubectl annotate secret predator-secrets -n predator-analytics meta.helm.sh/release-namespace=predator-analytics --overwrite || true

    echo "🔄 Retrying Helm deployment..."
    helm upgrade --install predator-analytics ./helm/predator-analytics \
        --namespace predator-analytics \
        --values ./helm/predator-analytics/values.yaml \
        --values ./helm/predator-analytics/$VALUES_FILE \
        --timeout 10m0s \
        --wait
fi
set -e

echo "------------------------------------------------------"
echo "✅ DEPLOYMENT COMPLETED SUCCESSFULLY"
echo "📊 Access Dashboard at: http://$(kubectl get svc predator-analytics-frontend -n predator-analytics -o jsonpath='{.status.loadBalancer.ingress[0].ip}')"
echo "------------------------------------------------------"
