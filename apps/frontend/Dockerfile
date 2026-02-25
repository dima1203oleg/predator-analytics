# PREDATOR ANALYTICS v25.0 - Frontend Docker
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package config
COPY apps/frontend/package.json apps/frontend/package-lock.json* ./

# Install dependencies 
# Using --legacy-peer-deps because Predator v25 has some complex dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY apps/frontend/ .

# Build production assets
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy build assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
