# IoTFlow Dashboard Backend - Functionality Documentation

## Overview

The IoTFlow Dashboard Backend is a **Node.js/Express.js** RESTful API that provides a comprehensive web-based management interface for IoT devices. It serves as the presentation and user interaction layer on top of the IoT infrastructure.

**Technology Stack:**
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** SQLite (development) / PostgreSQL (production) via Sequelize ORM
- **Time-Series:** Apache IoTDB integration
- **Real-time:** WebSocket (ws library)
- **Authentication:** JWT (JSON Web Tokens) + bcrypt
- **Version:** 2.0.0

---

## Architecture

```
┌─────────────────────────────────────────┐
│        React Frontend (Port 3000)      │
└──────────────┬──────────────────────────┘
               │ HTTP/WebSocket
┌──────────────▼──────────────────────────┐
│     Express.js Backend (Port 3001)      │
├─────────────────────────────────────────┤
│  • User Authentication (JWT)            │
│  • Device Management                    │
│  • Dashboard Analytics                  │
│  • Chart Builder                        │
│  • Notification System                  │
│  • WebSocket Server                     │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
┌─────────┐         ┌──────────┐
│ SQLite/ │         │  IoTDB   │
│PostgreSQL│         │(Telemetry)│
└─────────┘         └──────────┘
```

---

## Core Features

### 1. User Management & Authentication

**Purpose:** Multi-tenant user system with secure authentication

**Features:**
- User registration and login with JWT tokens
- Password hashing with bcrypt (10 rounds)
- User profile management
- Admin and regular user roles
- API key generation (commented out in current version)
- Last login tracking
- User-based device isolation

