#!/bin/bash

# PREDATOR V45 FINAL DEPLOYMENT SCRIPT
# This script locks in the configuration and deploys the fully audited system.

echo "🦁 PREDATOR V45 FINAL DEPLOYMENT SEQUENCE INITIATED..."

# 1. Environment Check
if [ ! -f .env.production ]; then
    echo "⚠️ .env.production not found, creating from .env.example..."
    cp .env.example .env.production
fi

# 2. Frontend Build
echo "🏗️  Building PREDATOR UI (V45)..."
cd apps/predator-analytics-ui
npm install && npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi
cd ../..

# 3. Nginx Configuration
echo "⚙️  Updating Nginx configuration..."
cat <<EOF > nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip settings
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy to Backend API
    location /api/ {
        proxy_pass http://host.docker.internal:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # Proxy to OpenSearch Dashboards (Fix for embedding)
    location /opensearch-dashboards/ {
        rewrite ^/opensearch-dashboards/(.*) /\$1 break;
        proxy_pass http://host.docker.internal:5601;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
}
EOF

# 4. Deploy to Container
echo "🚀 Deploying to static container..."
docker rm -f predator-v45-frontend 2>/dev/null
docker run -d \
  --name predator-v45-frontend \
  -p 3045:80 \
  -v $(pwd)/apps/predator-analytics-ui/dist:/usr/share/nginx/html \
  -v $(pwd)/nginx.conf:/etc/nginx/conf.d/default.conf \
  --add-host=host.docker.internal:host-gateway \
  nginx:alpine

echo "✅ DEPLOYMENT COMPLETE. Access at http://localhost:3045"
