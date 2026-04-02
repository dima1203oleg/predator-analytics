# Multi-stage Dockerfile for PREDATOR Analytics UI v55
# Stage 1: Base (Dependencies)
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Development (For Skaffold HMR)
FROM base AS dev
COPY . .
# Ensure non-root user 'predator' for security (HR-05)
RUN addgroup -g 1001 -S predator && \
    adduser -S predator -u 1001 && \
    chown -R predator:predator /app
USER predator
EXPOSE 3030
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3030"]

# Stage 3: Build
FROM base AS builder
COPY . .
RUN npm run build

# Stage 4: Runtime (Production Nginx)
FROM nginx:alpine AS runner
ENV API_UPSTREAM=http://host.docker.internal:9080

RUN addgroup -g 1001 -S predator && \
    adduser -S predator -u 1001 && \
    chown -R predator:predator /var/cache/nginx && \
    chown -R predator:predator /var/log/nginx && \
    chown -R predator:predator /etc/nginx/conf.d && \
    mkdir -p /etc/nginx/templates && \
    chown -R predator:predator /etc/nginx/templates && \
    touch /var/run/nginx.pid && \
    chown predator:predator /var/run/nginx.pid

RUN rm /etc/nginx/conf.d/default.conf
COPY --chown=predator:predator nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=builder --chown=predator:predator /app/dist /usr/share/nginx/html

USER predator
EXPOSE 3030
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3030/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
