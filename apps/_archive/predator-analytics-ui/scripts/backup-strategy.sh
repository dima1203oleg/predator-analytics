#!/bin/bash

# 🔄 PREDATOR Analytics UI - Backup Strategy Script
# Version: v55.1.0
# Purpose: Comprehensive backup and restore procedures

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
BACKUP_DIR="/opt/backups/${PROJECT_NAME}"
RETENTION_DAYS=30
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

# Function to create backup directory
create_backup_dir() {
    print_status "Creating backup directory..."
    
    if [ ! -d "$BACKUP_DIR" ]; then
        sudo mkdir -p "$BACKUP_DIR"
        sudo chown $(whoami):$(whoami) "$BACKUP_DIR"
    fi
    
    BACKUP_PATH="${BACKUP_DIR}/${SERVICE_NAME}-${TIMESTAMP}"
    mkdir -p "$BACKUP_PATH"
    
    print_success "Backup directory created: $BACKUP_PATH"
}

# Function to backup source code
backup_source_code() {
    print_status "Backing up source code..."
    
    cd "$(dirname "$0")/.."
    
    # Create source code backup
    tar -czf "${BACKUP_PATH}/source-code.tar.gz" \
        --exclude=node_modules \
        --exclude=dist \
        --exclude=.git \
        --exclude=coverage \
        --exclude=.nyc_output \
        --exclude=*.log \
        --exclude=.DS_Store \
        .
    
    print_success "Source code backed up"
}

# Function to backup Docker images
backup_docker_images() {
    print_status "Backing up Docker images..."
    
    # Save production image
    docker save predator-analytics-ui:v55.1.0-production | gzip > "${BACKUP_PATH}/docker-image.tar.gz"
    
    # Save image metadata
    docker images predator-analytics-ui --format "{{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" > "${BACKUP_PATH}/docker-images.txt"
    
    print_success "Docker images backed up"
}

# Function to backup configuration files
backup_configuration() {
    print_status "Backing up configuration files..."
    
    cd "$(dirname "$0")/.."
    
    # Backup configuration files
    mkdir -p "${BACKUP_PATH}/config"
    
    # Copy config files
    cp -r nginx.conf "${BACKUP_PATH}/config/"
    cp -r vite.config.ts "${BACKUP_PATH}/config/"
    cp -r package.json "${BACKUP_PATH}/config/"
    cp -r tsconfig.json "${BACKUP_PATH}/config/"
    cp -r tailwind.config.js "${BACKUP_PATH}/config/"
    
    # Copy Docker files
    cp -r Dockerfile "${BACKUP_PATH}/config/"
    cp -r docker-compose.frontend.yml "${BACKUP_PATH}/config/"
    
    print_success "Configuration files backed up"
}

# Function to backup build artifacts
backup_build_artifacts() {
    print_status "Backing up build artifacts..."
    
    cd "$(dirname "$0")/.."
    
    # Backup dist directory if exists
    if [ -d "dist" ]; then
        tar -czf "${BACKUP_PATH}/build-artifacts.tar.gz" dist/
    fi
    
    # Backup build metadata
    echo "Build timestamp: $(date)" > "${BACKUP_PATH}/build-info.txt"
    echo "Bundle size: $(du -sh dist/ 2>/dev/null | cut -f1 || echo 'N/A')" >> "${BACKUP_PATH}/build-info.txt"
    echo "Node version: $(node --version)" >> "${BACKUP_PATH}/build-info.txt"
    echo "NPM version: $(npm --version)" >> "${BACKUP_PATH}/build-info.txt"
    
    print_success "Build artifacts backed up"
}

# Function to backup documentation
backup_documentation() {
    print_status "Backing up documentation..."
    
    cd "$(dirname "$0")/.."
    
    # Backup documentation files
    mkdir -p "${BACKUP_PATH}/docs"
    
    # Copy documentation
    cp -r README.md "${BACKUP_PATH}/docs/" 2>/dev/null || true
    cp -r CHANGELOG.md "${BACKUP_PATH}/docs/" 2>/dev/null || true
    cp -r DEPLOYMENT.md "${BACKUP_PATH}/docs/" 2>/dev/null || true
    cp -r PRODUCTION_READY_REPORT.md "${BACKUP_PATH}/docs/" 2>/dev/null || true
    
    print_success "Documentation backed up"
}

