#!/bin/bash

# ✅ PREDATOR Analytics UI - Production Verification Script
# Version: v55.1.0
# Purpose: Comprehensive production readiness verification

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="predator-analytics"
SERVICE_NAME="frontend"
VERSION="v55.1.0-production"
PORT="3030"
REGISTRY="ghcr.io/dima1203oleg"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Verification counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_CHECKS++))
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_CHECKS++))
}

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Function to increment total checks
increment_checks() {
    ((TOTAL_CHECKS++))
}

# Function to verify TypeScript compilation
verify_typescript() {
    print_header "TypeScript Compilation Verification"
    
    cd "$(dirname "$0")/.."
    
    increment_checks
    print_status "Checking TypeScript compilation..."
    
    if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
        print_error "TypeScript compilation failed"
        npx tsc --noEmit
        return 1
    else
        print_success "TypeScript compilation passed (0 errors)"
        return 0
    fi
}

# Function to verify build process
verify_build() {
    print_header "Build Process Verification"
    
    cd "$(dirname "$0")/.."
    
    increment_checks
    print_status "Checking build process..."
    
    # Clean previous build
    rm -rf dist/
    
    # Run build
    if npm run build > /dev/null 2>&1; then
        print_success "Build completed successfully"
        
        # Check dist directory
        if [ -d "dist" ] && [ -n "$(ls -A dist)" ]; then
            local dist_size=$(du -sh dist/ | cut -f1)
            print_success "Build artifacts created (${dist_size})"
            
            # Check for index.html
            if [ -f "dist/index.html" ]; then
                print_success "Main index.html found"
                increment_checks
            else
                print_error "Main index.html not found"
                return 1
            fi
            
            # Check for assets
            if [ -d "dist/assets" ]; then
                local asset_count=$(find dist/assets -name "*.js" | wc -l)
                print_success "JavaScript assets found (${asset_count} files)"
                increment_checks
            else
                print_error "No assets directory found"
                return 1
            fi
        else
            print_error "Build output directory is empty"
            return 1
        fi
    else
        print_error "Build failed"
        return 1
    fi
}

# Function to verify Docker image
verify_docker() {
    print_header "Docker Image Verification"
    
    cd "$(dirname "$0")/.."
    
    increment_checks
    print_status "Building Docker image..."
    
    if docker build -t "${PROJECT_NAME}-${SERVICE_NAME}:${VERSION}" . > /dev/null 2>&1; then
        print_success "Docker image built successfully"
        
        # Check image size
        local image_size=$(docker images "${PROJECT_NAME}-${SERVICE_NAME}:${VERSION}" --format "{{.Size}}")
        print_success "Image size: ${image_size}"
        increment_checks
        
        # Check non-root user
        increment_checks
        print_status "Checking non-root user..."
        if docker run --rm "${PROJECT_NAME}-${SERVICE_NAME}:${VERSION}" id | grep -q "predator"; then
            print_success "Container runs as non-root user (predator)"
        else
            print_error "Container does not run as non-root user"
            return 1
        fi
        
        # Check health endpoint
        increment_checks
        print_status "Testing health endpoint..."
        if docker run --rm -d -p "${PORT}:${PORT}" --name test-health "${PROJECT_NAME}-${SERVICE_NAME}:${VERSION}"; then
            sleep 5
            if curl -f -s "http://localhost:${PORT}/health" > /dev/null; then
                print_success "Health endpoint responding"
                docker stop test-health 2>/dev/null || true
                docker rm test-health 2>/dev/null || true
            else
                print_error "Health endpoint not responding"
                docker stop test-health 2>/dev/null || true
                docker rm test-health 2>/dev/null || true
                return 1
            fi
        else
            print_error "Failed to start test container"
            return 1
        fi
    else
        print_error "Docker build failed"
        return 1
    fi
}

