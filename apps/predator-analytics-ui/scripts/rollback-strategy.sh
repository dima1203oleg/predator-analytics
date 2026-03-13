#!/bin/bash

# 🔄 PREDATOR Analytics UI - Rollback Strategy Script
# Version: v55.1.0
# Purpose: Automated rollback procedures with safety checks

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
CURRENT_VERSION="v55.1.0-production"
REGISTRY="ghcr.io/dima1203oleg"
ROLLBACK_DIR="/opt/rollbacks/${PROJECT_NAME}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

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

# Function to create rollback directory
create_rollback_dir() {
    print_status "Creating rollback directory..."
    
    if [ ! -d "$ROLLBACK_DIR" ]; then
        sudo mkdir -p "$ROLLBACK_DIR"
        sudo chown $(whoami):$(whoami) "$ROLLBACK_DIR"
    fi
    
    ROLLBACK_PATH="${ROLLBACK_DIR}/${SERVICE_NAME}-${TIMESTAMP}"
    mkdir -p "$ROLLBACK_PATH"
    
    print_success "Rollback directory created: $ROLLBACK_PATH"
}

# Function to capture current state
capture_current_state() {
    print_status "Capturing current deployment state..."
    
    # Capture Docker images
    docker images "${IMAGE_NAME}" --format "{{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" > "${ROLLBACK_PATH}/current-images.txt"
    
    # Capture running containers
    docker ps --filter "name=predator-frontend" --format "{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" > "${ROLLBACK_PATH}/current-containers.txt"
    
    # Capture Docker Compose configuration
    if [ -f "../../docker-compose.frontend.yml" ]; then
        cp "../../docker-compose.frontend.yml" "${ROLLBACK_PATH}/current-docker-compose.yml"
    fi
    
    # Capture current git state
    cd "$(dirname "$0")/.."
    git rev-parse HEAD > "${ROLLBACK_PATH}/current-git-commit.txt"
    git status --porcelain > "${ROLLBACK_PATH}/current-git-status.txt"
    
    # Capture health status
    if curl -f -s http://localhost:3030/health > /dev/null 2>&1; then
        echo "HEALTHY" > "${ROLLBACK_PATH}/current-health-status.txt"
    else
        echo "UNHEALTHY" > "${ROLLBACK_PATH}/current-health-status.txt"
    fi
    
    print_success "Current state captured"
}

# Function to list available rollback versions
list_rollback_versions() {
    print_status "Available rollback versions:"
    
    # Get available Docker images
    echo -e "\n🐳 Docker Images:"
    docker images "${IMAGE_NAME}" --format "  📦 {{.Repository}}:{{.Tag}} ({{.Size}})" | grep -v "${CURRENT_VERSION}" || echo "  No previous versions found"
    
    # Get git tags
    echo -e "\n🏷️ Git Tags:"
    cd "$(dirname "$0")/.."
    git tag --sort=-version:refname | head -10 | while read -r tag; do
        if [ "$tag" != "$(git describe --tags --abbrev=0)" ]; then
            echo "  🏷️ $tag"
        fi
    done
    
    # Get rollback snapshots
    if [ -d "$ROLLBACK_DIR" ]; then
        echo -e "\n📸 Rollback Snapshots:"
        find "$ROLLBACK_DIR" -type d -name "${SERVICE_NAME}-*" | sort -r | head -5 | while read -r snapshot; do
            local snapshot_name=$(basename "$snapshot")
            local snapshot_date=$(echo "$snapshot_name" | cut -d'-' -f2-3 | sed 's/-/ /')
            echo "  📸 $snapshot_name ($snapshot_date)"
        done
    fi
}

# Function to rollback to previous Docker image
rollback_docker_image() {
    local target_version="$1"
    
    print_status "Rolling back to Docker image: $target_version"
    
    # Check if image exists
    if ! docker images "${IMAGE_NAME}:${target_version}" --format "{{.Repository}}:{{.Tag}}" | grep -q "${target_version}"; then
        print_error "Docker image ${IMAGE_NAME}:${target_version} not found"
        return 1
    fi
    
    # Pull from registry if needed
    if ! docker images "${REGISTRY}/${IMAGE_NAME}:${target_version}" --format "{{.Repository}}:{{.Tag}}" | grep -q "${target_version}"; then
        print_status "Pulling image from registry..."
        docker pull "${REGISTRY}/${IMAGE_NAME}:${target_version}"
        docker tag "${REGISTRY}/${IMAGE_NAME}:${target_version}" "${IMAGE_NAME}:${target_version}"
    fi
    
    # Update Docker Compose
    cd "$(dirname "$0")/../.."
    sed -i.bak "s|image: ${IMAGE_NAME}:.*|image: ${REGISTRY}/${IMAGE_NAME}:${target_version}|g" docker-compose.frontend.yml
    
    # Restart service
    print_status "Restarting service with rollback image..."
    docker-compose -f docker-compose.frontend.yml down
    docker-compose -f docker-compose.frontend.yml up -d
    
    # Wait for service to be healthy
    print_status "Waiting for service to be healthy..."
    for i in {1..30}; do
        if curl -f -s http://localhost:3030/health > /dev/null; then
            print_success "Service is healthy after rollback"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Service failed to become healthy after rollback"
            return 1
        fi
        sleep 2
    done
    
    print_success "Rollback to ${target_version} completed successfully"
}