# Function to create backup manifest
create_backup_manifest() {
    print_status "Creating backup manifest..."
    
    cat > "${BACKUP_PATH}/MANIFEST.txt" << EOF
# PREDATOR Analytics UI - Backup Manifest

**Backup ID**: ${SERVICE_NAME}-${TIMESTAMP}
**Date**: $(date)
**Version**: v55.1.0-production
**Environment**: Production

## 📦 Backup Contents

### Source Code
- source-code.tar.gz: Complete source code (excluding node_modules, dist)

### Docker Images
- docker-image.tar.gz: Docker image backup
- docker-images.txt: Image metadata

### Configuration
- config/nginx.conf: Nginx configuration
- config/vite.config.ts: Vite build configuration
- config/package.json: Dependencies
- config/Dockerfile: Docker build configuration
- config/docker-compose.frontend.yml: Docker Compose configuration

### Build Artifacts
- build-artifacts.tar.gz: Production build (if exists)
- build-info.txt: Build metadata

### Documentation
- docs/: Complete documentation set

## 🔄 Restore Instructions

1. Extract source code:
   \`\`\`bash
   tar -xzf source-code.tar.gz
   \`\`\`

2. Restore Docker image:
   \`\`\`bash
   docker load < docker-image.tar.gz
   \`\`\`

3. Deploy with Docker Compose:
   \`\`\`bash
   docker-compose -f config/docker-compose.frontend.yml up -d
   \`\`\`

## 🔍 Verification

After restore, verify:
- Health endpoint: curl http://localhost:3030/health
- Application loads in browser
- All static assets serve correctly

---

**Generated by**: backup-strategy.sh  
**Retention**: ${RETENTION_DAYS} days
EOF

    print_success "Backup manifest created"
}

# Function to cleanup old backups
cleanup_old_backups() {
    print_status "Cleaning up old backups..."
    
    # Find and remove backups older than retention period
    find "$BACKUP_DIR" -type d -name "${SERVICE_NAME}-*" -mtime +${RETENTION_DAYS} -exec rm -rf {} \; 2>/dev/null || true
    
    print_success "Old backups cleaned up"
}

# Function to verify backup integrity
verify_backup() {
    print_status "Verifying backup integrity..."
    
    # Check if all required files exist
    local required_files=(
        "source-code.tar.gz"
        "docker-image.tar.gz"
        "config/nginx.conf"
        "MANIFEST.txt"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "${BACKUP_PATH}/$file" ]; then
            print_error "Required backup file missing: $file"
            exit 1
        fi
    done
    
    # Verify tar files
    if ! tar -tzf "${BACKUP_PATH}/source-code.tar.gz" > /dev/null; then
        print_error "Source code backup is corrupted"
        exit 1
    fi
    
    if ! gzip -t "${BACKUP_PATH}/docker-image.tar.gz" > /dev/null; then
        print_error "Docker image backup is corrupted"
        exit 1
    fi
    
    print_success "Backup integrity verified"
}

# Function to restore from backup
restore_backup() {
    local backup_id="$1"
    
    print_status "Restoring from backup: $backup_id"
    
    local restore_path="${BACKUP_DIR}/${backup_id}"
    
    if [ ! -d "$restore_path" ]; then
        print_error "Backup not found: $backup_id"
        exit 1
    fi
    
    # Extract source code
    print_status "Restoring source code..."
    cd "$(dirname "$0")/.."
    tar -xzf "${restore_path}/source-code.tar.gz"
    
    # Restore Docker image
    print_status "Restoring Docker image..."
    docker load < "${restore_path}/docker-image.tar.gz"
    
    # Deploy
    print_status "Deploying restored version..."
    cd "$(dirname "$0")/../.."
    docker-compose -f docker-compose.frontend.yml up -d
    
    print_success "Restore completed successfully"
}

# Function to list available backups
list_backups() {
    print_status "Available backups:"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        print_warning "No backup directory found"
        return
    fi
    
    # List backups with details
    for backup_dir in "${BACKUP_DIR}/${SERVICE_NAME}-"*; do
        if [ -d "$backup_dir" ]; then
            local backup_name=$(basename "$backup_dir")
            local backup_date=$(echo "$backup_name" | cut -d'-' -f2-3 | sed 's/-/ /')
            local backup_size=$(du -sh "$backup_dir" 2>/dev/null | cut -f1)
            
            echo "  📦 $backup_name ($backup_date) - Size: $backup_size"
        fi
    done
}

# Function to show backup statistics
show_backup_stats() {
    print_status "Backup statistics:"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        print_warning "No backup directory found"
        return
    fi
    
    local total_backups=$(find "$BACKUP_DIR" -type d -name "${SERVICE_NAME}-*" | wc -l)
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    
    echo "  📊 Total backups: $total_backups"
    echo "  💾 Total size: $total_size"
    echo "  🗓️ Retention period: ${RETENTION_DAYS} days"
    echo "  📂 Backup directory: $BACKUP_DIR"
}

# Main execution
main() {
    local action="${1:-backup}"
    
    case "$action" in
        "backup")
            print_status "Starting backup process..."
            create_backup_dir
            backup_source_code
            backup_docker_images
            backup_configuration
            backup_build_artifacts
            backup_documentation
            create_backup_manifest
            verify_backup
            cleanup_old_backups
            print_success "🎉 Backup completed: $BACKUP_PATH"
            ;;
        "restore")
            if [ -z "${2:-}" ]; then
                print_error "Please specify backup ID to restore"
                echo "Usage: $0 restore <backup-id>"
                list_backups
                exit 1
            fi
            restore_backup "$2"
            ;;
        "list")
            list_backups
            ;;
        "stats")
            show_backup_stats
            ;;
        *)
            echo "Usage: $0 {backup|restore|list|stats}"
            echo "  backup  - Create new backup"
            echo "  restore - Restore from backup (requires backup-id)"
            echo "  list    - List available backups"
            echo "  stats   - Show backup statistics"
            exit 1
            ;;
    esac
}

# Check if running as root for backup directory creation
if [ "$1" = "backup" ] && [ ! -d "$BACKUP_DIR" ]; then
    print_warning "Backup directory creation requires sudo privileges"
    print_status "You may be prompted for password..."
fi

# Run main function
main "$@"
