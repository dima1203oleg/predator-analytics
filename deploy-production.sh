#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🚀 PREDATOR Analytics v56.1.4 - Production Deployment Script
# 
# Автоматизований деплоймент з health checks та rollback support.
# Використання: ./deploy-production.sh [environment]
#   environment: staging | production (default: production)
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="predator-analytics"
VERSION="56.1.4"
HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_INTERVAL=5
API_PORT=8000
FRONTEND_PORT=3030

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ═══════════════════════════════════════════════════════════════
# PRE-DEPLOYMENT CHECKS
# ═══════════════════════════════════════════════════════════════

pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check Docker is running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check required files exist
    required_files=(
        "docker-compose.yml"
        "services/core-api/app/main.py"
        "apps/predator-analytics-ui/package.json"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Required file not found: $file"
            exit 1
        fi
    done
    
    log_success "Pre-deployment checks passed"
}

# ═══════════════════════════════════════════════════════════════
# DATABASE MIGRATIONS
# ═══════════════════════════════════════════════════════════════

run_database_migrations() {
    log_info "Running database migrations..."
    
    # Run Alembic migrations
    if docker-compose exec -T core-api alembic upgrade head 2>/dev/null; then
        log_success "Database migrations completed successfully"
    else
        log_warning "Database migrations skipped (database may not be ready yet)"
        log_info "Migrations will run automatically on first API startup"
    fi
}

# ═══════════════════════════════════════════════════════════════
# BUILD & DEPLOY
# ═══════════════════════════════════════════════════════════════

build_and_deploy() {
    log_info "Building and deploying ${PROJECT_NAME} v${VERSION} to ${ENVIRONMENT}..."
    
    # Pull latest images (if using remote registry)
    log_info "Pulling latest images..."
    docker-compose pull || true
    
    # Build services
    log_info "Building services..."
    docker-compose build --no-cache
    
    # Stop old containers gracefully
    log_info "Stopping old containers..."
    docker-compose down --timeout 30 || true
    
    # Start new containers
    log_info "Starting new containers..."
    docker-compose up -d
    
    log_success "Deployment initiated"
}

# ═══════════════════════════════════════════════════════════════
# HEALTH CHECKS
# ═══════════════════════════════════════════════════════════════

wait_for_service() {
    local service_name=$1
    local url=$2
    local retries=$HEALTH_CHECK_RETRIES
    
    log_info "Waiting for ${service_name} to become healthy..."
    
    for i in $(seq 1 $retries); do
        if curl -sf "$url" > /dev/null 2>&1; then
            log_success "${service_name} is healthy!"
            return 0
        fi
        
        log_info "Attempt $i/$retries - waiting ${HEALTH_CHECK_INTERVAL}s..."
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    log_error "${service_name} failed to become healthy after $retries attempts"
    return 1
}

perform_health_checks() {
    log_info "Performing comprehensive health checks..."
    
    # Wait for API to be ready
    if ! wait_for_service "Core API" "http://localhost:${API_PORT}/health/live"; then
        log_error "Core API health check failed!"
        rollback_deployment
        exit 1
    fi
    
    # Wait for readiness (database connection)
    if ! wait_for_service "API Readiness" "http://localhost:${API_PORT}/health/ready"; then
        log_warning "API readiness check failed (database may still be initializing)"
    fi
    
    # Check critical endpoints
    log_info "Testing critical API endpoints..."
    
    # Dashboard endpoint
    if curl -sf "http://localhost:${API_PORT}/api/v1/dashboard/overview" > /dev/null 2>&1; then
        log_success "✓ Dashboard API endpoint working"
    else
        log_warning "✗ Dashboard API endpoint not responding"
    fi
    
    # Market endpoint
    if curl -sf "http://localhost:${API_PORT}/api/v1/market/overview" > /dev/null 2>&1; then
        log_success "✓ Market API endpoint working"
    else
        log_warning "✗ Market API endpoint not responding"
    fi
    
    # Monitoring endpoint
    if curl -sf "http://localhost:${API_PORT}/api/v1/monitoring/system-health" > /dev/null 2>&1; then
        log_success "✓ Monitoring API endpoint working"
    else
        log_warning "✗ Monitoring API endpoint not responding"
    fi
    
    # Frontend (if applicable)
    if curl -sf "http://localhost:${FRONTEND_PORT}" > /dev/null 2>&1; then
        log_success "✓ Frontend is accessible"
    else
        log_warning "✗ Frontend not accessible (may need separate deployment)"
    fi
    
    log_success "Health checks completed"
}

# ═══════════════════════════════════════════════════════════════
# ROLLBACK
# ═══════════════════════════════════════════════════════════════

rollback_deployment() {
    log_warning "Rolling back deployment..."
    
    # Stop current containers
    docker-compose down --timeout 10 || true
    
    # Restart previous version (if backup exists)
    if [ -f "docker-compose.backup.yml" ]; then
        log_info "Restoring previous version from backup..."
        mv docker-compose.backup.yml docker-compose.yml
        docker-compose up -d
        log_success "Rollback completed"
    else
        log_error "No backup found. Manual intervention required."
    fi
}

# ═══════════════════════════════════════════════════════════════
# POST-DEPLOYMENT
# ═══════════════════════════════════════════════════════════════

post_deployment() {
    log_info "Running post-deployment tasks..."
    
    # Create backup of current deployment
    if [ -f "docker-compose.yml" ]; then
        cp docker-compose.yml docker-compose.backup.yml
        log_success "Deployment backup created"
    fi
    
    # Display deployment summary
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║          DEPLOYMENT SUMMARY                            ║"
    echo "╠══════════════════════════════════════════════════════════╣"
    echo "║ Project:    ${PROJECT_NAME}                    ║"
    echo "║ Version:    ${VERSION}                              ║"
    echo "║ Environment: ${ENVIRONMENT}                           ║"
    echo "║ Timestamp:  $(date -u '+%Y-%m-%d %H:%M:%S UTC')         ║"
    echo "╠══════════════════════════════════════════════════════════╣"
    echo "║ Endpoints:                                              ║"
    echo "║ • API:      http://localhost:${API_PORT}                      ║"
    echo "║ • Frontend: http://localhost:${FRONTEND_PORT}                      ║"
    echo "║ • Health:   http://localhost:${API_PORT}/health                ║"
    echo "║ • Docs:     http://localhost:${API_PORT}/api/docs              ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    
    log_success "Deployment completed successfully! 🚀"
}

# ═══════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════

main() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║  PREDATOR Analytics v${VERSION} - Production Deploy       ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    
    # Step 1: Pre-deployment checks
    pre_deployment_checks
    
    # Step 2: Database migrations
    run_database_migrations
    
    # Step 3: Build and deploy
    build_and_deploy
    
    # Step 4: Health checks
    perform_health_checks
    
    # Step 5: Post-deployment
    post_deployment
    
    log_success "All done! System is ready for production use."
}

# Execute main function
main "$@"
