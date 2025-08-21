# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies for production
RUN npm install

# Copy application source
COPY . .

# Expose application port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    REACT_APP_API_URL=http://localhost:3001/api \
    REACT_APP_WS_URL=ws://localhost:3001/ws \
    REACT_APP_NAME="IoTFlow Dashboard" \
    REACT_APP_VERSION=2.0.0 \
    REACT_APP_TITLE="IoTFlow - Enterprise IoT Management Platform" \
    REACT_APP_ENVIRONMENT=production \
    REACT_APP_ADMIN_TOKEN_LENGTH=32 \
    REACT_APP_SESSION_TIMEOUT=3600000 \
    REACT_APP_RATE_LIMIT=60 \
    REACT_APP_ENABLE_ANALYTICS=true \
    REACT_APP_ENABLE_REAL_TIME=true \
    REACT_APP_ENABLE_WEBSOCKETS=true \
    REACT_APP_ENABLE_DEVICE_CONTROL=true \
    REACT_APP_ENABLE_DEVICE_MANAGEMENT=true \
    REACT_APP_ENABLE_MQTT_MONITORING=true \
    REACT_APP_ENABLE_NOTIFICATIONS=true \
    REACT_APP_ENABLE_CHARTS=true \
    REACT_APP_ENABLE_EXPORTS=true \
    REACT_APP_IOTDB_HOST=localhost \
    REACT_APP_IOTDB_PORT=6667 \
    REACT_APP_IOTDB_USER=root \
    REACT_APP_IOTDB_PASSWORD=root \
    REACT_APP_POLLING_INTERVAL=30000 \
    REACT_APP_MAX_TELEMETRY_POINTS=1000 \
    REACT_APP_CHART_ANIMATION_DURATION=750 \
    REACT_APP_DEBOUNCE_DELAY=300 \
    GENERATE_SOURCEMAP=false \
    INLINE_RUNTIME_CHUNK=false \
    IMAGE_INLINE_SIZE_LIMIT=10000

# Generate .env from .env.example and start the application
ENTRYPOINT ["/bin/sh", "-c", "for key in $(grep -E '^[A-Za-z_][A-Za-z_0-9_]*=' /app/.env.example | cut -d= -f1); do val=$(printenv $key || echo); printf '%s=%s\\n' \"$key\" \"$val\" >> /app/.env; done && exec npm start"]
