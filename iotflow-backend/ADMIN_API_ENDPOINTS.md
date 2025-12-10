# Admin API Endpoints Reference

**Last Updated:** December 10, 2025  
**Base URL:** `http://localhost:5000/api`

---

## 🔐 Authentication

All admin endpoints require:
- **JWT Token** in `Authorization` header: `Bearer <token>`
- **Admin Role** (`is_admin: true` or `role: 'admin'`)

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📊 Admin API Overview

The IoTFlow Dashboard provides two types of admin endpoints:

1. **Admin V1 API** (`/api/v1/admin/*`) - Dedicated admin namespace (Recommended)
2. **Legacy Admin Endpoints** - Mixed with regular user endpoints

---

## 🎯 Admin V1 API (Recommended)

**Base Path:** `/api/v1/admin`

All routes under this path automatically require admin authentication via middleware.

### 👥 User Management

#### 1. Get All Users
```http
GET /api/v1/admin/users
```

**Response (without pagination params):** `200 OK`
```json
[
  {
    "id": 1,
    "user_id": "user_1701388800000",
    "username": "admin",
    "email": "admin@iot.com",
    "is_admin": true,
    "is_active": true,
    "api_key": "ak_admin123",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "user_id": "user_1701475200000",
    "username": "user1",
    "email": "user1@iot.com",
    "is_admin": false,
    "is_active": true,
    "api_key": "ak_user1456",
    "created_at": "2025-01-02T00:00:00.000Z",
    "updated_at": "2025-01-02T00:00:00.000Z"
  }
]
```

**Response (with pagination params):** `200 OK`
```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@iot.com",
      "is_admin": true,
      "is_active": true,
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
```

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Items per page (default: 50)
- `is_active` (optional): Filter by active status (true/false)
- `is_admin` (optional): Filter by admin role (true/false)
- `search` (optional): Search in username or email

**Important:** The response format changes based on whether pagination parameters are provided:
- **Without `page` or `limit`**: Returns array directly `[user1, user2, ...]`
- **With `page` or `limit`**: Returns object `{ users: [...], total, page, limit, totalPages }`

#### 2. Get Single User
```http
GET /api/v1/admin/users/:id
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@iot.com",
  "is_admin": true,
  "role": "admin",
  "is_active": true,
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-12-10T00:00:00.000Z"
}
```

#### 3. Create User
```http
POST /api/v1/admin/users
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@iot.com",
  "password": "SecurePass123!",
  "is_admin": false,
  "is_active": true
}
```

**Response:** `201 Created`
```json
{
  "message": "User created successfully",
  "userId": 3
}
```

#### 4. Update User
```http
PUT /api/v1/admin/users/:id
Content-Type: application/json

{
  "username": "updateduser",
  "email": "updated@iot.com",
  "is_admin": true,
  "is_active": false
}
```

**Response:** `200 OK`
```json
{
  "message": "User updated successfully"
}
```

#### 5. Delete User
```http
DELETE /api/v1/admin/users/:id
```

**Response:** `200 OK`
```json
{
  "message": "User deleted successfully"
}
```

#### 6. Get User's Devices
```http
GET /api/v1/admin/users/:id/devices
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Temperature Sensor 1",
    "device_type": "temperature_sensor",
    "status": "online",
    "location": "Living Room",
    "created_at": "2025-12-01T10:00:00.000Z",
    "last_seen": "2025-12-10T10:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Humidity Sensor",
    "device_type": "humidity_sensor",
    "status": "offline",
    "location": "Bedroom",
    "created_at": "2025-12-02T10:00:00.000Z",
    "last_seen": "2025-12-09T10:00:00.000Z"
  }
]
```

---

### 📱 Device Management

#### 7. Get All Devices (Admin View)
```http
GET /api/v1/admin/devices
```

