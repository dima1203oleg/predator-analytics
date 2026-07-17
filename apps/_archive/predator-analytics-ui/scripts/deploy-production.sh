#!/bin/bash

# 🚀 PREDATOR Analytics UI - Production Deployment Script
# Version: v55.1.0
# Purpose: Automated production deployment with full verification

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
IMAGE_NAME="predator-analytics-ui"
VERSION="v55.1.0-production"
PORT="3030"
REGISTRY="ghcr.io/dima1203oleg"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        exit 1
    fi
    
    print_success "All prerequisites satisfied"
}

# Function to run TypeScript check
run_typescript_check() {
    print_status "Running TypeScript compilation check..."
    
    cd "$(dirname "$0")/.."
    
    if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
        print_error "TypeScript compilation failed"
        npx tsc --noEmit
        exit 1
    fi
    
    print_success "TypeScript compilation check passed"
}

# Function to run build
run_build() {
    print_status "Running production build..."
    
    cd "$(dirname "$0")/.."
    
    # Clean previous build
    rm -rf dist/
    
    # Run build
    if ! npm run build; then
        print_error "Build failed"
        exit 1
    fi
    
    # Check if dist directory exists and has files
    if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
        print_error "Build output directory is empty"
        exit 1
    fi
    
    print_success "Build completed successfully"
}

# Function to build Docker image
build_docker_image() {
    print_status "Building Docker image..."
    
    cd "$(dirname "$0")/.."
    
    # Build image
    if ! docker build -t "${IMAGE_NAME}:${VERSION}" .; then
        print_error "Docker build failed"
        exit 1
    fi
    
    # Also tag with latest
    docker tag "${IMAGE_NAME}:${VERSION}" "${IMAGE_NAME}:latest"
    
    print_success "Docker image built successfully"
}

# Function to run security scan
run_security_scan() {
    print_status "Running security scan..."
    
    cd "$(dirname "$0")/.."
    
    # Check for non-root user
    if ! docker run --rm "${IMAGE_NAME}:${VERSION}" id | grep -q "predator"; then
        print_error "Container is not running as non-root user"
        exit 1
    fi
    
    # Check for health endpoint
    if ! docker run --rm -d -p "${PORT}:${PORT}" --name test-health "${IMAGE_NAME}:${VERSION}"; then
        print_error "Failed to start test container"
        exit 1
    fi
    
    # Wait for container to start
    sleep 5
    
    # Check health endpoint
    if ! curl -f -s "http://localhost:${PORT}/health" > /dev/null; then
        print_error "Health check failed"
        docker stop test-health
        docker rm test-health
        exit 1
    fi
    
    # Stop test container
    docker stop test-health
    docker rm test-health
    
    print_success "Security scan passed"
}

# Function to push to registry
push_to_registry() {
    print_status "Pushing to registry..."
    
    cd "$(dirname "$0")/.."
    
    # Tag for registry
    docker tag "${IMAGE_NAME}:${VERSION}" "${REGISTRY}/${IMAGE_NAME}:${VERSION}"
    docker tag "${IMAGE_NAME}:latest" "${REGISTRY}/${IMAGE_NAME}:latest"
    
    # Push to registry
    if ! docker push "${REGISTRY}/${IMAGE_NAME}:${VERSION}"; then
        print_error "Failed to push version tag"
        exit 1
    fi
    
    if ! docker push "${REGISTRY}/${IMAGE_NAME}:latest"; then
        print_error "Failed to push latest tag"
        exit 1
    fi
    
    print_success "Successfully pushed to registry"
}

# Function to deploy with Docker Compose
deploy_with_compose() {
    print_status "Deploying with Docker Compose..."
    
    cd "$(dirname "$0")/../.."
    
    # Update docker-compose.yml with new image
    sed -i.bak "s|image: ${IMAGE_NAME}:.*|image: ${REGISTRY}/${IMAGE_NAME}:${VERSION}|g" docker-compose.frontend.yml
    
    # Pull new image
    docker-compose -f docker-compose.frontend.yml pull
    
    # Restart service
    docker-compose -f docker-compose.frontend.yml up -d
    
    # Wait for service to be healthy
    print_status "Waiting for service to be healthy..."
    for i in {1..30}; do
        if curl -f -s "http://localhost:${PORT}/health" > /dev/null; then
            print_success "Service is healthy"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Service failed to become healthy"
            exit 1
        fi
        sleep 2
    done
    
    print_success "Deployment completed successfully"
}

# Function to generate deployment report
generate_report() {
    print_status "Generating deployment report..."
    
    cd "$(dirname "$0")/.."
    
    REPORT_FILE="deployment-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$REPORT_FILE" << EOF
# 🚀 PREDATOR Analytics UI - Deployment Report

**Version**: ${VERSION}  
**Date**: $(date)  
**Status**: ✅ SUCCESS

## 📋 Deployment Summary

- ✅ TypeScript compilation check passed
- ✅ Production build completed
- ✅ Docker image built successfully
- ✅ Security scan passed
- ✅ Pushed to registry
- ✅ Deployed with Docker Compose

## 📊 Build Metrics

\`\`\`
Bundle size: $(du -sh dist/ | cut -f1)
Build time: $(npm run build 2>&1 | grep "built in" | tail -1 | grep -o "[0-9.]*s")
Image size: $(docker images "${IMAGE_NAME}:${VERSION}" --format "{{.Size}}")
\`\`\`

## 🐳 Docker Information

\`\`\`
Image: ${REGISTRY}/${IMAGE_NAME}:${VERSION}
Port: ${PORT}
Health: http://localhost:${PORT}/health
\`\`\`

## 🔍 Verification Commands

\`\`\`bash
# Check container status
docker ps --filter "name=predator-frontend"

# Check health
curl http://localhost:${PORT}/health

# View logs
docker logs predator-frontend --tail 50
\`\`\`

## 📝 Notes

- All TypeScript errors resolved
- Production build optimized with Terser
- Docker multi-stage build with non-root user
- Health checks configured
- Ready for production traffic

---

**Generated by**: deploy-production.sh  
**Environment**: Production  
**Compliance**: AGENTS.md v55
EOF

    print_success "Deployment report generated: $REPORT_FILE"
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up..."
    
    cd "$(dirname "$0")/.."
    
    # Remove test containers if any
    docker rm -f test-health 2>/dev/null || true
    
    # Remove temporary files
    rm -f docker-compose.frontend.yml.bak
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    print_status "Starting ${PROJECT_NAME} ${SERVICE_NAME} deployment..."
    print_status "Version: ${VERSION}"
    
    # Check prerequisites
    check_prerequisites
    
    # Run checks
    run_typescript_check
    run_build
    
    # Build and test Docker image
    build_docker_image
    run_security_scan
    
    # Deploy
    push_to_registry
    deploy_with_compose
    
    # Generate report
    generate_report
    
    print_success "🎉 Deployment completed successfully!"
    print_status "Access the application at: http://localhost:${PORT}"
}

# Trap cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"
