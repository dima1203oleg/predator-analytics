# Multi-stage Dockerfile for PREDATOR Analytics UI v55
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /build

COPY package*.json ./
RUN npm ci --only=production && npm ci

COPY . .
RUN npm run build

# Stage 2: Runtime (nginx with non-root user)
FROM nginx:alpine

# Create non-root user 'predator' per HR-05
RUN addgroup -g 1001 -S predator && \
    adduser -S predator -u 1001 && \
    chown -R predator:predator /var/cache/nginx && \
    chown -R predator:predator /var/log/nginx && \
    chown -R predator:predator /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown predator:predator /var/run/nginx.pid

# Copy nginx config
RUN rm /etc/nginx/conf.d/default.conf
COPY --chown=predator:predator nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app from builder
COPY --from=builder --chown=predator:predator /build/dist /usr/share/nginx/html

# Switch to non-root user
USER predator

EXPOSE 3030

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3030/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
