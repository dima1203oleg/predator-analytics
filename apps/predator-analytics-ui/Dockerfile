# /Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui/Dockerfile

# Step 1: Build stage
FROM node:20-slim AS build
WORKDIR /app

# Copy dependency files for caching
COPY package*.json ./
RUN npm install

# Copy all code and build the project
COPY . .
RUN npm run build

# Step 2: Serve stage
FROM nginx:alpine
# Configure Nginx for SPA routing support
RUN rm /etc/nginx/conf.d/default.conf
RUN echo 'server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
