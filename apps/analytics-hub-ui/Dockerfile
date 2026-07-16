# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* bun.lockb* ./
# Use bun or npm depending on lockfile (assuming bun is used here based on previous output, but fall back to npm)
RUN if [ -f bun.lockb ]; then \
        npm install -g bun && bun install; \
    else \
        npm install; \
    fi

COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Add custom Nginx configuration if necessary
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
