FROM node:22-alpine

# Install build tools for native modules like better-sqlite3
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application code
COPY . .

# Create data directory for persistent storage
RUN mkdir -p /app/data

# Expose port
EXPOSE 3002

# Health check - fixed syntax
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3   CMD wget -q --spider http://localhost:3002/health || exit 1

# Start the application
CMD ["node", "src/server.js"]
