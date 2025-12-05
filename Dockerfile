# ===========================================
# Predator Analytics v19.0 - Production Docker
# Multi-stage build for minimal image size
# ===========================================

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Build production
RUN npm run build

# Stage 2: Production server
FROM nginx:alpine AS production

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy built assets
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Expose port
EXPOSE 80

# Labels
LABEL maintainer="Predator Analytics Team"
LABEL version="19.0.0"
LABEL description="Predator Analytics Frontend"

CMD ["nginx", "-g", "daemon off;"]
