#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔍 PREDATOR Analytics Frontend Deployment Verification"
echo "======================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

# Function to check status
check_status() {
    local name=$1
    local command=$2
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} $name"
        ((PASSED++))
    else
        echo -e "${RED}❌${NC} $name"
        ((FAILED++))
    fi
}

# 1. Check k3d cluster
echo "📦 Cluster Status:"
check_status "k3d cluster running" "k3d cluster list | grep -q 'predator-local'"
check_status "kubectl accessible" "kubectl cluster-info > /dev/null"

echo ""
echo "🔐 Kubernetes Context:"
CONTEXT=$(kubectl config current-context)
echo "   Current context: $CONTEXT"

echo ""
echo "📍 Namespaces:"
check_status "argocd namespace exists" "kubectl get namespace argocd > /dev/null"
check_status "predator namespace exists" "kubectl get namespace predator > /dev/null"

echo ""
echo "🚀 Frontend Deployment:"
check_status "Frontend deployment exists" "kubectl get deployment -n predator predator-frontend > /dev/null"
check_status "Frontend pods running" "kubectl get pods -n predator -l app=frontend | grep -q Running"

# Get frontend pod count
FRONTEND_PODS=$(kubectl get pods -n predator -l app=frontend --no-headers 2>/dev/null | wc -l)
echo "   Frontend pods: $FRONTEND_PODS"

echo ""
echo "🔄 Frontend Service:"
check_status "Frontend service exists" "kubectl get svc -n predator predator-frontend > /dev/null"

# Get service info
FRONTEND_SVC=$(kubectl get svc -n predator predator-frontend -o jsonpath='{.spec.type}' 2>/dev/null)
echo "   Service type: $FRONTEND_SVC"

echo ""
echo "📊 Frontend Replicas:"
DESIRED=$(kubectl get deployment -n predator predator-frontend -o jsonpath='{.spec.replicas}' 2>/dev/null)
READY=$(kubectl get deployment -n predator predator-frontend -o jsonpath='{.status.readyReplicas}' 2>/dev/null)
echo "   Desired: $DESIRED, Ready: $READY"

if [ "$DESIRED" == "$READY" ]; then
    echo -e "   ${GREEN}✅ All replicas ready${NC}"
    ((PASSED++))
else
    echo -e "   ${RED}❌ Not all replicas ready${NC}"
    ((FAILED++))
fi

echo ""
echo "🔗 Ingress:"
check_status "Ingress exists" "kubectl get ingress -n predator > /dev/null"

echo ""
echo "⚙️  HPA Status:"
check_status "HPA exists" "kubectl get hpa -n predator predator-frontend > /dev/null"

if kubectl get hpa -n predator predator-frontend > /dev/null 2>&1; then
    HPA_MIN=$(kubectl get hpa -n predator predator-frontend -o jsonpath='{.spec.minReplicas}' 2>/dev/null)
    HPA_MAX=$(kubectl get hpa -n predator predator-frontend -o jsonpath='{.spec.maxReplicas}' 2>/dev/null)
    echo "   Min replicas: $HPA_MIN, Max replicas: $HPA_MAX"
fi

echo ""
echo "🔐 Security Context:"
check_status "Non-root user configured" "kubectl get deployment -n predator predator-frontend -o jsonpath='{.spec.template.spec.securityContext.runAsNonRoot}' | grep -q true"

echo ""
echo "📦 ArgoCD:"
check_status "ArgoCD namespace exists" "kubectl get namespace argocd > /dev/null"
check_status "ArgoCD server running" "kubectl get deployment -n argocd argocd-server > /dev/null"

echo ""
echo "🌐 Frontend Connectivity:"
# Try to connect to frontend
FRONTEND_IP=$(kubectl get svc -n predator predator-frontend -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
if [ "$FRONTEND_IP" != "pending" ] && [ -n "$FRONTEND_IP" ]; then
    check_status "Frontend responds to HTTP" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3030 | grep -q '200\\|301\\|302\\|404'"
    echo "   Frontend IP: $FRONTEND_IP"
else
    echo "   Frontend IP: pending (LoadBalancer not assigned yet)"
fi

echo ""
echo "📋 Pod Health:"
UNHEALTHY=$(kubectl get pods -n predator -l app=frontend --field-selector=status.phase!=Running --no-headers 2>/dev/null | wc -l)
if [ "$UNHEALTHY" -eq 0 ]; then
    echo -e "   ${GREEN}✅ All pods healthy${NC}"
    ((PASSED++))
else
    echo -e "   ${RED}❌ $UNHEALTHY unhealthy pods${NC}"
    ((FAILED++))
fi

echo ""
echo "📊 Resource Usage:"
if kubectl top pods -n predator -l app=frontend > /dev/null 2>&1; then
    kubectl top pods -n predator -l app=frontend
else
    echo "   Metrics not available (metrics-server may not be installed)"
fi

echo ""
echo "======================================================"
echo "📈 Summary:"
echo -e "   ${GREEN}Passed: $PASSED${NC}"
echo -e "   ${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "🎉 Frontend is ready at: http://localhost:3030"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please review the output above.${NC}"
    exit 1
fi
