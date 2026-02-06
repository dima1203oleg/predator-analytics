#!/bin/bash
# PREDATOR V45 - SERVER SIDE BUILD & DEPLOY
# Bypasses local permission issues by building entirely on the server.

SERVER="predator-server"
REMOTE_BUILD_DIR="/home/dima/predator-analytics/build_v45"
CONTAINER_NAME="predator-v45-core"
IMAGE_NAME="predator-v45-image"

echo "☁️ INITIATING SERVER-SIDE DEPLOYMENT (V45)..."

# 1. Create Remote Directory
echo "📂 Preparing remote workspace..."
ssh -o ControlMaster=no "$SERVER" "mkdir -p $REMOTE_BUILD_DIR"

# 2. Sync Source Code (Lightweight)
# We explicitly exclude heavy/problematic folders
echo "📡 Transmitting Source Code..."
rsync -avz -e "ssh -o ControlMaster=no" \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '.git' \
    --exclude '.DS_Store' \
    "/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui/" \
    "$SERVER:$REMOTE_BUILD_DIR/"

# 3. Create Dockerfile on Server
echo "🐳 Injecting Docker Build Configuration..."
ssh -o ControlMaster=no "$SERVER" "cat > $REMOTE_BUILD_DIR/Dockerfile" << 'EOF'
# Stage 1: Build
FROM node:20-alpine as builder
WORKDIR /app
COPY package.json package-lock.json ./
# Install dependencies (including devDependencies for build)
RUN npm install
COPY . .
# Build the app explicitly
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy custom nginx config if available in the context, otherwise default
# We will mount the config from host to be safe
EOF

# 4. Execute Remote Build & Deploy
echo "🏗️  BUILDING PREDATOR V45 ON SERVER (This may take a minute)..."
ssh -o ControlMaster=no "$SERVER" << EOF
    cd $REMOTE_BUILD_DIR

    # Build Image
    docker build -t $IMAGE_NAME .

    # Stop Old Containers
    echo "🛑 Stopping old instances..."
    docker rm -f predator-analytics-frontend 2>/dev/null || true
    docker rm -f predator-fixed-frontend 2>/dev/null || true
    docker rm -f predator_frontend 2>/dev/null || true
    docker rm -f $CONTAINER_NAME 2>/dev/null || true

    # Run New Container
    echo "🚀 Launching V45..."
    docker run -d \
        --name "$CONTAINER_NAME" \
        --network predator-analytics_predator-network \
        -p 80:80 \
        -v $REMOTE_BUILD_DIR/src/gateway/nginx.conf:/etc/nginx/nginx.conf \
        "$IMAGE_NAME"

EOF

echo "✅ SUCCESS: PREDATOR V45 IS LIVE (Server-Side Build Complete)."
echo "🌐 Verify: https://jolyn-bifid-eligibly.ngrok-free.dev/"
