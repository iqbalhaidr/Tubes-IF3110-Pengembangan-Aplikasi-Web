FROM node:20-alpine AS builder

WORKDIR /app

# Copy React app source
COPY package*.json ./
COPY vite.config.js ./
COPY index.html ./
COPY src ./src

# Install dependencies
RUN npm ci

# Build for production
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy Nginx configuration
COPY ../nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy React built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
