#!/bin/sh

# Health check script for PREDATOR Analytics v4.0
# Checks application health and readiness

set -e

# Health check endpoint
HEALTH_URL="http://localhost:8080/health"

# Check if nginx is running
if ! pgrep nginx > /dev/null; then
    echo "Nginx is not running"
    exit 1
fi

# Check application health
if curl -f -s --max-time 3 "$HEALTH_URL" > /dev/null; then
    echo "Application is healthy"
    exit 0
else
    echo "Application health check failed"
    exit 1
fi
