# Multi-stage Dockerfile for PREDATOR Analytics UI v4.0
# Optimized for production deployment with performance and security

# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /build

# Copy package files
COPY package*.json ./

# Install dependencies with optimization
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf ~/.npm

# Stage 2: Build
FROM node:18-alpine AS builder
WORKDIR /build

# Copy dependencies
COPY --from=deps /build/node_modules ./node_modules
COPY package*.json ./

# Copy source code
COPY . .

# Build application with performance optimizations
RUN npm run build && \
    rm -rf node_modules ~/.npm

# Stage 3: Runtime (nginx with non-root user)
FROM nginx:alpine AS runner

ENV API_UPSTREAM=http://host.docker.internal:9080
ENV NODE_ENV=production

# Install required packages for health checks
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user 'predator' per HR-05
RUN addgroup -g 1001 -S predator && \
    adduser -S predator -u 1001 && \
    chown -R predator:predator /usr/share/nginx/html && \
    chown -R predator:predator /var/cache/nginx && \
    chown -R predator:predator /var/log/nginx && \
    chown -R predator:predator /etc/nginx/conf.d && \
    mkdir -p /etc/nginx/templates && \
    chown -R predator:predator /etc/nginx/templates && \
    touch /var/run/nginx.pid && \
    chown predator:predator /var/run/nginx.pid && \
    mkdir -p /var/run/nginx && \
    chown predator:predator /var/run/nginx

# Copy nginx config with optimizations
RUN rm /etc/nginx/conf.d/default.conf
COPY --chown=predator:predator nginx.conf /etc/nginx/templates/default.conf.template

# Copy built application
COPY --from=builder --chown=predator:predator /build/dist /usr/share/nginx/html

# Copy health check script
COPY --chown=predator:predator healthcheck.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/healthcheck.sh

# Switch to non-root user
USER predator

# Health check with proper timeout
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh || exit 1

# Expose port
EXPOSE 8080

# Start nginx with optimized configuration
CMD ["nginx", "-g", "daemon off;"]