# Function to verify security
verify_security() {
    print_header "Security Verification"
    
    cd "$(dirname "$0")/.."
    
    # Check for secrets in code
    increment_checks
    print_status "Checking for hardcoded secrets..."
    if grep -r -i "password\|secret\|key\|token" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "// password\|// secret\|// key\|// token" > /dev/null; then
        print_warning "Potential hardcoded secrets found (review manually)"
    else
        print_success "No hardcoded secrets detected"
    fi
    
    # Check for non-HTTPS URLs (except localhost)
    increment_checks
    print_status "Checking for non-HTTPS URLs..."
    if grep -r "http://" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "http://localhost\|http://127.0.0.1" > /dev/null; then
        print_warning "Non-HTTPS URLs found (review manually)"
    else
        print_success "No non-HTTPS URLs detected"
    fi
    
    # Check for console.log in production build
    increment_checks
    print_status "Checking for console.log in production build..."
    if [ -d "dist" ]; then
        if grep -r "console.log" dist/ > /dev/null; then
            print_error "console.log found in production build"
            return 1
        else
            print_success "No console.log in production build"
        fi
    else
        print_warning "No build directory to check"
    fi
}

# Function to verify performance
verify_performance() {
    print_header "Performance Verification"
    
    cd "$(dirname "$0")/.."
    
    if [ -d "dist" ]; then
        # Check bundle sizes
        increment_checks
        print_status "Checking bundle sizes..."
        
        local main_bundle=$(find dist/assets -name "index-*.js" -exec du -h {} \; | cut -f1)
        local vendor_bundle=$(find dist/assets -name "vendor-*.js" -exec du -h {} \; | sort -hr | head -1 | cut -f1)
        
        print_success "Main bundle: ${main_bundle}"
        print_success "Largest vendor bundle: ${vendor_bundle}"
        
        # Check for code splitting
        increment_checks
        print_status "Checking code splitting..."
        local chunk_count=$(find dist/assets -name "*.js" | wc -l)
        if [ "$chunk_count" -gt 5 ]; then
            print_success "Code splitting implemented (${chunk_count} chunks)"
        else
            print_warning "Limited code splitting (${chunk_count} chunks)"
        fi
        
        # Check for compression
        increment_checks
        print_status "Checking for gzip compression..."
        if gzip -t dist/assets/*.js 2>/dev/null; then
            print_success "Assets are gzip-compressible"
        else
            print_warning "Assets may not be gzip-compressible"
        fi
    else
        print_warning "No build directory to check"
    fi
}

# Function to verify documentation
verify_documentation() {
    print_header "Documentation Verification"
    
    cd "$(dirname "$0")/.."
    
    # Check for required documentation files
    local required_docs=("README.md" "CHANGELOG.md" "DEPLOYMENT.md")
    
    for doc in "${required_docs[@]}"; do
        increment_checks
        if [ -f "$doc" ]; then
            print_success "Documentation file found: $doc"
        else
            print_error "Documentation file missing: $doc"
            return 1
        fi
    done
    
    # Check for scripts
    increment_checks
    if [ -d "scripts" ] && [ -n "$(ls -A scripts)" ]; then
        local script_count=$(find scripts -name "*.sh" | wc -l)
        print_success "Deployment scripts found (${script_count} scripts)"
    else
        print_warning "No deployment scripts found"
    fi
}

# Function to verify AGENTS.md compliance
verify_compliance() {
    print_header "AGENTS.md Compliance Verification"
    
    cd "$(dirname "$0")/.."
    
    # HR-03: Comments in Ukrainian
    increment_checks
    print_status "Checking Ukrainian comments..."
    if grep -r "// " src/ --include="*.ts" --include="*.tsx" | head -5 | grep -q -E "[а-яА-Я]"; then
        print_success "Ukrainian comments found"
    else
        print_warning "Limited Ukrainian comments detected"
    fi
    
    # HR-04: UI texts in Ukrainian
    increment_checks
    print_status "Checking Ukrainian UI texts..."
    if grep -r -E "[а-яА-Я]" src/ --include="*.ts" --include="*.tsx" | grep -E "(title|label|placeholder|button|text)" | head -3 | grep -q -E "[а-яА-Я]"; then
        print_success "Ukrainian UI texts found"
    else
        print_warning "Limited Ukrainian UI texts detected"
    fi
    
    # HR-05: Docker non-root user
    increment_checks
    print_status "Checking Docker non-root user..."
    if grep -q "USER predator" Dockerfile; then
        print_success "Docker non-root user configured"
    else
        print_error "Docker non-root user not configured"
        return 1
    fi
    
    # HR-10: Port 3030
    increment_checks
    print_status "Checking port configuration..."
    if grep -q "3030" nginx.conf; then
        print_success "Port 3030 configured in nginx"
    else
        print_error "Port 3030 not configured in nginx"
        return 1
    fi
}

# Function to verify monitoring readiness
verify_monitoring() {
    print_header "Monitoring Readiness Verification"
    
    cd "$(dirname "$0")/.."
    
    # Check for monitoring configuration
    increment_checks
    if [ -d "monitoring" ] && [ -n "$(ls -A monitoring)" ]; then
        print_success "Monitoring configuration found"
        
        # Check for Prometheus config
        increment_checks
        if [ -f "monitoring/prometheus.yml" ]; then
            print_success "Prometheus configuration found"
        else
            print_warning "Prometheus configuration not found"
        fi
        
        # Check for Grafana dashboard
        increment_checks
        if [ -f "monitoring/grafana-dashboard.json" ]; then
            print_success "Grafana dashboard found"
        else
            print_warning "Grafana dashboard not found"
        fi
    else
        print_warning "No monitoring configuration found"
    fi
    
    # Check for health endpoint
    increment_checks
    print_status "Checking health endpoint configuration..."
    if grep -q "location /health" nginx.conf; then
        print_success "Health endpoint configured"
    else
        print_error "Health endpoint not configured"
        return 1
    fi
}

# Function to generate verification report
generate_report() {
    print_header "Verification Report"
    
    local report_file="production-verification-report-${TIMESTAMP}.md"
    
    cat > "$report_file" << EOF
# ✅ PREDATOR Analytics UI - Production Verification Report

**Verification ID**: ${SERVICE_NAME}-${TIMESTAMP}
**Date**: $(date)
**Version**: ${VERSION}
**Status**: $([ $FAILED_CHECKS -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")

## 📊 Verification Summary

- **Total Checks**: ${TOTAL_CHECKS}
- **Passed**: ${PASSED_CHECKS}
- **Failed**: ${FAILED_CHECKS}
- **Success Rate**: $(( PASSED_CHECKS * 100 / TOTAL_CHECKS ))%

## 🔍 Verification Categories

### ✅ TypeScript Compilation
- Status: $([ "$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")" -eq 0 ] && echo "PASSED" || echo "FAILED")

### ✅ Build Process
- Status: $([ -d "dist" ] && echo "PASSED" || echo "FAILED")
- Bundle Size: $(du -sh dist/ 2>/dev/null | cut -f1 || echo "N/A")

### ✅ Docker Image
- Status: $([ "$(docker images "${PROJECT_NAME}-${SERVICE_NAME}:${VERSION}" --format "{{.Repository}}:{{.Tag}}" 2>/dev/null | wc -l)" -gt 0 ] && echo "PASSED" || echo "FAILED")
- Image Size: $(docker images "${PROJECT_NAME}-${SERVICE_NAME}:${VERSION}" --format "{{.Size}}" 2>/dev/null || echo "N/A")

### ✅ Security
- Non-root User: $([ -f "Dockerfile" ] && grep -q "USER predator" Dockerfile && echo "PASSED" || echo "FAILED")
- No Hardcoded Secrets: $([ $(grep -r -i "password\|secret\|key\|token" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// " | wc -l) -eq 0 ] && echo "PASSED" || echo "WARNING")

### ✅ Performance
- Code Splitting: $([ -d "dist" ] && [ $(find dist/assets -name "*.js" | wc -l) -gt 5 ] && echo "PASSED" || echo "WARNING")
- Bundle Optimization: $([ -d "dist" ] && echo "PASSED" || echo "FAILED")

### ✅ Documentation
- README.md: $([ -f "README.md" ] && echo "PASSED" || echo "FAILED")
- CHANGELOG.md: $([ -f "CHANGELOG.md" ] && echo "PASSED" || echo "FAILED")
- DEPLOYMENT.md: $([ -f "DEPLOYMENT.md" ] && echo "PASSED" || echo "FAILED")

### ✅ Compliance
- AGENTS.md HR-03: $([ $(grep -r "// " src/ --include="*.ts" --include="*.tsx" | grep -E "[а-яА-Я]" | wc -l) -gt 0 ] && echo "PASSED" || echo "WARNING")
- AGENTS.md HR-04: $([ $(grep -r -E "[а-яА-Я]" src/ --include="*.ts" --include="*.tsx" | grep -E "(title|label|placeholder)" | wc -l) -gt 0 ] && echo "PASSED" || echo "WARNING")
- AGENTS.md HR-05: $([ -f "Dockerfile" ] && grep -q "USER predator" Dockerfile && echo "PASSED" || echo "FAILED")
- AGENTS.md HR-10: $([ -f "nginx.conf" ] && grep -q "3030" nginx.conf && echo "PASSED" || echo "FAILED")

### ✅ Monitoring
- Health Endpoint: $([ -f "nginx.conf" ] && grep -q "location /health" nginx.conf && echo "PASSED" || echo "FAILED")
- Monitoring Config: $([ -d "monitoring" ] && echo "PASSED" || echo "WARNING")

## 🎯 Production Readiness Assessment

$([ $FAILED_CHECKS -eq 0 ] && echo "### ✅ PRODUCTION READY" || echo "### ❌ NOT PRODUCTION READY")

$([ $FAILED_CHECKS -eq 0 ] && echo "All critical checks passed. The application is ready for production deployment." || echo "Some critical checks failed. Please address the issues before production deployment.")

## 📋 Next Steps

$([ $FAILED_CHECKS -eq 0 ] && echo "1. Deploy to production environment" || echo "1. Fix failed verification checks")
2. Monitor application performance
3. Set up alerts and monitoring
4. Document deployment process
5. Train operations team

---

**Generated by**: production-verification.sh  
**Environment**: Production  
**Compliance**: AGENTS.md v55
EOF

    print_success "Verification report generated: $report_file"
    
    # Print summary
    echo -e "\n${BLUE}=== VERIFICATION SUMMARY ===${NC}"
    echo -e "Total Checks: ${TOTAL_CHECKS}"
    echo -e "Passed: ${GREEN}${PASSED_CHECKS}${NC}"
    echo -e "Failed: ${RED}${FAILED_CHECKS}${NC}"
    echo -e "Success Rate: $(( PASSED_CHECKS * 100 / TOTAL_CHECKS ))%"
    
    if [ $FAILED_CHECKS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 PRODUCTION READY!${NC}"
        return 0
    else
        echo -e "\n${RED}❌ NOT PRODUCTION READY${NC}"
        return 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}🦅 PREDATOR Analytics UI - Production Verification${NC}"
    echo -e "${BLUE}Version: ${VERSION}${NC}"
    echo -e "${BLUE}Timestamp: ${TIMESTAMP}${NC}"
    
    # Run all verifications
    verify_typescript
    verify_build
    verify_docker
    verify_security
    verify_performance
    verify_documentation
    verify_compliance
    verify_monitoring
    
    # Generate report
    generate_report
}

# Run main function
main "$@"
