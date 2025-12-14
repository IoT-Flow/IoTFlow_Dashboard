# ==================================
# Multi-stage Build - Dashboard Backend
# Small, secure, production-ready Node.js image
# ==================================

# Stage 1: Dependencies
FROM node:18-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Stage 2: Runtime
FROM node:18-alpine

# ==================================
# Build Arguments (Configuration)
# ==================================

# Server
ARG NODE_ENV=production
ARG PORT=3001
ARG HOST=0.0.0.0

# Database
ARG DATABASE_URL=postgres://iotflow:iotflowpass@localhost:5432/iotflow

# Security
ARG JWT_SECRET=change-this-in-production
ARG JWT_EXPIRES_IN=7d
ARG BCRYPT_ROUNDS=12

# CORS
ARG CORS_ORIGIN=http://localhost:3000
ARG ALLOWED_ORIGINS=http://localhost:3000

# WebSocket
ARG WS_PORT=3001
ARG WS_HEARTBEAT_INTERVAL=30000

# IoTDB
ARG IOTDB_HOST=localhost
ARG IOTDB_PORT=6667
ARG IOTDB_USERNAME=root
ARG IOTDB_PASSWORD=root
ARG IOTDB_DATABASE=iotflow

# Redis
ARG REDIS_HOST=localhost
ARG REDIS_PORT=6379
ARG REDIS_PASSWORD=
ARG REDIS_URL=redis://localhost:6379

# Rate Limiting
ARG RATE_LIMIT_WINDOW_MS=900000
ARG RATE_LIMIT_MAX_REQUESTS=100

# Logging
ARG LOG_LEVEL=info
ARG LOG_FILE=./logs/app.log

# API
ARG API_VERSION=v1
ARG API_PREFIX=/api

# Session
ARG SESSION_SECRET=change-this-in-production
ARG SESSION_TIMEOUT=3600000

# Upload
ARG MAX_FILE_SIZE=10485760
ARG UPLOAD_DIR=./uploads

# Notifications
ARG NOTIFICATION_CLEANUP_INTERVAL=86400000
ARG MAX_NOTIFICATIONS_PER_USER=1000

# Debug
ARG DEBUG_MODE=false
ARG ENABLE_REQUEST_LOGGING=true

# ==================================
# Environment Variables
# ==================================

ENV NODE_ENV=${NODE_ENV} \
    PORT=${PORT} \
    HOST=${HOST} \
    \
    DATABASE_URL=${DATABASE_URL} \
    \
    JWT_SECRET=${JWT_SECRET} \
    JWT_EXPIRES_IN=${JWT_EXPIRES_IN} \
    BCRYPT_ROUNDS=${BCRYPT_ROUNDS} \
    \
    CORS_ORIGIN=${CORS_ORIGIN} \
    ALLOWED_ORIGINS=${ALLOWED_ORIGINS} \
    \
    WS_PORT=${WS_PORT} \
    WS_HEARTBEAT_INTERVAL=${WS_HEARTBEAT_INTERVAL} \
    \
    IOTDB_HOST=${IOTDB_HOST} \
    IOTDB_PORT=${IOTDB_PORT} \
    IOTDB_USERNAME=${IOTDB_USERNAME} \
    IOTDB_PASSWORD=${IOTDB_PASSWORD} \
    IOTDB_DATABASE=${IOTDB_DATABASE} \
    \
    REDIS_HOST=${REDIS_HOST} \
    REDIS_PORT=${REDIS_PORT} \
    REDIS_PASSWORD=${REDIS_PASSWORD} \
    REDIS_URL=${REDIS_URL} \
    \
    RATE_LIMIT_WINDOW_MS=${RATE_LIMIT_WINDOW_MS} \
    RATE_LIMIT_MAX_REQUESTS=${RATE_LIMIT_MAX_REQUESTS} \
    \
    LOG_LEVEL=${LOG_LEVEL} \
    LOG_FILE=${LOG_FILE} \
    \
    API_VERSION=${API_VERSION} \
    API_PREFIX=${API_PREFIX} \
    \
    SESSION_SECRET=${SESSION_SECRET} \
    SESSION_TIMEOUT=${SESSION_TIMEOUT} \
    \
    MAX_FILE_SIZE=${MAX_FILE_SIZE} \
    UPLOAD_DIR=${UPLOAD_DIR} \
    \
    NOTIFICATION_CLEANUP_INTERVAL=${NOTIFICATION_CLEANUP_INTERVAL} \
    MAX_NOTIFICATIONS_PER_USER=${MAX_NOTIFICATIONS_PER_USER} \
    \
    DEBUG_MODE=${DEBUG_MODE} \
    ENABLE_REQUEST_LOGGING=${ENABLE_REQUEST_LOGGING}

WORKDIR /app

# Copy dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY package*.json ./
COPY src/ ./src/
COPY scripts/ ./scripts/

# Create non-root user and directories
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p logs uploads && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run with Node directly
CMD ["node", "src/server.js"]
