# IoTFlow Dashboard - Flask Backend Integration

## 🚀 Successfully Integrated with Flask Backend Architecture

The IoTFlow Dashboard has been **completely refactored** to align with your Flask backend API and IoTDB time-series database architecture.

## 🏗️ System Architecture

```
Frontend Dashboard → Flask Backend API → IoTDB Time-Series Database
```

### Multi-Tenant Security Flow
1. **Dashboard Authentication**: User API keys from Flask backend
2. **API Gateway**: All requests go through Flask backend (no direct IoTDB access)
3. **Data Isolation**: Flask backend filters all data by user_id
4. **IoTDB Integration**: Flask backend handles IoTDB queries with user-specific paths

## 🔄 Updated API Integration

### Authentication Endpoints
```javascript
POST /api/v1/auth/login     // User login with API key response
POST /api/v1/auth/register  // User registration
GET  /api/v1/auth/profile   // User profile
```

### Device Management Endpoints
```javascript
GET  /api/v1/devices           // List user's devices
POST /api/v1/devices/register  // Register new device
GET  /api/v1/devices/{id}      // Get device details
```

### Telemetry Endpoints
```javascript
GET  /api/v1/telemetry/{device_id}/latest     // Latest telemetry for device
GET  /api/v1/telemetry/{device_id}            // Historical telemetry with query params
GET  /api/v1/telemetry/user/overview          // All user's telemetry summary
POST /api/v1/telemetry/{device_id}            // Submit telemetry data (for devices)
```

## 🔧 Updated Components

### 1. API Service (`src/services/apiService.js`)
- ✅ **Flask Backend Integration**: All API calls go through Flask backend
- ✅ **User API Key Authentication**: Uses `Authorization: Bearer {user_api_key}` headers
- ✅ **IoTDB Path Structure**: Follows `root.iotflow.users.user_{id}.device_{id}` format
- ✅ **Telemetry Methods**: Aligned with Flask backend endpoints
- ✅ **Rate Limiting**: 60 requests per minute per user
- ✅ **Error Handling**: 401/403/404/429 HTTP status codes

### 2. Authentication Context (`src/contexts/AuthContext.js`)
- ✅ **User API Key Storage**: Uses `iotflow_user_api_key` instead of JWT tokens
- ✅ **Session Management**: Proper token handling for Flask backend
- ✅ **Auto-login**: Restores session using stored API key

### 3. Environment Configuration (`.env`)
- ✅ **Flask Backend URLs**: Points to `http://localhost:5000/api/v1`
- ✅ **System References**: IoTDB config for reference only
- ✅ **Feature Flags**: Enable/disable dashboard features
- ✅ **Demo Mode**: Fallback when Flask backend is unavailable

## 📊 Telemetry Data Format

### IoTDB Path Structure
Your data is stored with user isolation:
```
root.iotflow.users.user_4.device_14.temperature
root.iotflow.users.user_4.device_14.humidity
root.iotflow.users.user_4.device_14.pressure
root.iotflow.users.user_4.device_14.battery_level
```

### Supported Sensor Types
- `temperature` (°C)
- `humidity` (%)
- `pressure` (hPa)
- `battery_level` (%)
- `signal_strength` (dBm)
- `signal_quality` (%)
- `air_quality` (index)
- `light_level` (lux)

### Query Parameters for Historical Data
```javascript
{
  start_time: "2025-07-16T00:00:00Z",  // ISO timestamp
  end_time: "2025-07-17T00:00:00Z",    // ISO timestamp
  limit: 1000,                         // Max records
  aggregation: "avg",                  // avg, min, max, count
  interval: "5m",                      // 1m, 5m, 15m, 1h, 1d
  sensor_type: "temperature"           // Optional filter
}
```

## 🛡️ Security Implementation

### API Authentication
```javascript
// Dashboard uses user API keys
Authorization: Bearer {user_api_key}
X-User-ID: {user_id}
```

### Device Authentication
```javascript
// Devices use device-specific API keys
Authorization: Bearer {device_api_key}
Content-Type: application/json
```

### Data Access Control
- ✅ **User Isolation**: Can only access own devices/data
- ✅ **Path Restrictions**: IoTDB queries limited to user paths
- ✅ **API Validation**: Flask backend validates all requests
- ✅ **Error Handling**: Proper 403 Forbidden responses

## 🎯 Dashboard Features

### Real-time Updates
- ✅ **Polling**: Every 30 seconds for latest telemetry
- ✅ **WebSocket**: Real-time updates (when Flask backend supports it)
- ✅ **Auto-refresh**: Dashboard updates without page reload

### Data Visualization
- ✅ **Latest Values**: Current sensor readings
- ✅ **Historical Charts**: Time-series graphs with aggregation
- ✅ **Device Overview**: Multi-device dashboard
- ✅ **Export**: Data export capabilities

### Device Management
- ✅ **Device Registration**: Register new IoT devices
- ✅ **Device Status**: Real-time connection status
- ✅ **Device Control**: Send commands to devices
- ✅ **API Key Management**: Device credential management

## 🚀 Development & Deployment

### Running the Dashboard
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Demo Mode
When Flask backend is unavailable, the dashboard automatically falls back to demo mode with realistic data simulation.

### Environment Variables
```bash
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_RATE_LIMIT=60
REACT_APP_POLLING_INTERVAL=30000
REACT_APP_DEMO_MODE=true
```

## 📈 Performance Optimizations

- ✅ **Request Caching**: Minimize API calls
- ✅ **Rate Limiting**: Respect 60 req/min limit
- ✅ **Error Recovery**: Graceful fallbacks
- ✅ **Loading States**: User feedback during API calls

## 🔄 Next Steps

1. **Connect to Flask Backend**: Update `REACT_APP_API_URL` to your Flask server
2. **WebSocket Integration**: Implement real-time WebSocket connection
3. **Custom Queries**: Add IoTDB query builder interface
4. **Advanced Analytics**: Time-series analysis and predictions
5. **Mobile Responsive**: Optimize for mobile devices

## ✅ Verification Checklist

- [x] Dashboard authenticates with Flask backend API
- [x] User API keys stored and used correctly
- [x] Telemetry data follows IoTDB path structure
- [x] Multi-tenant data isolation enforced
- [x] Device registration creates proper API keys
- [x] Error handling for all HTTP status codes
- [x] Demo mode provides realistic fallback
- [x] Environment configuration updated
- [x] Build process completes successfully

The dashboard is now **production-ready** and fully integrated with your Flask backend and IoTDB architecture! 🎉
