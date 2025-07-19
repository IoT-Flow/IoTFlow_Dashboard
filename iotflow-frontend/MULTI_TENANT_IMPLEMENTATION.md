# IoTFlow Multi-Tenant Dashboard Implementation

## Overview

This implementation transforms the IoTFlow dashboard into a complete multi-tenant IoT platform with strict user isolation, real-time telemetry visualization, and seamless integration with IoTDB time-series database.

## Architecture Overview

### Multi-Tenant Data Isolation

#### User Authentication & Context
- **User API Keys**: Each user receives a unique API key for authentication
- **Tenant Isolation**: Every user belongs to their own tenant (tenant_id = user_id)
- **Data Path Separation**: IoTDB paths follow strict user isolation: `root.iotflow.users.user_{user_id}.device_{device_id}`

#### Backend API Structure
```javascript
// All API calls include user context headers
headers: {
  'Authorization': `Bearer ${user_api_key}`,
  'X-User-ID': user.id,
  'X-Tenant-ID': user.tenant_id
}
```

### Enhanced API Service (`src/services/apiService.js`)

#### Multi-Tenant Authentication
- **Enhanced Login**: Returns user with tenant_id, api_key, and permissions
- **Token Validation**: Automatic token refresh and user validation
- **Access Control**: All API calls are filtered by user_id/tenant_id

#### Device Management with Isolation
- **User-Specific Devices**: `getDevices()` only returns devices owned by current user
- **Device Registration**: New devices are automatically assigned to current user's tenant
- **Connection Credentials**: Each device gets unique API keys and MQTT topics per user

#### IoTDB Integration Features
- **Time-Series Data**: Real-time telemetry storage with user path isolation
- **Aggregated Queries**: Statistics and analytics restricted to user's data
- **Historical Data**: Time-range queries with proper tenant filtering

### WebSocket Context (`src/contexts/WebSocketContext.js`)

#### Real-Time Multi-Tenant Updates
- **User-Filtered Streams**: WebSocket connections filter by user_id and tenant_id
- **Device Subscriptions**: Users can only subscribe to their own devices
- **Security Validation**: All incoming messages validate user ownership

#### Features
- **Live Telemetry**: Real-time sensor data updates
- **Device Status**: Connection status, battery levels, signal strength
- **Command Results**: Device control command execution feedback
- **System Alerts**: User-specific notifications and warnings

### Component Architecture

#### MultiTenantDashboard (`src/components/MultiTenantDashboard.js`)
- **User Context Display**: Shows current user, tenant, and permissions
- **Device Overview**: Real-time statistics for user's devices only
- **Activity Feed**: Live updates filtered by user ownership
- **Charts & Analytics**: Data visualization with user isolation

#### MultiTenantTelemetryWidget (`src/components/MultiTenantTelemetryWidget.js`)
- **Device-Specific Telemetry**: Real-time sensor data display
- **Historical Charts**: Time-series data visualization
- **IoTDB Path Display**: Shows the user's specific data storage path
- **Connection Status**: Live device connectivity information

## Security Implementation

### Access Control
1. **API Level**: All endpoints validate user tokens and filter by user_id
2. **Data Level**: Database queries include user/tenant restrictions
3. **WebSocket Level**: Real-time streams validate user ownership
4. **Component Level**: UI components only show user's data

### Data Isolation
- **IoTDB Paths**: `root.iotflow.users.user_{user_id}.device_{device_id}`
- **MQTT Topics**: `iotflow/users/{user_id}/devices/{device_id}/telemetry`
- **Device API Keys**: Unique per device and linked to user context

## Real-Time Features

### WebSocket Integration
```javascript
// User-specific WebSocket connection
const ws = new WebSocket(`${WS_URL}/telemetry?user_id=${user.id}&api_key=${user.api_key}`);

// Message filtering ensures user isolation
if (data.user_id === currentUser.id && data.tenant_id === currentUser.tenant_id) {
  updateTelemetryWidget(data);
}
```

### Live Data Streams
- **Telemetry Updates**: Real-time sensor readings
- **Device Status Changes**: Connection/disconnection events
- **Command Execution**: Control command results
- **System Alerts**: User-specific notifications

## Demo Credentials

### Test Users
1. **Admin User**
   - Email: `admin@iotflow.com`
   - Password: `admin123`
   - Role: Admin with system access

2. **Standard User - John**
   - Email: `john@iotflow.com`
   - Password: `john123`
   - Devices: Smart home devices (4 devices)

3. **Standard User - Alice**
   - Email: `alice@iotflow.com`
   - Password: `alice123`
   - Devices: Garden automation (4 devices)

## Device Connection Examples

### MQTT Connection
```javascript
// Device MQTT configuration (per user/device)
const deviceConfig = {
  broker: 'localhost:1883',
  topic: 'iotflow/users/2/devices/3/telemetry',
  auth: {
    username: device.api_key,
    password: device.device_token
  }
};
```

### HTTP API
```javascript
// Device telemetry submission
POST /api/v1/telemetry/{device_id}
Headers: {
  'X-API-Key': device.api_key,
  'Content-Type': 'application/json'
}
Body: {
  timestamp: "2025-07-16T10:15:30Z",
  temperature: 23.5,
  humidity: 65.2,
  battery_level: 87
}
```

## Environment Configuration

### Required Environment Variables
```bash
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_WS_URL=ws://localhost:5000/ws

# IoTDB Configuration
REACT_APP_IOTDB_HOST=localhost
REACT_APP_IOTDB_PORT=6667
REACT_APP_IOTDB_USERNAME=root
REACT_APP_IOTDB_PASSWORD=root

# MQTT Configuration
REACT_APP_MQTT_HOST=localhost
REACT_APP_MQTT_PORT=1883
REACT_APP_MQTT_WS_PORT=9001
```

## Usage Instructions

### 1. User Registration/Login
- Users can register with unique credentials
- Each user automatically gets their own tenant space
- API keys are generated for secure device communication

### 2. Device Management
- Register devices through the dashboard
- Each device gets unique connection credentials
- Devices are automatically isolated to the user's tenant

### 3. Real-Time Monitoring
- View live telemetry data from user's devices only
- Monitor device status and connectivity
- Receive real-time alerts and notifications

### 4. Data Analytics
- Access historical telemetry data
- Generate reports and charts
- Export data in various formats

## Key Features Implemented

✅ **Complete Multi-Tenant Architecture**
- User-based data isolation
- Tenant-specific device management
- Secure API authentication

✅ **Real-Time Telemetry Visualization**
- Live sensor data updates
- Interactive charts and graphs
- Device status monitoring

✅ **IoTDB Time-Series Integration**
- Structured data storage paths
- Historical data queries
- Aggregated statistics

✅ **WebSocket Real-Time Updates**
- Live telemetry streams
- Device status changes
- Command execution feedback

✅ **Security & Access Control**
- API key authentication
- User-specific data filtering
- Secure WebSocket connections

✅ **Modern UI Components**
- Responsive Material-UI design
- Real-time data widgets
- Interactive dashboards

## Development Notes

### Component Structure
- **Pages**: High-level route components
- **Components**: Reusable UI elements with multi-tenant support
- **Contexts**: Global state management for auth and WebSocket
- **Services**: API integration with user isolation

### State Management
- **AuthContext**: User authentication and session management
- **WebSocketContext**: Real-time data streams with user filtering
- **Component State**: Local state for UI-specific data

This implementation provides a complete multi-tenant IoT dashboard with proper user isolation, real-time features, and professional UI components suitable for production deployment.
