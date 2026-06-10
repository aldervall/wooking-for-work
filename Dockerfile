FROM node:22-alpine

# Install build tools for native modules like better-sqlite3
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files (root + frontend)
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install ALL dependencies (including dev for Vite build)
RUN npm install

# Copy application code
COPY . .

# Build Vite frontend and copy to public/
RUN npm install --prefix frontend && \
    npm install @rollup/rollup-linux-x64-musl --prefix frontend && \
    npm run frontend:build && \
    cp -r frontend/dist/* public/ && \
    rm -rf frontend/dist

# Prune dev dependencies for smaller production image
RUN npm prune --omit=dev

# Create data directory for persistent storage
RUN mkdir -p /app/data

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:3002/health || exit 1

# Start the application
CMD ["node", "src/server.js"]
