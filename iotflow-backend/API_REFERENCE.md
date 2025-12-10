# IoTFlow Backend API Reference

**Base URL:** `http://localhost:3001`

**Last Updated:** December 10, 2025

---

## 🔑 Authentication Methods

1. **JWT Token** - Header: `Authorization: Bearer <token>`
2. **API Key** - Header: `X-API-Key: <api_key>`
3. **Admin Role** - Some routes require `is_admin: true` or `role: 'admin'`

---

## 📚 Table of Contents

- [System Routes](#system-routes)
- [Authentication & Users](#authentication--users)
- [Devices](#devices)
- [Device Groups](#device-groups)
- [Telemetry](#telemetry)
- [Dashboard](#dashboard)
- [Charts](#charts)
- [Notifications](#notifications)

---

## System Routes

### Health Check
```
GET /health
```
**Authentication:** None required

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-12-10T12:00:00.000Z"
}
```

---

## Authentication & Users

**Base Path:** `/api/auth` and `/api/users`

### Public Routes

#### Register User
```
POST /api/auth/register
```
**Authentication:** None required

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### Login User
```
POST /api/auth/login
```
**Authentication:** None required

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "user": {
    "id": "number",
    "username": "string",
    "email": "string",
    "is_admin": "boolean",
    "role": "string"
  }
}
```

### Authenticated Routes

#### Get Current User Profile
```
GET /api/users/profile
```
**Authentication:** JWT Token required

#### Update Current User Profile
```
PUT /api/users/profile
```
**Authentication:** JWT Token required

**Request Body:**
```json
{
  "email": "string",
  "password": "string" // optional
}
```

#### Refresh API Key
```
POST /api/users/refresh-api-key
```
**Authentication:** JWT Token required

#### Get All Users
```
GET /api/users/
```
**Authentication:** JWT Token required (admin check in controller)

#### Get User Devices
```
GET /api/users/:id/devices
```
**Authentication:** JWT Token required (admin check in controller)

#### Update User Role
```
PUT /api/users/:id/role
```
**Authentication:** JWT Token required (admin check in controller)

**Request Body:**
```json
{
  "role": "string"
}
```

#### Update User Status
```
PUT /api/users/:id/status
```
**Authentication:** JWT Token required (admin check in controller)

**Request Body:**
```json
{
  "status": "string"
}
```

### Admin Only Routes

#### Create User
```
POST /api/users/
```
**Authentication:** JWT Token + Admin Role required

#### Get Specific User
```
GET /api/users/:id
```
**Authentication:** JWT Token + Admin Role required

#### Update User
```
PUT /api/users/:id
```
**Authentication:** JWT Token + Admin Role required

#### Delete User
```
DELETE /api/users/:id
```
**Authentication:** JWT Token + Admin Role required

---

## Devices

**Base Path:** `/api/devices`

### Admin Routes

#### Get All Devices (Admin)
```
GET /api/devices/admin/devices
```
**Authentication:** JWT Token + Admin Role required

**Query Parameters:**
- `status` (optional): Filter by device status
- `device_type` (optional): Filter by device type
- `user_id` (optional): Filter by user ID

**Response:**
```json
{
  "devices": [
    {
      "id": "number",
      "name": "string",
      "device_type": "string",
      "status": "string",
      "user_id": "number",
      "created_at": "string",
      "user": {
        "id": "number",
        "username": "string",
        "email": "string"
      }
    }
  ],
  "total": "number"
}
```

#### Delete Device (Admin)
```
DELETE /api/devices/admin/devices/:id
```
**Authentication:** JWT Token + Admin Role required

### Device Management

#### Create Device
```
POST /api/devices/
```
**Authentication:** JWT Token required

**Request Body:**
```json
{
  "name": "string",
  "device_type": "string",
  "description": "string"
}
```

#### Get User's Devices
```
GET /api/devices/
```
**Authentication:** JWT Token required

#### Get Specific Device
```
GET /api/devices/:id
```
**Authentication:** JWT Token required

#### Get Device Groups
```
GET /api/devices/:id/groups
```
**Authentication:** JWT Token required

#### Update Device
```
PUT /api/devices/:id
```
**Authentication:** JWT Token required

**Request Body:**
```json
{
  "name": "string",
  "device_type": "string",
  "status": "string",
  "description": "string"
}
```

#### Delete Device
```
DELETE /api/devices/:id
```
**Authentication:** JWT Token required

### Device Configuration

#### Get Device Configuration
```
GET /api/devices/:id/configuration
```
**Authentication:** JWT Token required

#### Update Device Configuration
```
PUT /api/devices/:id/configuration
```
**Authentication:** JWT Token required

**Request Body:**
```json
{
  "configuration": "object"
}
```

### Device Control

#### Send Control Command
```
POST /api/devices/:id/control
```
**Authentication:** JWT Token required

**Request Body:**
```json
{
  "command": "string",
  "parameters": "object"
}
```

#### Get Control Status
```
GET /api/devices/:id/control/:controlId/status
```
**Authentication:** JWT Token required

#### Get Pending Controls
```
GET /api/devices/:id/control/pending
```
**Authentication:** JWT Token required

---

## Device Groups

**Base Path:** `/api/groups`

### Create Device Group
```
POST /api/groups/
```
**Authentication:** JWT Token required

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "device_ids": ["number"]
}
```

### Get All Groups
```
GET /api/groups/
```
**Authentication:** JWT Token required

### Get Specific Group
```
GET /api/groups/:id
```
**Authentication:** JWT Token required

### Update Group
```
PUT /api/groups/:id
```
**Authentication:** JWT Token required

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "device_ids": ["number"]
}
```

### Delete Group
```
DELETE /api/groups/:id
```
**Authentication:** JWT Token required

---

## Telemetry

**Base Path:** `/api/telemetry`

### Health Check
```
GET /api/telemetry/health
```
**Authentication:** None required

### Submit Telemetry Data
```
POST /api/telemetry/
```
**Authentication:** API Key required

**Request Body:**
```json
{
  "device_id": "number",
  "data": "object",
  "timestamp": "string"
}
```

### Get Telemetry Data
```
GET /api/telemetry/:device_id
```
**Authentication:** None required (public)

**Query Parameters:**
- `start` (optional): Start timestamp
- `end` (optional): End timestamp
- `limit` (optional): Number of records to return

### Get Aggregated Telemetry Data
```
GET /api/telemetry/device/:device_id/aggregated
```
**Authentication:** None required (public)

**Query Parameters:**
- `start` (optional): Start timestamp
- `end` (optional): End timestamp
- `aggregation` (optional): Aggregation type (avg, sum, min, max)

### Get Today's Message Count
```
GET /api/telemetry/today/count
```
**Authentication:** JWT Token required

### Generate Test Notification
```
POST /api/telemetry/test-notification
```
**Authentication:** JWT Token required

**Request Body:**
```json
{
  "message": "string",
  "type": "string"
}
```

---

## Dashboard

**Base Path:** `/api/dashboard`

All dashboard routes require API Key authentication.

### Get Dashboard Overview
```
GET /api/dashboard/overview
```
**Authentication:** API Key required

**Response:**
```json
{
  "total_devices": "number",
  "active_devices": "number",
  "total_messages": "number",
  "recent_activity": "array"
}
```

### Get Device Activity
```
GET /api/dashboard/activity
```
**Authentication:** API Key required

**Query Parameters:**
- `limit` (optional): Number of records to return
- `device_id` (optional): Filter by device ID

### Get Alerts
```
GET /api/dashboard/alerts
```
**Authentication:** API Key required

**Query Parameters:**
- `severity` (optional): Filter by severity level
- `limit` (optional): Number of records to return

### Get System Health
```
GET /api/dashboard/health
```
**Authentication:** API Key required

**Response:**
```json
{
  "status": "string",
  "uptime": "number",
  "memory_usage": "object",
  "cpu_usage": "number"
}
```

---

## Charts

**Base Path:** `/api/charts`

All chart routes require JWT Token authentication.

### Get All Charts
```
GET /api/charts/
```
**Authentication:** JWT Token required

### Get Specific Chart
```
GET /api/charts/:id
```
**Authentication:** JWT Token required

### Create Chart
```
POST /api/charts/
```
**Authentication:** JWT Token required

**Request Body:**
```json
{
  "name": "string",
  "type": "string",
  "configuration": "object",
  "device_ids": ["number"]
}
```

### Update Chart
```
PUT /api/charts/:id
```
**Authentication:** JWT Token required

**Request Body:**
```json
{
  "name": "string",
  "type": "string",
  "configuration": "object",
  "device_ids": ["number"]
}
```

### Delete Chart
```
DELETE /api/charts/:id
```
**Authentication:** JWT Token required

### Duplicate Chart
```
POST /api/charts/:id/duplicate
```
**Authentication:** JWT Token required

**Request Body:**
```json
{
  "name": "string"
}
```

---

## Notifications

**Base Path:** `/api/notifications`

All notification routes require JWT Token authentication.

### Get All Notifications
```
GET /api/notifications/
```
**Authentication:** JWT Token required

**Query Parameters:**
- `limit` (optional): Number of records to return
- `offset` (optional): Pagination offset
- `read` (optional): Filter by read status (true/false)

### Get Unread Count
```
GET /api/notifications/unread-count
```
**Authentication:** JWT Token required

**Response:**
```json
{
  "count": "number"
}
```

### Get Notification Statistics
```
GET /api/notifications/stats
```
**Authentication:** JWT Token required

**Response:**
```json
{
  "total": "number",
  "unread": "number",
  "by_type": "object"
}
```

### Mark Notification as Read
```
PUT /api/notifications/:id/read
```
**Authentication:** JWT Token required

### Mark All Notifications as Read
```
PUT /api/notifications/mark-all-read
```
**Authentication:** JWT Token required

### Delete Specific Notification
```
DELETE /api/notifications/:id
```
**Authentication:** JWT Token required

### Delete All Notifications
```
DELETE /api/notifications/
```
**Authentication:** JWT Token required

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Something went wrong!"
}
```

---

## Usage Examples

### Example: Login and Get Devices

```bash
# 1. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Response will include a token
# {"token": "eyJhbGc...", "user": {...}}

# 2. Use token to get devices
curl -X GET http://localhost:3001/api/devices/ \
  -H "Authorization: Bearer eyJhbGc..."

# 3. Admin: Get all devices from all users
curl -X GET http://localhost:3001/api/devices/admin/devices \
  -H "Authorization: Bearer eyJhbGc..."

# 4. Admin: Get devices with filters
curl -X GET "http://localhost:3001/api/devices/admin/devices?status=active&device_type=sensor" \
  -H "Authorization: Bearer eyJhbGc..."
```

### Example: Submit Telemetry Data

```bash
curl -X POST http://localhost:3001/api/telemetry/ \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": 1,
    "data": {
      "temperature": 25.5,
      "humidity": 60
    },
    "timestamp": "2025-12-10T12:00:00.000Z"
  }'
```

---

## Notes

- All timestamps should be in ISO 8601 format
- JWT tokens expire after 24 hours (configurable)
- API keys can be refreshed using the `/api/users/refresh-api-key` endpoint
- Admin access is determined by `is_admin: true` or `role: 'admin'` in user object
- Query parameters are optional unless specified otherwise
- Request bodies should be sent as JSON with `Content-Type: application/json` header
