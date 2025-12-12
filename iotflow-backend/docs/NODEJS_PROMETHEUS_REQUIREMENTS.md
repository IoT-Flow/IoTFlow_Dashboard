# Node.js Backend - Prometheus Query API Requirements

**Date:** December 10, 2025  
**Backend:** Node.js/Express (IoTFlow Dashboard Backend)  
**Purpose:** Proxy Prometheus queries for frontend consumption

---

## 🎯 Objective

Create REST API endpoints in the Node.js backend to query Prometheus and format data for frontend dashboards. Act as a proxy between frontend and Prometheus with authentication and data transformation.

---

## 📊 Architecture Flow

```
Frontend (React/Vue)
    ↓ HTTP requests with JWT
Node.js Backend (Port 3000)
    ↓ queries
Prometheus HTTP API (Port 9090)
    ↓ returns time-series data
Node.js transforms data
    ↓ formatted JSON
Frontend
```

---

## 📦 Required Packages

Add to `package.json`:

```json
{
  "dependencies": {
    "axios": "^1.6.0"
  }
}
```

---

## 🔌 Required API Endpoints

### 1. System Overview

**GET** `/api/v1/admin/monitoring/system`

**Authentication**: Admin JWT required

**Response**:

```json
{
  "timestamp": "2025-12-10T10:00:00Z",
  "cpu": {
    "usage_percent": 45.2,
    "cores": 8
  },
  "memory": {
    "usage_percent": 62.5,
    "used_gb": 10.2,
    "total_gb": 16
  },
  "disk": {
    "usage_percent": 48.3,
    "used_gb": 241.5,
    "total_gb": 500
  }
}
```

**Prometheus Queries**:

- `system_cpu_usage_percent`
- `system_memory_usage_percent`
- `system_disk_usage_percent{path="/"}`

---

### 2. Application Statistics

**GET** `/api/v1/admin/monitoring/application`

**Authentication**: Admin JWT required

**Response**:

```json
{
  "timestamp": "2025-12-10T10:00:00Z",
  "devices": {
    "total": 1500,
    "active": 1200
  },
  "requests": {
    "total_today": 150000,
    "rate_per_second": 138.5,
    "avg_duration_ms": 45.2
  },
  "telemetry": {
    "messages_total": 50000000,
    "messages_today": 1200000
  }
}
```

**Prometheus Queries**:

- `iotflow_devices_total`
- `iotflow_devices_active`
- `increase(flask_http_requests_total[1d])`
- `rate(flask_http_requests_total[5m])`
- `iotflow_telemetry_messages_total`

---

### 3. Database Metrics

**GET** `/api/v1/admin/monitoring/database`

**Authentication**: Admin JWT required

**Response**:

```json
{
  "timestamp": "2025-12-10T10:00:00Z",
  "connections": {
    "total": 20,
    "active": 5,
    "idle": 15
  },
  "tables": [
    {
      "name": "devices",
      "rows": 1500
    },
    {
      "name": "users",
      "rows": 50
    }
  ],
  "performance": {
    "queries_per_second": 150.5,
    "avg_query_duration_ms": 15.2
  }
}
```

**Prometheus Queries**:

- `database_connections_active`
- `database_connections_idle`
- `database_table_rows`
- `rate(database_queries_total[5m])`

---

### 4. MQTT Metrics

**GET** `/api/v1/admin/monitoring/mqtt`

**Authentication**: Admin JWT required

**Response**:

```json
{
  "timestamp": "2025-12-10T10:00:00Z",
  "connections": {
    "total": 150,
    "active": 120
  },
  "messages": {
    "received_total": 1000000,
    "sent_total": 1200000,
    "rate_per_second": 150.5
  },
  "subscriptions": 300,
  "topics": 150
}
```

**Prometheus Queries**:

- `mqtt_connections_total`
- `mqtt_connections_active`
- `mqtt_messages_received_total`
- `rate(mqtt_messages_received_total[1m])`

---

### 5. Redis Metrics

**GET** `/api/v1/admin/monitoring/redis`

**Authentication**: Admin JWT required

**Response**:

```json
{
  "timestamp": "2025-12-10T10:00:00Z",
  "status": "up",
  "memory": {
    "used_mb": 512,
    "peak_mb": 1024
  },
  "keys": {
    "total": 5000,
    "evicted": 100
  },
  "performance": {
    "hit_rate_percent": 95.5,
    "commands_per_second": 5000
  }
}
```

**Prometheus Queries**:

- `redis_status`
- `redis_memory_used_bytes`
- `redis_keys_total`
- `rate(redis_cache_hits_total[5m]) / rate(redis_cache_hits_total[5m] + redis_cache_misses_total[5m])`

---

### 6. Time-Series Data (Historical)

**GET** `/api/v1/admin/monitoring/timeseries`

**Authentication**: Admin JWT required

**Query Parameters**:

- `metric` (required): Metric name (cpu, memory, requests, etc.)
- `range` (optional): Time range (1h, 6h, 24h, 7d, 30d) - default: 24h
- `step` (optional): Data point interval (1m, 5m, 1h) - default: auto

**Response**:

