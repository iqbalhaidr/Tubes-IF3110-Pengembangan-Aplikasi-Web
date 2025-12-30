FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Install k6 for load testing
RUN apk add --no-cache curl && \
    K6_VERSION=0.50.0 && \
    curl -L https://github.com/grafana/k6/releases/download/v${K6_VERSION}/k6-v${K6_VERSION}-linux-amd64.tar.gz -o /tmp/k6.tar.gz && \
    cd /tmp && tar -xzf k6.tar.gz && \
    mv k6-v${K6_VERSION}-linux-amd64/k6 /usr/local/bin/k6 && \
    rm -rf /tmp/k6* && \
    k6 version

# Copy application code
COPY src/ ./src/

# Copy loadtest configuration and seed script
COPY loadtest/ ./loadtest/

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/node/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "src/server.js"]