**Key Endpoints:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/refresh-api-key` - Refresh API key

**Data Model:**
```javascript
User {
  id: INTEGER (PK, auto-increment)
  user_id: STRING(32) (unique, UUID without dashes)
  username: STRING(80) (unique)
  email: STRING(120) (unique)
  password_hash: STRING(128)
  is_active: BOOLEAN (default: true)
  is_admin: BOOLEAN (default: false)
  created_at: DATE
  updated_at: DATE
  last_login: DATE
}
```

---

### 2. Device Management

**Purpose:** CRUD operations for IoT devices with user ownership

**Features:**
- Create, read, update, delete devices
- Device status tracking (online/offline/critical)
- Device type categorization
- Location and version tracking
- User-based device ownership
- Automatic API key generation for devices
- Device configuration management
- Cascade deletion of related records

**Key Endpoints:**
- `POST /api/devices` - Create device
- `GET /api/devices` - Get all user's devices
- `GET /api/devices/:id` - Get specific device
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device (with cascade)
- `GET /api/devices/:id/configurations` - Get device config
- `PUT /api/devices/:id/configurations` - Update device config

**Data Model:**
```javascript
Device {
  id: INTEGER (PK, auto-increment)
  name: STRING(100)
  description: TEXT
  device_type: STRING(50)
  api_key: STRING(64) (unique, auto-generated)
  status: STRING(20) (default: 'offline')
  location: STRING(200)
  firmware_version: STRING(20)
  hardware_version: STRING(20)
  created_at: DATE
  updated_at: DATE
  last_seen: DATE
  user_id: INTEGER (FK -> users.id)
}
```

---

### 3. Telemetry Data Management

**Purpose:** Store and retrieve time-series sensor data via IoTDB

**Features:**
- Submit telemetry data to IoTDB
- Query telemetry by device, date range, data type
- Aggregated data queries (hourly/daily/weekly/monthly)
- Latest values retrieval
- User-based data isolation in IoTDB paths
- Automatic device status updates on data receipt
- Data anomaly detection and notifications

**Key Endpoints:**
- `POST /api/telemetry` - Submit telemetry data
- `GET /api/telemetry/device/:device_id` - Get telemetry data
- `GET /api/telemetry/device/:device_id/aggregated` - Get aggregated data
- `GET /api/telemetry/device/:device_id/latest` - Get latest values
- `GET /api/telemetry/health` - IoTDB health check
- `GET /api/telemetry/today-count` - Get today's message count

**IoTDB Path Structure:**
```
root.iotflow.users.user_{user_id}.devices.device_{device_id}.{measurement}
```

**Data Storage:**
- Telemetry stored in IoTDB (not SQLite/PostgreSQL)
- Supports multiple data types per device
- Includes unit and metadata fields
- Timestamp-based indexing

---

### 4. Dashboard Analytics

**Purpose:** Provide overview statistics and insights

**Features:**
- Device count by status
- Device count by type
- Recent devices (last 7 days)
- Device activity over time
- System alerts (offline/critical devices)
- System health percentage
- User-specific analytics

**Key Endpoints:**
- `GET /api/dashboard/overview` - Dashboard overview
- `GET /api/dashboard/activity` - Device activity (configurable days)
- `GET /api/dashboard/alerts` - System alerts
- `GET /api/dashboard/health` - System health metrics

**Analytics Provided:**
- Total devices count
- Devices by status (online/offline/critical)
- Devices by type distribution
- Active devices over time
- Offline device alerts (>24h)
- Critical status alerts
- Health percentage calculation

---

### 5. Chart Builder System

**Purpose:** Custom visualization creation and management

**Features:**
- Create custom charts with multiple data sources
- Support for 15+ chart types
- Multi-device data aggregation
- Chart sharing and permissions
- Chart configuration storage
- User-specific chart management

**Key Endpoints:**
- `POST /api/charts` - Create chart
- `GET /api/charts` - Get all user's charts
- `GET /api/charts/:id` - Get specific chart
- `PUT /api/charts/:id` - Update chart
- `DELETE /api/charts/:id` - Delete chart

**Data Model:**
```javascript
Chart {
  id: INTEGER (PK)
  user_id: INTEGER (FK)
  name: STRING
  description: TEXT
  chart_type: STRING
  configuration: JSON
  devices: [device_ids]
  created_at: DATE
  updated_at: DATE
}
```

---

### 6. Notification System

**Purpose:** Real-time alerts and notifications via WebSocket

**Features:**
- Real-time WebSocket notifications
- Multiple notification types (success/info/warning/error)
- Device-related notifications
- User action notifications
- Notification persistence
- Read/unread status tracking
- Notification history

**Key Endpoints:**
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification
- `DELETE /api/notifications` - Clear all notifications

**Notification Types:**
- Device created/updated/deleted
- Device connected/disconnected
- Data anomalies
- Low battery alerts
- User login/profile updates
- Configuration changes
- Control command status

**Data Model:**
```javascript
Notification {
  id: INTEGER (PK)
  user_id: INTEGER (FK)
  device_id: INTEGER (FK, nullable)
  type: STRING (success/info/warning/error)
  title: STRING
  message: TEXT
  source: STRING
  metadata: JSON
  is_read: BOOLEAN (default: false)
  created_at: DATE
}
```

---

### 7. Device Control System

**Purpose:** Send commands to devices and track execution

**Features:**
- Send control commands to devices
- Command status tracking (pending/acknowledged/completed/failed)
- Command history
- Pending commands queue
- Execution time tracking
- Simulated async command processing

**Key Endpoints:**
- `POST /api/devices/:id/control` - Send control command
- `GET /api/devices/:id/control/:controlId/status` - Get command status
- `GET /api/devices/:id/control/pending` - Get pending commands

**Command Flow:**
1. Command submitted → status: `pending`
2. Device acknowledges → status: `acknowledged` (0.5-2s)
3. Command executes → status: `completed` or `failed` (2-5s)

**Note:** Current implementation uses in-memory storage (`global.deviceControls`). Production should use database or message queue.

---

### 8. WebSocket Server

**Purpose:** Real-time bidirectional communication

**Features:**
- JWT-based WebSocket authentication
- User-specific connection management
- Real-time notification delivery
- Connection lifecycle management
- Error handling and reconnection support

**WebSocket Path:** `ws://localhost:3001/ws`

**Authentication Flow:**
```javascript
// Client sends auth message
{
  type: 'auth',
  token: 'JWT_TOKEN'
}

// Server responds
{
  type: 'auth_success',
  message: 'WebSocket authenticated successfully'
}
```

**Notification Format:**
```javascript
{
  type: 'notification',
  data: {
    id: 123,
    type: 'success',
    title: 'Device Created',
    message: 'Device "Sensor 001" created successfully',
    timestamp: '2025-12-08T10:30:00Z'
  }
}
```

---

## Database Schema

### Sequelize Models

**1. User** - User accounts and authentication
**2. Device** - IoT device registry
**3. DeviceAuth** - Device authentication records
**4. DeviceConfiguration** - Device configuration key-value pairs
**5. TelemetryData** - Metadata model (actual data in IoTDB)
**6. Chart** - Custom chart configurations
**7. Notification** - User notifications

### Relationships

