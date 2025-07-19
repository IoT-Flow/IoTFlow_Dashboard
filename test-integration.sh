#!/bin/bash

# Test Frontend-Backend Integration

echo "🚀 Testing IoTFlow Frontend-Backend Integration"
echo "=============================================="

# Test backend health
echo "✅ Testing Backend Health Check..."
BACKEND_HEALTH=$(curl -s http://localhost:3001/health)
echo "Backend Status: $BACKEND_HEALTH"

# Test frontend accessibility
echo "✅ Testing Frontend Accessibility..."
FRONTEND_TITLE=$(curl -s http://localhost:3000 | grep -o '<title>.*</title>')
echo "Frontend Title: $FRONTEND_TITLE"

# Test backend API endpoints
echo "✅ Testing Backend API Endpoints..."

# Test registration endpoint
echo "Testing Registration API..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}')
echo "Register Response: $REGISTER_RESPONSE"

# Test login endpoint
echo "Testing Login API..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')
echo "Login Response: $LOGIN_RESPONSE"

# Extract token from login response
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
API_KEY=$(echo $LOGIN_RESPONSE | grep -o '"api_key":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ] && [ ! -z "$API_KEY" ]; then
    echo "✅ Authentication successful!"
    echo "Token: ${TOKEN:0:20}..."
    echo "API Key: ${API_KEY:0:20}..."
    
    # Test devices endpoint
    echo "Testing Devices API..."
    DEVICES_RESPONSE=$(curl -s -X GET http://localhost:3001/api/devices \
      -H "x-api-key: $API_KEY")
    echo "Devices Response: $DEVICES_RESPONSE"
    
    # Test device creation
    echo "Testing Device Creation API..."
    CREATE_DEVICE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/devices \
      -H "Content-Type: application/json" \
      -H "x-api-key: $API_KEY" \
      -d '{"name":"Test Device","description":"Test device for integration","device_type":"sensor","location":"Test Location"}')
    echo "Create Device Response: $CREATE_DEVICE_RESPONSE"
    
else
    echo "❌ Authentication failed!"
fi

echo ""
echo "🎉 Integration Test Complete!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001/api"
echo "📊 Backend Health: http://localhost:3001/health"
