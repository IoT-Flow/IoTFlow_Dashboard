#!/bin/bash

# IoTFlow Multi-Tenant Dashboard Setup Script
echo "🚀 Setting up IoTFlow Multi-Tenant Dashboard..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating environment configuration..."
    cat > .env << EOF
# IoTFlow Multi-Tenant Configuration
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_WS_URL=ws://localhost:5000/ws

# IoTDB Configuration
REACT_APP_IOTDB_HOST=localhost
REACT_APP_IOTDB_PORT=6667
REACT_APP_IOTDB_USERNAME=root
REACT_APP_IOTDB_PASSWORD=root
REACT_APP_IOTDB_DATABASE=iotflow_db

# MQTT Configuration
REACT_APP_MQTT_HOST=localhost
REACT_APP_MQTT_PORT=1883
REACT_APP_MQTT_TLS_PORT=8883
REACT_APP_MQTT_WS_PORT=9001

# Development
GENERATE_SOURCEMAP=false
EOF
    echo "✅ Environment file created (.env)"
else
    echo "ℹ️  Environment file already exists"
fi

# Check if build directory exists and build if needed
if [ ! -d "build" ]; then
    echo "🏗️  Building production version..."
    npm run build
    echo "✅ Production build completed"
fi

echo ""
echo "🎉 IoTFlow Multi-Tenant Dashboard Setup Complete!"
echo ""
echo "📋 Demo User Credentials:"
echo "   Admin: admin@iotflow.com / admin123"
echo "   User 1: john@iotflow.com / john123 (4 smart home devices)"
echo "   User 2: alice@iotflow.com / alice123 (4 garden devices)"
echo ""
echo "🚀 To start the development server:"
echo "   npm start"
echo ""
echo "🌐 To start the production server:"
echo "   npx serve -s build -l 3000"
echo ""
echo "📚 Documentation:"
echo "   - Multi-tenant guide: MULTI_TENANT_IMPLEMENTATION.md"
echo "   - User manual: USER_MANUAL.md"
echo "   - Setup guide: SETUP.md"
echo ""
echo "🔧 Backend Requirements (for full functionality):"
echo "   - Flask backend server on port 5000"
echo "   - IoTDB instance on port 6667"
echo "   - MQTT broker on port 1883"
echo "   - Redis cache on port 6379"
echo ""
echo "💡 The dashboard includes demo data and works without backend for testing."