```
User (1) ──< (N) Device
User (1) ──< (N) Chart
User (1) ──< (N) Notification
Device (1) ──< (N) DeviceAuth
Device (1) ──< (N) DeviceConfiguration
Device (1) ──< (N) TelemetryData
Device (1) ──< (N) Notification
```

---

## Middleware

### 1. Authentication Middleware (`authMiddleware.js`)

**Purpose:** Verify JWT tokens and authenticate requests

**Functions:**
- `verifyApiKey(req, res, next)` - Verify JWT token from headers
- Extracts user from token
- Attaches `req.user` to request object
- Returns 401 for invalid/missing tokens

**Usage:**
```javascript
router.get('/devices', verifyApiKey, deviceController.getAllDevices);
```

---

## Services

### 1. Notification Service (`notificationService.js`)

**Purpose:** Centralized notification management

**Features:**
- Create notifications
- Send real-time WebSocket notifications
- Manage WebSocket connections
- Pre-built notification templates:
  - `notifyDeviceCreated()`
  - `notifyDeviceUpdated()`
  - `notifyDeviceDeleted()`
  - `notifyDeviceConnected()`
  - `notifyDeviceDisconnected()`
  - `notifyDataAnomaly()`
  - `notifySuccessfulLogin()`

---

## Utilities

### 1. Database Utility (`db.js`)

**Purpose:** Sequelize configuration and connection

**Features:**
- SQLite for development
- PostgreSQL for production
- Connection pooling
- Automatic model synchronization

### 2. IoTDB Client (`iotdbClient.js`)

**Purpose:** IoTDB integration wrapper

**Features:**
- Insert telemetry records
- Query telemetry data
- Aggregate data
- Execute custom SQL
- Connection management
- Error handling

**Key Methods:**
```javascript
- insertRecord(devicePath, data, timestamp)
- queryRecords(devicePath, measurements, startTs, endTs, limit, page)
- aggregate(devicePath, dataType, aggregation, startTs, endTs)
- executeSQL(sql)
- testConnection()
```

---

## API Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Paginated Response
```json
{
  "data": [...],
  "total": 100,
  "currentPage": 1,
  "totalPages": 10,
  "limit": 10
}
```

---

## Security Features

1. **JWT Authentication** - Secure token-based auth (24h expiration)
2. **Password Hashing** - bcrypt with 10 rounds
3. **CORS Configuration** - Configurable allowed origins
4. **User Isolation** - All data scoped to user_id
5. **API Key Generation** - Secure random keys for devices
6. **Input Validation** - Required field validation
7. **Error Handling** - Sanitized error messages

---

## Environment Variables

```bash
# Server
NODE_ENV=production
PORT=3001

# Security
JWT_SECRET=your_super_secure_jwt_secret
SESSION_SECRET=your_session_secret

# Database
DB_PATH=./src/database.sqlite
# DATABASE_URL=postgresql://user:pass@host:port/db

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# IoTDB
IOTDB_HOST=localhost
IOTDB_PORT=6667
IOTDB_USERNAME=root
IOTDB_PASSWORD=root
```

---

## Deployment

### Development
```bash
npm install
npm run dev  # Uses nodemon for auto-reload
```

### Production
```bash
npm install
npm run init-db  # Initialize database
npm start  # Production server
```

### Docker
```bash
docker build -t iotflow-backend .
docker run -p 3001:3001 iotflow-backend
```

---

## Testing

```bash
npm test  # Run test suite
```

**Note:** Tests are currently disabled in production build (`echo "Tests removed for production build"`).

---

## Performance Considerations

1. **Database Indexing** - Automatic indexes on foreign keys
2. **Connection Pooling** - Sequelize connection pool
3. **IoTDB Optimization** - Time-series optimized storage
4. **WebSocket Efficiency** - Single connection per user
5. **Pagination** - Configurable limits on queries
6. **Caching** - In-memory device control cache

---

## Limitations & Notes

1. **Device Control** - Uses in-memory storage (not persistent)
2. **Pagination** - IoTDB queries may not support native pagination
3. **API Keys** - User API keys commented out (JWT only)
4. **Testing** - Test suite disabled in current version
5. **Scalability** - Single-instance WebSocket (no clustering)

---

## Future Enhancements

1. Persistent device control queue (database/Redis)
2. Advanced IoTDB query optimization
3. Comprehensive test coverage
4. WebSocket clustering for horizontal scaling
5. Advanced analytics and ML integration
6. Rate limiting and throttling
7. API versioning
8. Audit logging

---

**Document Version:** 1.0  
**Last Updated:** December 8, 2025  
**Backend Version:** 2.0.0
