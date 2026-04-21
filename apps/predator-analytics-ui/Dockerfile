# PREDATOR Analytics UI — Multi-stage Dockerfile v58.2-WRAITH
# HR-05: Multi-stage build, non-root user

# ============================================================
# Stage 1: Builder — npm build
# ============================================================
FROM node:20-slim AS builder

WORKDIR /build

COPY apps/predator-analytics-ui/package*.json ./
RUN npm ci --no-audit --no-fund

COPY apps/predator-analytics-ui/ ./
RUN npm run build

# ============================================================
# Stage 2: Runtime — nginx serve
# ============================================================
FROM nginx:1.25-alpine AS runtime

# Кастомна конфігурація nginx
RUN rm /etc/nginx/conf.d/default.conf

COPY deploy/nginx/predator-ui.conf /etc/nginx/conf.d/default.conf

# Копіюємо зібраний UI
COPY --from=builder /build/dist /usr/share/nginx/html

# Security headers вже в nginx конфігурації
RUN adduser -D -s /bin/sh predator && \
    chown -R predator:predator /usr/share/nginx/html && \
    chown -R predator:predator /var/cache/nginx && \
    chown -R predator:predator /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown predator:predator /var/run/nginx.pid

USER predator

EXPOSE 3030

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -q --spider http://localhost:3030/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
