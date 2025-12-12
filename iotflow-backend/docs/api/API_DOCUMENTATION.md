# IoTFlow Backend API Documentation

## Overview

The IoTFlow Backend provides a comprehensive REST API for managing IoT devices, users, telemetry data, and dashboard analytics.

**Base URL**: `http://localhost:3001`

## Authentication

The API uses API key authentication. Include your API key in the request headers:

```
x-api-key: YOUR_API_KEY
```

## API Endpoints

### Health Check

- **GET /health** - Check API health status

### Authentication & User Management

#### Register User

- **POST /api/auth/register**
- **Body**: `{ "username": "string", "email": "string", "password": "string" }`
- **Response**: User object with API key

#### Login User

- **POST /api/auth/login**
- **Body**: `{ "email": "string", "password": "string" }`
- **Response**: User object with JWT token

#### Get User Profile

- **GET /api/auth/profile**
- **Headers**: `x-api-key: YOUR_API_KEY`
- **Response**: User profile information

#### Update User Profile

- **PUT /api/auth/profile**
- **Headers**: `x-api-key: YOUR_API_KEY`
- **Body**: `{ "username": "string", "email": "string", "password": "string" }`
- **Response**: Updated user profile

#### Refresh API Key

- **POST /api/auth/refresh-api-key**
- **Headers**: `x-api-key: YOUR_API_KEY`
- **Response**: New API key

### Device Management

#### Create Device

- **POST /api/devices**
- **Headers**: `x-api-key: YOUR_API_KEY`
- **Body**: `{ "name": "string", "description": "string", "device_type": "string", "status": "string", "location": "string" }`
- **Response**: Created device object

#### Get All Devices

- **GET /api/devices**
- **Headers**: `x-api-key: YOUR_API_KEY`
- **Query Parameters**: `page`, `limit`, `status`, `device_type`
- **Response**: Paginated list of devices

#### Get Device by ID

- **GET /api/devices/:id**
- **Headers**: `x-api-key: YOUR_API_KEY`
- **Response**: Device object

#### Update Device

- **PUT /api/devices/:id**
- **Headers**: `x-api-key: YOUR_API_KEY`
- **Body**: Device fields to update
- **Response**: Updated device object

#### Delete Device

- **DELETE /api/devices/:id**
- **Headers**: `x-api-key: YOUR_API_KEY`
- **Response**: 204 No Content

#### Update Device Status

- **PATCH /api/devices/:id/status**
- **Headers**: `x-api-key: YOUR_API_KEY`
- **Body**: `{ "status": "string" }`
- **Response**: Updated status

### Device Configuration

#### Get Device Configurations

- **GET /api/devices/:id/configurations**
- **Headers**: `x-api-key: YOUR_API_KEY`
- **Response**: Array of configuration objects

#### Update Device Configuration

- **PUT /api/devices/:id/configurations**
- **Headers**: `x-api-key: YOUR_API_KEY`
- **Body**: `{ "config_key": "string", "config_value": "string", "data_type": "string" }`
- **Response**: Configuration object

### Telemetry Data

#### Submit Telemetry Data

- **POST /api/telemetry**
- **Headers**: `x-api-key: YOUR_API_KEY`
- **Body**: `{ "device_id": number, "data_type": "string", "value": number, "unit": "string", "metadata": {} }`
- **Response**: Created telemetry record

#### Get Telemetry Data

- **GET /api/telemetry/device/:device_id**
- **Headers**: `x-api-key: YOUR_API_KEY`
- **Query Parameters**: `data_type`, `start_date`, `end_date`, `limit`, `page`
- **Response**: Paginated telemetry data

#### Get Aggregated Telemetry Data

- **GET /api/telemetry/device/:device_id/aggregated**
- **Headers**: `x-api-key: YOUR_API_KEY`
- **Query Parameters**: `data_type`, `start_date`, `end_date`, `aggregation` (hour/day/week/month)
- **Response**: Aggregated telemetry data

#### Get Latest Telemetry Values

- **GET /api/telemetry/device/:device_id/latest**
- **Headers**: `x-api-key: YOUR_API_KEY`
- **Response**: Latest values for each data type

### Dashboard & Analytics

#### Get Dashboard Overview

- **GET /api/dashboard/overview**
- **Headers**: `x-api-key: YOUR_API_KEY`
- **Response**: Dashboard overview with device stats and recent devices

#### Get Device Activity

- **GET /api/dashboard/activity**
- **Headers**: `x-api-key: YOUR_API_KEY`
- **Query Parameters**: `days` (default: 30)
- **Response**: Device activity over time

#### Get System Alerts

- **GET /api/dashboard/alerts**
- **Headers**: `x-api-key: YOUR_API_KEY`
- **Response**: Array of system alerts

#### Get System Health

- **GET /api/dashboard/health**
- **Headers**: `x-api-key: YOUR_API_KEY`
- **Response**: System health metrics

## Data Models

### User

```json
{
  "id": 1,
  "user_id": "uuid",
  "username": "string",
  "email": "string",
  "api_key": "string",
  "is_active": true,
  "is_admin": false,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z",
  "last_login": "2025-01-01T00:00:00Z"
}
```

### Device

```json
{
  "id": 1,
  "name": "string",
  "description": "string",
  "device_type": "string",
  "api_key": "string",
  "status": "online|offline|critical",
  "location": "string",
  "firmware_version": "string",
  "hardware_version": "string",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z",
  "last_seen": "2025-01-01T00:00:00Z",
  "user_id": 1
}
```

### Telemetry Data

```json
{
  "id": 1,
  "device_id": 1,
  "timestamp": "2025-01-01T00:00:00Z",
  "data_type": "temperature",
  "value": 23.5,
  "unit": "°C",
  "metadata": {}
}
```

### Device Configuration

```json
{
  "id": 1,
  "device_id": 1,
  "config_key": "sampling_rate",
  "config_value": "10",
  "data_type": "integer",
  "is_active": true,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

```json
{
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Status Codes

- **200**: Success
- **201**: Created
- **204**: No Content
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Internal Server Error

## Examples

### Complete User Registration and Device Setup Flow

1. **Register User**

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "john", "email": "john@example.com", "password": "password123"}'
```

2. **Create Device**

```bash
curl -X POST http://localhost:3001/api/devices \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"name": "Temperature Sensor", "device_type": "sensor", "status": "online"}'
```

3. **Submit Telemetry Data**

```bash
curl -X POST http://localhost:3001/api/telemetry \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"device_id": 1, "data_type": "temperature", "value": 23.5, "unit": "°C"}'
```

4. **Get Dashboard Overview**

```bash
curl -X GET http://localhost:3001/api/dashboard/overview \
  -H "x-api-key: YOUR_API_KEY"
```

## Testing

Run the complete test suite:

```bash
NODE_ENV=test npm test
```

## Environment Variables

- `NODE_ENV`: Environment (test/development/production)
- `PORT`: Server port (default: 3000)
- `JWT_SECRET`: Secret for JWT tokens
- `DB_HOST`: Database host
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