```json
{
  "metric": "cpu",
  "range": "24h",
  "step": "5m",
  "data": [
    {
      "timestamp": "2025-12-09T10:00:00Z",
      "value": 42.5
    },
    {
      "timestamp": "2025-12-09T10:05:00Z",
      "value": 45.2
    }
  ],
  "summary": {
    "min": 35.0,
    "max": 75.0,
    "avg": 48.3,
    "current": 45.2
  }
}
```

**Prometheus Query**:

- `system_cpu_usage_percent[24h:5m]` (range query)

---

### 7. Health Check

**GET** `/api/v1/admin/monitoring/health`

**Authentication**: Admin JWT required

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2025-12-10T10:00:00Z",
  "services": {
    "flask_backend": "up",
    "prometheus": "up",
    "database": "up",
    "redis": "up",
    "mqtt": "up"
  }
}
```

**Prometheus Queries**:

- Check if metrics are recent (< 1 minute old)
- `up{job="flask_iotflow_connectivity"}`

---

## 🏗️ Implementation Structure

### File Structure

```
iotflow-backend/
├── src/
│   ├── controllers/
│   │   └── monitoringController.js    # Handle monitoring requests
│   ├── services/
│   │   └── prometheusService.js       # Query Prometheus API
│   ├── routes/
│   │   └── monitoringRoutes.js        # Define monitoring routes
│   └── config/
│       └── prometheus.js              # Prometheus connection config
```

### Controller Responsibilities

- Validate admin authentication
- Parse query parameters
- Call PrometheusService
- Transform Prometheus data to frontend format
- Handle errors gracefully
- Cache responses (optional, 30-60 seconds)

### Service Responsibilities

- Connect to Prometheus HTTP API
- Execute PromQL queries
- Parse Prometheus response format
- Handle connection errors
- Retry logic for failed queries
- Query result caching

---

## 🔧 Configuration Requirements

### Environment Variables

```env
PROMETHEUS_URL=http://prometheus:9090
PROMETHEUS_TIMEOUT=10000
PROMETHEUS_CACHE_TTL=30
```

### Prometheus Connection

- **Base URL**: `http://prometheus:9090`
- **Query Endpoint**: `/api/v1/query`
- **Range Query Endpoint**: `/api/v1/query_range`
- **Timeout**: 10 seconds
- **Retry**: 3 attempts with exponential backoff

---

## 🔒 Security Requirements

1. **Authentication**: All endpoints require admin JWT token
2. **Authorization**: Verify `is_admin: true` in JWT payload
3. **Rate Limiting**: 100 requests/minute per admin user
4. **Input Validation**: Sanitize all query parameters
5. **Error Messages**: Don't expose Prometheus URLs or internal details
6. **CORS**: Configure appropriate CORS headers for frontend

---

## 📊 PromQL Query Examples

### Instant Queries (Current Value)

```
system_cpu_usage_percent
```

### Rate Calculations (Per Second)

```
rate(flask_http_requests_total[5m])
```

### Aggregations

```
sum(database_table_rows)
avg_over_time(system_cpu_usage_percent[1h])
```

### Range Queries (Time Series)

```
system_cpu_usage_percent[24h:5m]
```

### Complex Calculations

```
rate(redis_cache_hits_total[5m]) /
(rate(redis_cache_hits_total[5m]) + rate(redis_cache_misses_total[5m])) * 100
```

---

## 🧪 Testing Requirements

### Unit Tests

1. PrometheusService query execution
2. Data transformation logic
3. Error handling
4. Cache functionality

### Integration Tests

1. Prometheus API connectivity
2. Query execution and response parsing
3. Authentication middleware
4. Rate limiting

### E2E Tests

1. Frontend can fetch metrics
2. Real-time data updates
3. Historical data retrieval
4. Error scenarios (Prometheus down)

---

## ⚡ Performance Requirements

1. **Response Time**: < 500ms for instant queries
2. **Response Time**: < 2s for range queries
3. **Caching**: Cache responses for 30-60 seconds
4. **Connection Pooling**: Reuse HTTP connections to Prometheus
5. **Concurrent Requests**: Handle 10+ simultaneous admin requests
6. **Memory Usage**: < 100MB for service

---

## 🎯 Error Handling

### Error Scenarios

1. Prometheus server unreachable
2. Invalid PromQL query
3. No data available for time range
4. Timeout
5. Invalid authentication

### Error Response Format

```json
{
  "error": "Failed to fetch metrics",
  "code": "PROMETHEUS_UNAVAILABLE",
  "message": "Unable to connect to monitoring service",
  "timestamp": "2025-12-10T10:00:00Z"
}
```

---

## ✅ Acceptance Criteria

- [ ] All 7 endpoints implemented and working
- [ ] Admin authentication enforced on all endpoints
- [ ] Prometheus queries execute successfully
- [ ] Data transformed to frontend-friendly format
- [ ] Error handling for all failure scenarios
- [ ] Response caching implemented
- [ ] Rate limiting configured
- [ ] Response times meet requirements
- [ ] Tests passing (unit + integration)
- [ ] API documentation complete

---

## 📝 API Documentation Format

Use OpenAPI/Swagger for API documentation:

- Request/response schemas
- Authentication requirements
- Query parameters
- Example requests/responses
- Error codes and messages

---

## 🔄 Next Steps

1. Implement Flask metrics (previous document)
2. Implement Node.js proxy API (this document)
3. Create frontend monitoring dashboard components
4. Configure Grafana for advanced visualization
