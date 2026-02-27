#!/bin/bash
set -e

BACKUP_NAME="predator_v45s_pre_deploy_$(date +%Y%m%d_%H%M%S).tar.gz"
echo "📦 [BACKUP] Creating full backup: $BACKUP_NAME..."

# Exclude large directories like node_modules and .venv
tar --exclude='node_modules' \
    --exclude='.venv' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='*.xlsx' \
    --exclude='*.csv' \
    -czf "$BACKUP_NAME" .

echo "✅ Backup created successfully: $BACKUP_NAME"
echo "Location: $(pwd)/$BACKUP_NAME"
