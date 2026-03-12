#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$DEPLOY_DIR")"

echo "🧪 PREDATOR Analytics Frontend E2E Test"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TEST_PASSED=0
TEST_FAILED=0

# Test function
run_test() {
    local test_name=$1
    local test_cmd=$2
    
    echo -n "Testing: $test_name... "
    if eval "$test_cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((TEST_PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}"
        ((TEST_FAILED++))
    fi
}

# Phase 1: Cluster Setup
echo -e "${BLUE}[Phase 1] Cluster Setup${NC}"
run_test "k3d cluster exists" "k3d cluster list | grep -q 'predator-local'"
run_test "kubectl context set" "kubectl config current-context | grep -q 'k3d-predator-local'"
run_test "argocd namespace exists" "kubectl get namespace argocd"
run_test "predator namespace exists" "kubectl get namespace predator"
echo ""

# Phase 2: Frontend Deployment
echo -e "${BLUE}[Phase 2] Frontend Deployment${NC}"
run_test "Frontend deployment exists" "kubectl get deployment -n predator predator-frontend"
run_test "Frontend service exists" "kubectl get svc -n predator predator-frontend"
run_test "Frontend pods exist" "kubectl get pods -n predator -l app=frontend"
echo ""

# Phase 3: Pod Health
echo -e "${BLUE}[Phase 3] Pod Health${NC}"
RUNNING_PODS=$(kubectl get pods -n predator -l app=frontend --field-selector=status.phase=Running --no-headers | wc -l)
echo "Running pods: $RUNNING_PODS"

if [ "$RUNNING_PODS" -gt 0 ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Frontend pods are running"
    ((TEST_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC} - No running frontend pods"
    ((TEST_FAILED++))
fi
echo ""

# Phase 4: Service Connectivity
echo -e "${BLUE}[Phase 4] Service Connectivity${NC}"
run_test "Frontend service is accessible" "kubectl get svc -n predator predator-frontend -o jsonpath='{.spec.ports[0].port}' | grep -q '80'"
echo ""

# Phase 5: Security
echo -e "${BLUE}[Phase 5] Security${NC}"
run_test "Non-root user configured" "kubectl get deployment -n predator predator-frontend -o jsonpath='{.spec.template.spec.securityContext.runAsNonRoot}' | grep -q 'true'"
run_test "Read-only filesystem" "kubectl get deployment -n predator predator-frontend -o jsonpath='{.spec.template.spec.containers[0].securityContext.readOnlyRootFilesystem}' | grep -q 'true'"
run_test "No privilege escalation" "kubectl get deployment -n predator predator-frontend -o jsonpath='{.spec.template.spec.containers[0].securityContext.allowPrivilegeEscalation}' | grep -q 'false'"
echo ""

# Phase 6: Resource Limits
echo -e "${BLUE}[Phase 6] Resource Limits${NC}"
run_test "CPU limits set" "kubectl get deployment -n predator predator-frontend -o jsonpath='{.spec.template.spec.containers[0].resources.limits.cpu}' | grep -q 'm'"
run_test "Memory limits set" "kubectl get deployment -n predator predator-frontend -o jsonpath='{.spec.template.spec.containers[0].resources.limits.memory}' | grep -q 'Mi'"
echo ""

# Phase 7: Health Checks
echo -e "${BLUE}[Phase 7] Health Checks${NC}"
run_test "Liveness probe configured" "kubectl get deployment -n predator predator-frontend -o jsonpath='{.spec.template.spec.containers[0].livenessProbe.httpGet.path}' | grep -q '/'"
run_test "Readiness probe configured" "kubectl get deployment -n predator predator-frontend -o jsonpath='{.spec.template.spec.containers[0].readinessProbe.httpGet.path}' | grep -q '/'"
echo ""

# Phase 8: Autoscaling
echo -e "${BLUE}[Phase 8] Autoscaling${NC}"
if kubectl get hpa -n predator predator-frontend > /dev/null 2>&1; then
    run_test "HPA configured" "kubectl get hpa -n predator predator-frontend"
    run_test "HPA min replicas" "kubectl get hpa -n predator predator-frontend -o jsonpath='{.spec.minReplicas}' | grep -q '[0-9]'"
    run_test "HPA max replicas" "kubectl get hpa -n predator predator-frontend -o jsonpath='{.spec.maxReplicas}' | grep -q '[0-9]'"
else
    echo -e "${YELLOW}⚠️  SKIPPED${NC} - HPA not configured"
fi
echo ""

# Phase 9: ArgoCD Integration
echo -e "${BLUE}[Phase 9] ArgoCD Integration${NC}"
run_test "ArgoCD server running" "kubectl get deployment -n argocd argocd-server"
if kubectl get application -n argocd predator-frontend > /dev/null 2>&1; then
    run_test "Frontend ArgoCD Application exists" "kubectl get application -n argocd predator-frontend"
else
    echo -e "${YELLOW}⚠️  SKIPPED${NC} - Frontend ArgoCD Application not found"
fi
echo ""

# Phase 10: Image Configuration
echo -e "${BLUE}[Phase 10] Image Configuration${NC}"
IMAGE=$(kubectl get deployment -n predator predator-frontend -o jsonpath='{.spec.template.spec.containers[0].image}')
echo "Frontend image: $IMAGE"
run_test "Image is from GHCR or local" "echo '$IMAGE' | grep -E '(ghcr.io|predator-analytics-ui)'"
echo ""

# Phase 11: Volume Mounts
echo -e "${BLUE}[Phase 11] Volume Mounts${NC}"
run_test "Nginx cache volume mounted" "kubectl get deployment -n predator predator-frontend -o jsonpath='{.spec.template.spec.containers[0].volumeMounts[*].name}' | grep -q 'nginx-cache'"
run_test "Nginx run volume mounted" "kubectl get deployment -n predator predator-frontend -o jsonpath='{.spec.template.spec.containers[0].volumeMounts[*].name}' | grep -q 'nginx-run'"
echo ""

# Phase 12: Port Configuration
echo -e "${BLUE}[Phase 12] Port Configuration${NC}"
run_test "Container port is 3030" "kubectl get deployment -n predator predator-frontend -o jsonpath='{.spec.template.spec.containers[0].ports[0].containerPort}' | grep -q '3030'"
run_test "Service port is 80" "kubectl get svc -n predator predator-frontend -o jsonpath='{.spec.ports[0].port}' | grep -q '80'"
echo ""

# Final Summary
echo "======================================================"
echo -e "${BLUE}📊 Test Summary:${NC}"
echo -e "   ${GREEN}Passed: $TEST_PASSED${NC}"
echo -e "   ${RED}Failed: $TEST_FAILED${NC}"
echo ""

if [ $TEST_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "🎉 Frontend is fully operational!"
    echo ""
    echo "📍 Access frontend at:"
    echo "   http://localhost:3030"
    echo ""
    echo "📊 View deployment status:"
    echo "   kubectl get all -n predator"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    echo ""
    echo "🔍 Run verification script for more details:"
    echo "   ./verify_deployment.sh"
    echo ""
    exit 1
fi