**Response:** `200 OK`
```json
{
  "devices": [
    {
      "id": 1,
      "name": "Temperature Sensor 1",
      "description": "Living room temperature sensor",
      "device_type": "temperature_sensor",
      "api_key": "abc123def456",
      "status": "online",
      "location": "Living Room",
      "firmware_version": "1.0.0",
      "hardware_version": "2.0",
      "created_at": "2025-12-01T10:00:00.000Z",
      "updated_at": "2025-12-10T10:00:00.000Z",
      "last_seen": "2025-12-10T10:00:00.000Z",
      "user_id": 2,
      "user": {
        "id": 2,
        "username": "john_doe",
        "email": "john@example.com"
      }
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50,
  "totalPages": 2
}
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 50)
- `status` (optional): Filter by status (online/offline/active)
- `device_type` (optional): Filter by device type
- `user_id` (optional): Filter by user

#### 8. Get Single Device (Admin View)
```http
GET /api/v1/admin/devices/:id
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Temperature Sensor 1",
  "description": "Living room temperature sensor",
  "device_type": "temperature_sensor",
  "api_key": "abc123def456",
  "status": "online",
  "location": "Living Room",
  "user_id": 2,
  "user": {
    "id": 2,
    "username": "john_doe",
    "email": "john@example.com"
  },
  "telemetry_count": 1500,
  "last_telemetry": "2025-12-10T10:00:00.000Z"
}
```

#### 9. Delete Device (Admin)
```http
DELETE /api/v1/admin/devices/:id
```

**Response:** `200 OK`
```json
{
  "message": "Device deleted successfully",
  "success": true
}
```

**Note:** This will also delete:
- Associated device configurations
- Chart-device relationships

---

### 📊 Statistics

#### 10. Get System Statistics
```http
GET /api/v1/admin/stats
```

**Response:** `200 OK`
```json
{
  "totalUsers": 50,
  "activeUsers": 45,
  "inactiveUsers": 5,
  "adminUsers": 3,
  "totalDevices": 150,
  "activeDevices": 120,
  "offlineDevices": 30
}
```

---

## 🔧 Additional Admin Endpoints

These endpoints exist outside the Admin V1 namespace but provide admin functionality.

### � Device Management (Alternative Route)

**Base Path:** `/api/devices`

#### Get All Devices (Admin View)
```http
GET /api/devices/admin/devices
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
{
  "devices": [
    {
      "id": 1,
      "name": "Temperature Sensor 1",
      "device_type": "temperature_sensor",
      "status": "online",
      "location": "Living Room",
      "user_id": 2,
      "user": {
        "id": 2,
        "username": "john_doe",
        "email": "john@example.com"
      }
    }
  ],
  "total": 150
}
```

**Query Parameters:**
- `status` (optional): Filter by status (online/offline/active)
- `device_type` (optional): Filter by device type
- `user_id` (optional): Filter by specific user

**Note:** This endpoint duplicates functionality from `/api/v1/admin/devices`. Use Admin V1 API for consistency.

---

## 🆚 Comparison: Admin V1 vs Legacy

| Feature | Admin V1 API | Legacy API |
|---------|-------------|------------|
| **Base Path** | `/api/v1/admin/*` | Mixed paths |
| **Authentication** | Automatic via middleware | Per-route middleware |
| **Consistency** | ✅ Consistent structure | ⚠️ Mixed patterns |
| **Versioning** | ✅ Versioned (v1) | ❌ No versioning |
| **Recommended** | ✅ **Yes** | ⚠️ Use only if needed |

---

## 🔒 Security Notes

### Authentication Requirements
1. **JWT Token**: Must be valid and not expired
2. **Admin Role**: User must have `is_admin: true` OR `role: 'admin'`
3. **Token Validation**: Tokens are validated on every request

### Built-in Security Features
The Admin V1 API includes these security safeguards:

1. **Self-Protection**: Admins cannot:
   - Delete themselves (`DELETE /api/v1/admin/users/:id`)
   - Modify their own admin privileges or status (`PUT /api/v1/admin/users/:id`)

2. **Cascading Deletes**: When deleting devices:
   - Associated device configurations are automatically deleted
   - Chart-device relationships are cleaned up
   - Prevents orphaned data in the database

3. **Password Security**:
   - Passwords are hashed using bcrypt
   - Password hashes are never returned in API responses
   - Password updates are optional in PUT requests

### Best Practices
- Always use HTTPS in production
- Rotate admin passwords regularly
- Use strong password policies (enforced at application level)
- Log all admin actions for audit trails
- Implement rate limiting on admin endpoints
- Use RBAC (Role-Based Access Control) for fine-grained permissions
- Regularly review admin user list and remove unnecessary admin accounts

---

## 🚨 Error Responses

### 401 Unauthorized
```json
{
  "message": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "message": "Access denied. Admin privileges required."
}
```

### 404 Not Found
```json
{
  "message": "User not found"
}
```

### 400 Bad Request
```json
{
  "message": "Validation error",
  "errors": [
    "Username is required",
    "Email must be valid"
  ]
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

---

## 📝 Usage Examples

### JavaScript/TypeScript (Frontend)

```javascript
// Get all users (simple array)
const getAllUsers = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/v1/admin/users', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json(); // Returns array directly
};

// Get all users with pagination
const getAllUsersPaginated = async (page = 1, limit = 50) => {
  const token = localStorage.getItem('token');
  const response = await fetch(
    `http://localhost:5000/api/v1/admin/users?page=${page}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  const data = await response.json();
  return data; // Returns { users, total, page, limit, totalPages }
};

// Update user (role, status, etc.)
const updateUser = async (userId, updates) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`http://localhost:5000/api/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates) // e.g., { is_admin: true, is_active: true }
  });
  return await response.json();
};

// Get all devices (admin view)
const getAllDevices = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/v1/admin/devices', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json(); // Returns { devices, total, page, limit, totalPages }
};

// Get system stats
const getSystemStats = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/v1/admin/stats', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
  // Returns { totalUsers, activeUsers, inactiveUsers, adminUsers, 
  //           totalDevices, activeDevices, offlineDevices }
};

// Delete device
const deleteDevice = async (deviceId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`http://localhost:5000/api/v1/admin/devices/${deviceId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json(); // Returns { message, success: true }
};
```

### cURL Examples

```bash
# Get all users
curl -X GET http://localhost:5000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create new user
curl -X POST http://localhost:5000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@iot.com",
    "password": "SecurePass123!",
    "is_admin": false
  }'

# Update user
curl -X PUT http://localhost:5000/api/v1/admin/users/2 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "is_admin": true,
    "is_active": true
  }'

# Get system stats
curl -X GET http://localhost:5000/api/v1/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🎯 Quick Reference Summary

### Admin V1 API Endpoints (10 total)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/users` | Get all users |
| GET | `/api/v1/admin/users/:id` | Get single user |
| POST | `/api/v1/admin/users` | Create user |
| PUT | `/api/v1/admin/users/:id` | Update user |
| DELETE | `/api/v1/admin/users/:id` | Delete user |
| GET | `/api/v1/admin/users/:id/devices` | Get user's devices |
| GET | `/api/v1/admin/devices` | Get all devices |
| GET | `/api/v1/admin/devices/:id` | Get single device |
| DELETE | `/api/v1/admin/devices/:id` | Delete device |
| GET | `/api/v1/admin/stats` | Get system statistics |

---

## 🔄 Migration Guide

If you're using legacy admin endpoints, migrate to Admin V1 API:

### Before (Legacy)
```javascript
fetch('http://localhost:5000/api/users', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### After (Admin V1)
```javascript
fetch('http://localhost:5000/api/v1/admin/users', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Benefits:**
- ✅ Cleaner URL structure
- ✅ Better organization
- ✅ Version control
- ✅ Easier to maintain
- ✅ Future-proof

---

## 📚 Related Documentation

- [API Reference](/IoTFlow_Dashboard/iotflow-backend/API_REFERENCE.md)
- [Authentication Guide](/docs/authentication.md)
- [User Management Guide](/docs/user-management.md)
- [Device Management Guide](/docs/device-management.md)

---

**Maintained by:** IoTFlow Development Team  
**Last Review:** December 10, 2025  
**Status:** ✅ Active & Production Ready
