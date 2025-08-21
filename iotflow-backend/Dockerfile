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
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production \
	PORT=3001 \
	HOST=0.0.0.0 \
	DATABASE_URL=postgres://iotflow:iotflowpass@localhost:5432/iotflow \
	JWT_SECRET=your_super_secure_jwt_secret_key_change_this_in_production \
	JWT_EXPIRES_IN=7d \
	BCRYPT_ROUNDS=12 \
	CORS_ORIGIN=http://localhost:3000 \
	ALLOWED_ORIGINS=http://localhost:3000,https://your-production-domain.com \
	WS_PORT=3001 \
	WS_HEARTBEAT_INTERVAL=30000 \
	IOTDB_HOST=localhost \
	IOTDB_PORT=6667 \
	IOTDB_REST_PORT=18080 \
	IOTDB_USERNAME=root \
	IOTDB_PASSWORD=root \
	IOTDB_DATABASE=iotflow \
	RATE_LIMIT_WINDOW_MS=900000 \
	RATE_LIMIT_MAX_REQUESTS=100 \
	LOG_LEVEL=info \
	LOG_FILE=./logs/app.log \
	API_VERSION=v1 \
	API_PREFIX=/api \
	SESSION_SECRET=your_session_secret_key_change_this_in_production \
	SESSION_TIMEOUT=3600000 \
	MAX_FILE_SIZE=10485760 \
	UPLOAD_DIR=./uploads \
	NOTIFICATION_CLEANUP_INTERVAL=86400000 \
	MAX_NOTIFICATIONS_PER_USER=1000 \
	DEBUG_MODE=false \
	ENABLE_REQUEST_LOGGING=true

# Generate .env from .env.example and start the application
ENTRYPOINT ["/bin/sh", "-c", "for key in $(grep -E '^[A-Za-z_][A-Za-z_0-9_]*=' /app/.env.example | cut -d= -f1); do val=$(printenv $key || echo); printf '%s=%s\\n' \"$key\" \"$val\" >> /app/.env; done && exec npm start"]
