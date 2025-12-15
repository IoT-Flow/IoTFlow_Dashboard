# Stage 1: Build React app
FROM node:18-alpine AS builder

WORKDIR /app

# Build arguments for API URLs (set at build time)
ARG REACT_APP_API_URL=http://localhost:3001/api
ARG REACT_APP_WS_URL=ws://localhost:3001/ws
ARG REACT_APP_FLASK_API_URL=http://localhost:5000/api/v1
ARG REACT_APP_ADMIN_TOKEN=test
ARG REACT_APP_NAME="IoTFlow Dashboard"
ARG REACT_APP_VERSION=2.0.0
ARG REACT_APP_ENVIRONMENT=production
ARG GENERATE_SOURCEMAP=false

# Set environment variables for build
ENV REACT_APP_API_URL=${REACT_APP_API_URL} \
    REACT_APP_WS_URL=${REACT_APP_WS_URL} \
    REACT_APP_FLASK_API_URL=${REACT_APP_FLASK_API_URL} \
    REACT_APP_ADMIN_TOKEN=${REACT_APP_ADMIN_TOKEN} \
    REACT_APP_NAME=${REACT_APP_NAME} \
    REACT_APP_VERSION=${REACT_APP_VERSION} \
    REACT_APP_ENVIRONMENT=${REACT_APP_ENVIRONMENT} \
    GENERATE_SOURCEMAP=${GENERATE_SOURCEMAP}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

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
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
