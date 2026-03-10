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
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