# Function to rollback to git commit
rollback_git_commit() {
    local target_commit="$1"
    
    print_status "Rolling back to git commit: $target_commit"
    
    cd "$(dirname "$0")/.."
    
    # Check if commit exists
    if ! git cat-file -t "$target_commit" > /dev/null 2>&1; then
        print_error "Git commit $target_commit not found"
        return 1
    fi
    
    # Stash current changes
    if [ -n "$(git status --porcelain)" ]; then
        print_status "Stashing current changes..."
        git stash push -m "Auto-stash before rollback to $target_commit"
    fi
    
    # Checkout target commit
    git checkout "$target_commit"
    
    # Build and deploy
    print_status "Building rollback version..."
    npm ci
    npm run build
    
    # Build Docker image
    local rollback_image="${IMAGE_NAME}:${target_commit}-rollback"
    docker build -t "$rollback_image" .
    
    # Deploy
    cd "$(dirname "$0")/../.."
    sed -i.bak "s|image: ${IMAGE_NAME}:.*|image: $rollback_image|g" docker-compose.frontend.yml
    docker-compose -f docker-compose.frontend.yml down
    docker-compose -f docker-compose.frontend.yml up -d
    
    # Wait for service to be healthy
    print_status "Waiting for service to be healthy..."
    for i in {1..30}; do
        if curl -f -s http://localhost:3030/health > /dev/null; then
            print_success "Service is healthy after git rollback"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Service failed to become healthy after git rollback"
            return 1
        fi
        sleep 2
    done
    
    print_success "Git rollback to $target_commit completed successfully"
}

# Function to emergency rollback (quick recovery)
emergency_rollback() {
    print_status "Performing emergency rollback..."
    
    # Try last known good Docker image
    local last_good_image=$(docker images "${IMAGE_NAME}" --format "{{.Repository}}:{{.Tag}}" | grep -v "${CURRENT_VERSION}" | head -1)
    
    if [ -n "$last_good_image" ]; then
        print_status "Using last known good image: $last_good_image"
        
        # Quick restart
        cd "$(dirname "$0")/../.."
        sed -i.bak "s|image: ${IMAGE_NAME}:.*|image: $last_good_image|g" docker-compose.frontend.yml
        docker-compose -f docker-compose.frontend.yml down
        docker-compose -f docker-compose.frontend.yml up -d
        
        # Quick health check
        sleep 10
        if curl -f -s http://localhost:3030/health > /dev/null; then
            print_success "Emergency rollback successful"
            return 0
        fi
    fi
    
    # Fallback to basic static serving
    print_warning "Emergency fallback: Basic static serving"
    
    # Stop current container
    docker-compose -f docker-compose.frontend.yml down
    
    # Start simple nginx with static files
    if [ -d "$(dirname "$0")/../dist" ]; then
        docker run -d \
            --name predator-frontend-emergency \
            -p 3030:80 \
            -v "$(dirname "$0")/../dist:/usr/share/nginx/html:ro" \
            nginx:alpine
        
        print_success "Emergency fallback deployed"
    else
        print_error "No build artifacts available for emergency fallback"
        return 1
    fi
}

# Function to verify rollback
verify_rollback() {
    print_status "Verifying rollback..."
    
    # Health check
    if ! curl -f -s http://localhost:3030/health > /dev/null; then
        print_error "Health check failed after rollback"
        return 1
    fi
    
    # Application check
    if ! curl -f -s http://localhost:3030/ > /dev/null; then
        print_error "Application not responding after rollback"
        return 1
    fi
    
    # Container status
    if ! docker ps --filter "name=predator-frontend" --format "{{.Status}}" | grep -q "Up"; then
        print_error "Container not running after rollback"
        return 1
    fi
    
    print_success "Rollback verification passed"
}

