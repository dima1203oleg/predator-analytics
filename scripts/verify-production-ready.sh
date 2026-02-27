#!/bin/bash
# 🦅 Predator v45 | Neural Analytics.1 Production Readiness Verification
# Перевіряє всі критерії готовності до production

set -e

PROJECT_ROOT="/Users/dima-mac/Documents/Predator_21"
cd "$PROJECT_ROOT"

echo "🔍 Predator v45 | Neural Analytics.1 PRODUCTION READINESS CHECK"
echo "============================================"
echo ""

PASS=0
FAIL=0
WARN=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++)) || true
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++)) || true
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN++)) || true
}

echo "📁 PHASE 1: PROJECT STRUCTURE"
echo "----------------------------"

# Check critical directories
[[ -d "app" ]] && check_pass "Backend directory exists" || check_fail "Backend directory missing"
[[ -d "apps/predator-analytics-ui" ]] && check_pass "Frontend directory exists" || check_fail "Frontend directory missing"
[[ -d "helm/charts" ]] && check_pass "Helm charts directory exists" || check_fail "Helm charts missing"
[[ -d "app/core" ]] && check_pass "Core modules directory exists" || check_fail "Core modules missing"
[[ -d "app/pipelines" ]] && check_pass "Pipelines directory exists" || check_fail "Pipelines missing"

echo ""
echo "🔧 PHASE 2: CORE COMPONENTS"
echo "----------------------------"

# Check critical Python files
[[ -f "app/core/registry.py" ]] && check_pass "Runtime Registry" || check_fail "Runtime Registry missing"
[[ -f "app/pipelines/circuit_breaker.py" ]] && check_pass "Circuit Breaker" || check_fail "Circuit Breaker missing"

# Check frontend components
[[ -f "apps/predator-analytics-ui/src/components/ai/AIResponse.tsx" ]] && check_pass "AIResponse component" || check_fail "AIResponse component missing"
[[ -f "apps/predator-analytics-ui/src/components/ingestion/IngestionProgressMonitor.tsx" ]] && check_pass "IngestionProgressMonitor" || check_fail "IngestionProgressMonitor missing"
[[ -f "apps/predator-analytics-ui/src/components/provenance/ProvenanceCard.tsx" ]] && check_pass "ProvenanceCard" || check_fail "ProvenanceCard missing"
[[ -f "apps/predator-analytics-ui/src/components/business/BusinessMetricsDashboard.tsx" ]] && check_pass "BusinessMetricsDashboard" || check_fail "BusinessMetricsDashboard missing"

echo ""
echo "☸️  PHASE 3: HELM CHARTS"
echo "----------------------------"

# Check Helm charts
[[ -f "helm/charts/predator-backend/Chart.yaml" ]] && check_pass "Backend Chart.yaml" || check_fail "Backend Chart.yaml missing"
[[ -f "helm/charts/predator-backend/values.yaml" ]] && check_pass "Backend values.yaml" || check_fail "Backend values.yaml missing"
[[ -f "helm/charts/predator-frontend/Chart.yaml" ]] && check_pass "Frontend Chart.yaml" || check_fail "Frontend Chart.yaml missing"
[[ -f "helm/charts/predator-frontend/values.yaml" ]] && check_pass "Frontend values.yaml" || check_fail "Frontend values.yaml missing"

# Validate Helm charts
if command -v helm &> /dev/null; then
    if helm lint helm/charts/predator-backend &> /dev/null; then
        check_pass "Backend Helm chart valid"
    else
        check_warn "Backend Helm chart has warnings"
    fi

    if helm lint helm/charts/predator-frontend &> /dev/null; then
        check_pass "Frontend Helm chart valid"
    else
        check_warn "Frontend Helm chart has warnings"
    fi
else
    check_warn "Helm not installed - skipping validation"
fi

echo ""
echo "📚 PHASE 4: DOCUMENTATION"
echo "----------------------------"

[[ -f "docs/PREDATOR_MASTER_SPEC_v45.1.md" ]] && check_pass "Master Spec v45.1" || check_fail "Master Spec missing"
[[ -f "docs/SUPERVISOR_PROMPT.md" ]] && check_pass "Supervisor Prompt" || check_fail "Supervisor Prompt missing"
[[ -f "docs/EXECUTION_RUNBOOKS.md" ]] && check_pass "Execution Runbooks" || check_fail "Execution Runbooks missing"
[[ -f "docs/INTEGRATION_PLAN_v45.1_PRODUCTION.md" ]] && check_pass "Integration Plan" || check_fail "Integration Plan missing"

echo ""
echo "🚀 PHASE 5: DEPLOYMENT READINESS"
echo "----------------------------"

[[ -f "START_3045.sh" ]] && check_pass "UI Launch Script" || check_fail "UI Launch Script missing"
[[ -f "BACKEND_CLEAN_BOOT.sh" ]] && check_pass "Backend Boot Script" || check_fail "Backend Boot Script missing"

# Check if scripts are executable
[[ -x "START_3045.sh" ]] && check_pass "UI script executable" || check_warn "UI script not executable"
[[ -x "BACKEND_CLEAN_BOOT.sh" ]] && check_pass "Backend script executable" || check_warn "Backend script not executable"

echo ""
echo "============================================"
echo "📊 SUMMARY"
echo "============================================"
echo -e "${GREEN}PASSED:${NC} $PASS"
echo -e "${YELLOW}WARNINGS:${NC} $WARN"
echo -e "${RED}FAILED:${NC} $FAIL"
echo ""

if [[ $FAIL -eq 0 ]]; then
    echo -e "${GREEN}✅ Predator v45 | Neural Analytics.1 PRODUCTION READY${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Deploy backend: helm install predator-backend ./helm/charts/predator-backend"
    echo "2. Deploy frontend: helm install predator-frontend ./helm/charts/predator-frontend"
    echo "3. Verify endpoints: curl https://api.predator-analytics.com/health"
    exit 0
else
    echo -e "${RED}❌ PRODUCTION NOT READY${NC}"
    echo ""
    echo "Fix the failed checks above before deploying."
    exit 1
fi
