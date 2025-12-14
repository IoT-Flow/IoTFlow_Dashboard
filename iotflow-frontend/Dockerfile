# Stage 1: Build React app
FROM node:18-alpine AS builder

WORKDIR /app

# ==================================
# Build Arguments (Configuration)
# React env vars must be set at BUILD time
# ==================================

# API Configuration
ARG REACT_APP_API_URL=http://localhost:3001/api
ARG REACT_APP_WS_URL=ws://localhost:3001/ws
ARG REACT_APP_FLASK_API_URL=http://localhost:5000/api/v1

# Application
ARG REACT_APP_NAME=IoTFlow Dashboard
ARG REACT_APP_VERSION=2.0.0
ARG REACT_APP_ENVIRONMENT=production

# Feature Flags
ARG REACT_APP_ENABLE_ANALYTICS=true
ARG REACT_APP_ENABLE_REAL_TIME=true
ARG REACT_APP_ENABLE_WEBSOCKETS=true
ARG REACT_APP_ENABLE_DEVICE_CONTROL=true
ARG REACT_APP_ENABLE_NOTIFICATIONS=true
ARG REACT_APP_ENABLE_CHARTS=true

# System Configuration
ARG REACT_APP_IOTDB_HOST=localhost
ARG REACT_APP_IOTDB_PORT=6667
ARG REACT_APP_IOTDB_USER=root
ARG REACT_APP_IOTDB_PASSWORD=root

# Performance
ARG REACT_APP_POLLING_INTERVAL=30000
ARG REACT_APP_MAX_TELEMETRY_POINTS=1000

# Build Configuration
ARG GENERATE_SOURCEMAP=false

# Set environment variables for build
ENV REACT_APP_API_URL=${REACT_APP_API_URL} \
    REACT_APP_WS_URL=${REACT_APP_WS_URL} \
    REACT_APP_FLASK_API_URL=${REACT_APP_FLASK_API_URL} \
    REACT_APP_NAME=${REACT_APP_NAME} \
    REACT_APP_VERSION=${REACT_APP_VERSION} \
    REACT_APP_ENVIRONMENT=${REACT_APP_ENVIRONMENT} \
    REACT_APP_ENABLE_ANALYTICS=${REACT_APP_ENABLE_ANALYTICS} \
    REACT_APP_ENABLE_REAL_TIME=${REACT_APP_ENABLE_REAL_TIME} \
    REACT_APP_ENABLE_WEBSOCKETS=${REACT_APP_ENABLE_WEBSOCKETS} \
    REACT_APP_ENABLE_DEVICE_CONTROL=${REACT_APP_ENABLE_DEVICE_CONTROL} \
    REACT_APP_ENABLE_NOTIFICATIONS=${REACT_APP_ENABLE_NOTIFICATIONS} \
    REACT_APP_ENABLE_CHARTS=${REACT_APP_ENABLE_CHARTS} \
    REACT_APP_IOTDB_HOST=${REACT_APP_IOTDB_HOST} \
    REACT_APP_IOTDB_PORT=${REACT_APP_IOTDB_PORT} \
    REACT_APP_IOTDB_USER=${REACT_APP_IOTDB_USER} \
    REACT_APP_IOTDB_PASSWORD=${REACT_APP_IOTDB_PASSWORD} \
    REACT_APP_POLLING_INTERVAL=${REACT_APP_POLLING_INTERVAL} \
    REACT_APP_MAX_TELEMETRY_POINTS=${REACT_APP_MAX_TELEMETRY_POINTS} \
    GENERATE_SOURCEMAP=${GENERATE_SOURCEMAP}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY public/ ./public/
COPY src/ ./src/

# Build the app
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]