# Function to create rollback report
create_rollback_report() {
    local rollback_type="$1"
    local target_version="$2"
    
    print_status "Creating rollback report..."
    
    local report_file="${ROLLBACK_PATH}/rollback-report-${TIMESTAMP}.md"
    
    cat > "$report_file" << EOF
# 🔄 PREDATOR Analytics UI - Rollback Report

**Rollback ID**: ${SERVICE_NAME}-${TIMESTAMP}
**Date**: $(date)
**Current Version**: ${CURRENT_VERSION}
**Target Version**: ${target_version}
**Rollback Type**: ${rollback_type}
**Status**: ✅ SUCCESS

## 📋 Rollback Summary

- ✅ Current state captured
- ✅ Rollback to ${target_version} completed
- ✅ Health checks passed
- ✅ Application verified

## 🔄 Rollback Details

### Before Rollback
- Image: ${CURRENT_VERSION}
- Health: $(cat "${ROLLBACK_PATH}/current-health-status.txt" 2>/dev/null || echo "Unknown")
- Git Commit: $(cat "${ROLLBACK_PATH}/current-git-commit.txt" 2>/dev/null || echo "Unknown")

### After Rollback
- Image: ${target_version}
- Health: HEALTHY
- Status: Running

## 🚨 Post-Rollback Actions

1. Monitor application performance
2. Check error rates in logs
3. Verify all features working
4. Update monitoring dashboards
5. Notify stakeholders

## 📝 Notes

- Rollback performed automatically
- All health checks passed
- Application is stable
- Consider investigating root cause

---

**Generated by**: rollback-strategy.sh  
**Environment**: Production  
**Compliance**: AGENTS.md v55
EOF

    print_success "Rollback report created: $report_file"
}

# Function to show rollback menu
show_rollback_menu() {
    echo -e "\n🔄 PREDATOR Analytics UI - Rollback Menu"
    echo "=========================================="
    echo "1. List available rollback versions"
    echo "2. Rollback to Docker image"
    echo "3. Rollback to git commit"
    echo "4. Emergency rollback"
    echo "5. Exit"
    echo -e "\nPlease select an option (1-5):"
    
    read -r choice
    
    case "$choice" in
        1)
            list_rollback_versions
            ;;
        2)
            echo "Enter target version (e.g., v55.0.1):"
            read -r version
            rollback_docker_image "$version"
            ;;
        3)
            echo "Enter target commit hash:"
            read -r commit
            rollback_git_commit "$commit"
            ;;
        4)
            emergency_rollback
            ;;
        5)
            exit 0
            ;;
        *)
            print_error "Invalid option"
            show_rollback_menu
            ;;
    esac
}

# Main execution
main() {
    local action="${1:-menu}"
    
    case "$action" in
        "prepare")
            print_status "Preparing rollback environment..."
            create_rollback_dir
            capture_current_state
            print_success "Rollback environment prepared"
            ;;
        "list")
            list_rollback_versions
            ;;
        "docker")
            if [ -z "${2:-}" ]; then
                print_error "Please specify target version"
                echo "Usage: $0 docker <version>"
                list_rollback_versions
                exit 1
            fi
            create_rollback_dir
            capture_current_state
            rollback_docker_image "$2"
            verify_rollback
            create_rollback_report "docker" "$2"
            ;;
        "git")
            if [ -z "${2:-}" ]; then
                print_error "Please specify target commit"
                echo "Usage: $0 git <commit>"
                exit 1
            fi
            create_rollback_dir
            capture_current_state
            rollback_git_commit "$2"
            verify_rollback
            create_rollback_report "git" "$2"
            ;;
        "emergency")
            create_rollback_dir
            capture_current_state
            emergency_rollback
            verify_rollback
            create_rollback_report "emergency" "emergency"
            ;;
        "menu")
            show_rollback_menu
            ;;
        *)
            echo "Usage: $0 {prepare|list|docker|git|emergency|menu}"
            echo "  prepare   - Prepare rollback environment"
            echo "  list      - List available rollback versions"
            echo "  docker    - Rollback to Docker image (requires version)"
            echo "  git       - Rollback to git commit (requires commit)"
            echo "  emergency - Emergency rollback to last known good"
            echo "  menu      - Interactive rollback menu"
            exit 1
            ;;
    esac
}

# Check if running as root for rollback directory creation
if [ "$1" = "prepare" ] && [ ! -d "$ROLLBACK_DIR" ]; then
    print_warning "Rollback directory creation requires sudo privileges"
    print_status "You may be prompted for password..."
fi

# Run main function
main "$@"
