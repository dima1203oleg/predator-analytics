#!/bin/bash
# PREDATOR Analytics - Production Setup Script
# ═════════════════════════════════════════════════════════════════

set -e  # Exit on any error

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

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root for security reasons"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 is not installed"
        exit 1
    fi
    
    # Check Python version
    python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    if [[ $(echo "$python_version < 3.12" | bc -l) -eq 1 ]]; then
        log_error "Python 3.12+ is required, found $python_version"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Generate secure secret key
generate_secret_key() {
    log_info "Generating secure SECRET_KEY..."
    
    if [[ ! -f .env ]]; then
        log_warning ".env file not found, creating from template"
        cp .env.example .env
    fi
    
    # Generate secure key
    secret_key=$(python3 -c 'import secrets; print(secrets.token_urlsafe(64))')
    
    # Update .env file
    sed -i.bak "s/your-super-secret-key-change-this-in-production-min-32-chars/$secret_key/" .env
    
    # Generate database password
    db_password=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')
    sed -i "s/your_password/$db_password/" .env
    
    # Generate Neo4j password
    neo4j_password=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')
    sed -i "s/your_neo4j_password/$neo4j_password/" .env
    
    # Generate MinIO keys
    minio_access_key=$(python3 -c 'import secrets; print(secrets.token_urlsafe(20).upper())')
    minio_secret_key=$(python3 -c 'import secrets; print(secrets.token_urlsafe(40))')
    sed -i "s/your_minio_access_key/$minio_access_key/" .env
    sed -i "s/your_minio_secret_key/$minio_secret_key/" .env
    
    log_success "Secure keys generated and saved to .env"
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p data/postgres
    mkdir -p data/redis
    mkdir -p data/neo4j
    mkdir -p data/minio
    mkdir -p data/kafka
    
    log_success "Directories created"
}

# Set proper permissions
set_permissions() {
    log_info "Setting proper permissions..."
    
    chmod 755 logs
    chmod 755 data
    chmod 755 data/*
    
    log_success "Permissions set"
}

# Build Docker image
build_image() {
    log_info "Building Docker image..."
    
    docker build -t predator/core-api:v55.2.0 .
    
    log_success "Docker image built successfully"
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Check if all required environment variables are set
    source .env
    
    required_vars=("SECRET_KEY" "DATABASE_URL" "REDIS_URL" "NEO4J_URI")
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Check SECRET_KEY strength
    if [[ ${#SECRET_KEY} -lt 32 ]]; then
        log_error "SECRET_KEY must be at least 32 characters"
        exit 1
    fi
    
    log_success "Health checks passed"
}

# Start services
start_services() {
    log_info "Starting Predator Analytics services..."
    
    docker-compose -f docker-compose.prod.yml up -d
    
    log_success "Services started"
}

# Wait for services to be ready
wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    # Wait for PostgreSQL
    log_info "Waiting for PostgreSQL..."
    timeout 60 bash -c 'until docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U predator -d predator; do sleep 2; done'
    
    # Wait for Redis
    log_info "Waiting for Redis..."
    timeout 30 bash -c 'until docker-compose -f docker-compose.prod.yml exec redis redis-cli ping; do sleep 2; done'
    
    # Wait for Neo4j
    log_info "Waiting for Neo4j..."
    timeout 90 bash -c 'until docker-compose -f docker-compose.prod.yml exec neo4j cypher-shell -u neo4j -p $NEO4J_PASSWORD "RETURN 1" &>/dev/null; do sleep 5; done'
    
    log_success "All services are ready"
}

# Run final verification
final_verification() {
    log_info "Running final verification..."
    
    # Check API health
    sleep 10  # Give API time to start
    
    if curl -f http://localhost:8000/health/live &>/dev/null; then
        log_success "API is responding correctly"
    else
        log_error "API is not responding"
        exit 1
    fi
    
    # Check comprehensive health
    health_response=$(curl -s http://localhost:8000/health | jq -r '.status // "error"' 2>/dev/null)
    
    if [[ "$health_response" == "ok" || "$health_response" == "degraded" ]]; then
        log_success "Health check passed: $health_response"
    else
        log_warning "Health check status: $health_response"
    fi
    
    log_success "Final verification completed"
}

# Show status
show_status() {
    log_info "Predator Analytics Status:"
    echo ""
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    log_info "API is available at: http://localhost:8000"
    log_info "API Documentation: http://localhost:8000/api/docs"
    log_info "Health Check: http://localhost:8000/health"
    echo ""
    log_info "Useful commands:"
    echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f predator-api"
    echo "  Stop services: docker-compose -f docker-compose.prod.yml down"
    echo "  Restart: docker-compose -f docker-compose.prod.yml restart"
}

# Main execution
main() {
    log_info "Starting Predator Analytics Production Setup..."
    echo ""
    
    check_root
    check_prerequisites
    generate_secret_key
    create_directories
    set_permissions
    build_image
    run_health_checks
    start_services
    wait_for_services
    final_verification
    show_status
    
    echo ""
    log_success "🦅 Predator Analytics is now running in production mode!"
    log_success "Ready for production traffic! 🚀"
}

# Handle script interruption
trap 'log_error "Setup interrupted"; exit 1' INT TERM

# Run main function
main "$@"
