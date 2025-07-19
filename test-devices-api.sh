#!/bin/bash

echo "🚀 Testing IoTFlow Devices API"
echo "==============================="

# Step 1: Login
echo "📝 Step 1: Login to get JWT token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

echo "Login response: $LOGIN_RESPONSE"

# Extract token using jq (if available) or grep
if command -v jq &> /dev/null; then
    TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
else
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token. Login response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Got token: ${TOKEN:0:50}..."
echo ""

# Step 2: Get existing devices
echo "📱 Step 2: Get existing devices..."
curl -s -X GET http://localhost:3001/api/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" | jq '.' 2>/dev/null || curl -s -X GET http://localhost:3001/api/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n"

# Step 3: Create a test device
echo "🔧 Step 3: Create a test device..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Sensor CLI",
    "device_type": "Temperature",
    "location": "Kitchen",
    "description": "CLI test temperature sensor",
    "firmware_version": "1.0.0",
    "hardware_version": "1.0"
  }')

echo "Create device response:"
echo $CREATE_RESPONSE | jq '.' 2>/dev/null || echo $CREATE_RESPONSE
echo ""

# Step 4: Get devices again
echo "📱 Step 4: Get devices after creation..."
curl -s -X GET http://localhost:3001/api/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" | jq '.' 2>/dev/null || curl -s -X GET http://localhost:3001/api/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n✨ Test completed!"
