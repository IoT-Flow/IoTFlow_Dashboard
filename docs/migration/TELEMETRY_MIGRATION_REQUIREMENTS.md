# Telemetry Data Retrieval API - Migration Requirements

**Date:** 2025-01-XX  
**Source:** Node.js/Express Backend (IoTFlow_Dashboard/iotflow-backend)  
**Target:** Flask Backend (Connectivity-Layer)  
**Objective:** Migrate telemetry data retrieval endpoints from Node.js to Flask for better integration with existing IoTDB infrastructure

---

## Executive Summary

Migrate the telemetry data retrieval API from Node.js/Express backend to Flask backend to:

1. **Consolidate IoTDB operations** - Flask backend already has IoTDB infrastructure (`IoTDBService`, `iotdb_config`)
2. **Improve performance** - Reduce inter-service dependencies and network hops
3. **Simplify architecture** - Single backend for IoTDB read/write operations
4. **Enhance maintainability** - All IoTDB logic in one codebase

**Current State:**

- ✅ Flask backend has telemetry **write** operations (POST endpoint)
- ❌ Node.js backend handles telemetry **read** operations (GET endpoints)
- ✅ Flask has complete IoTDB client infrastructure

**Target State:**

- ✅ Flask backend handles **both** read and write operations
- ✅ Node.js frontend calls Flask API directly for telemetry queries
- ✅ Unified IoTDB access layer

---

## 1. Current Implementation Analysis

### 1.1 Node.js Backend (Source)

**Endpoints to Migrate:**

| Endpoint                                      | Method | Authentication    | Purpose              | Status          |
| --------------------------------------------- | ------ | ----------------- | -------------------- | --------------- |
| `/api/telemetry/:device_id`                   | GET    | None (should add) | Get device telemetry | **Migrate**     |
| `/api/telemetry/device/:device_id/aggregated` | GET    | None (should add) | Get aggregated data  | **Migrate**     |
| `/api/telemetry/health`                       | GET    | None              | Health check         | **Keep** (both) |

**File:** `IoTFlow_Dashboard/iotflow-backend/src/controllers/telemetryController.js`

#### Endpoint 1: GET /api/telemetry/:device_id

```javascript
async getTelemetryData(req, res) {
  const { device_id } = req.params;
  const { data_type, start_date, end_date, limit = 100, page = 1 } = req.query;

  // Find device to get user_id
  const device = await Device.findByPk(device_id);
  if (!device) {
    return res.status(404).json({ message: 'Device not found' });
  }

  // Build device path
  const devicePath = `root.iotflow.users.user_${device.user_id}.devices.device_${device_id}`;
  const measurements = data_type ? [data_type] : ['*'];
  const startTs = start_date ? new Date(start_date).getTime() : undefined;
  const endTs = end_date ? new Date(end_date).getTime() : undefined;

  // Query IoTDB
  const rows = await iotdbClient.queryRecords(devicePath, measurements, startTs, endTs, limit, page);

  res.status(200).json({
    telemetry: rows,
    total: rows.length,
    currentPage: parseInt(page),
    totalPages: 1,
  });
}
```

**Query Parameters:**

- `data_type` (string, optional) - Filter by measurement type (e.g., "temperature", "humidity")
- `start_date` (ISO string, optional) - Start timestamp for filtering
- `end_date` (ISO string, optional) - End timestamp for filtering
- `limit` (integer, default: 100) - Number of records to return
- `page` (integer, default: 1) - Pagination page number

**Response Schema:**

```json
{
  "telemetry": [
    {
      "timestamp": "2025-01-15T10:30:00.000Z",
      "temperature": 23.5,
      "humidity": 65.2
    }
  ],
  "total": 1,
  "currentPage": 1,
  "totalPages": 1
}
```

#### Endpoint 2: GET /api/telemetry/device/:device_id/aggregated

```javascript
async getAggregatedData(req, res) {
  const { device_id } = req.params;
  const { data_type, aggregation, start_date, end_date } = req.query;

  if (!aggregation || !data_type) {
    return res.status(400).json({ message: 'Aggregation type and data_type are required' });
  }

  // Find device
  const device = await Device.findByPk(device_id);
  if (!device) {
    return res.status(404).json({ message: 'Device not found' });
  }

  // Build path and query
  const devicePath = `root.iotflow.users.user_${device.user_id}.devices.device_${device_id}`;
  const startTs = start_date ? new Date(start_date).getTime() : undefined;
  const endTs = end_date ? new Date(end_date).getTime() : undefined;

  // Query aggregated data
  const result = await iotdbClient.aggregate(devicePath, data_type, aggregation, startTs, endTs);

  res.status(200).json(result);
}
```

**Query Parameters:**

- `data_type` (string, **required**) - Measurement to aggregate
- `aggregation` (string, **required**) - Aggregation function: "avg", "sum", "min", "max", "count"
- `start_date` (ISO string, optional) - Start timestamp
- `end_date` (ISO string, optional) - End timestamp

**Response Schema:**

```json
{
  "aggregation": "avg",
  "data_type": "temperature",
  "value": 24.5,
  "count": 150,
  "start_time": "2025-01-15T00:00:00.000Z",
  "end_time": "2025-01-15T23:59:59.999Z"
}
```

### 1.2 IoTDB Client Implementation

**File:** `IoTFlow_Dashboard/iotflow-backend/src/utils/iotdbClient.js`

**Key Methods:**

```javascript
class IoTDBClient {
  async queryRecords(devicePath, measurements, startTs, endTs, limit, page) {
    // Executes SQL: SELECT {measurements} FROM {devicePath} WHERE time >= startTs AND time <= endTs LIMIT {limit}
  }

  async aggregate(devicePath, dataType, aggregation, startTs, endTs) {
    // Executes SQL: SELECT {aggregation}({dataType}) FROM {devicePath} WHERE time >= startTs AND time <= endTs
  }

  async executeSQL(sql) {
    // HTTP POST to http://localhost:18080/rest/v2/query
    // Authorization: Basic {base64(username:password)}
  }
}
```

**Connection Details:**

- Host: `localhost` (from env: `IOTDB_HOST`)
- Port: `18080` (from env: `IOTDB_REST_PORT`)
- API Path: `/rest/v2/query`
- Auth: Basic Auth (username: `root`, password: `root`)
- Protocol: HTTP REST API (not native session)

---

## 2. Flask Backend (Target)

### 2.1 Existing Infrastructure

**Already Implemented:**

✅ **IoTDB Service** (`Connectivity-Layer/src/services/iotdb.py`):

```python
class IoTDBService:
    def __init__(self):
        self.session = iotdb_config.session  # Native Python session
        self.database = iotdb_config.database

    def write_telemetry_data(device_id, data, device_type, metadata, timestamp, user_id) -> bool
    def get_device_telemetry(device_id, start_time, end_time, limit, user_id) -> List[Dict]
    def is_available() -> bool
```

✅ **IoTDB Config** (`Connectivity-Layer/src/config/iotdb_config.py`):

```python
class IoTDBConfig:
    def __init__(self):
        self.host = os.getenv("IOTDB_HOST", "localhost")
        self.port = int(os.getenv("IOTDB_PORT", "6667"))  # Native port, not REST
        self.session = Session(host, port, username, password)

    def get_device_path(device_id, user_id) -> str
    def is_connected() -> bool
```

✅ **Telemetry Routes** (`Connectivity-Layer/src/routes/telemetry.py`):

```python
telemetry_bp = Blueprint("telemetry", __name__, url_prefix="/api/v1/telemetry")

@telemetry_bp.route("", methods=["POST"])
def store_telemetry():
    # ✅ Already implemented - stores telemetry data

@telemetry_bp.route("/<int:device_id>", methods=["GET"])
def get_device_telemetry(device_id):
    # ✅ PARTIALLY IMPLEMENTED - needs enhancement to match Node.js API
```

**Current GET Implementation (lines 113-143):**

```python
@telemetry_bp.route("/<int:device_id>", methods=["GET"])
def get_device_telemetry(device_id):
    """Get telemetry data for a specific device"""
    device, err, code = get_authenticated_device(device_id)
    if err:
        return err, code

    telemetry_data = iotdb_service.get_device_telemetry(
        device_id=str(device_id),
        user_id=str(device.user_id),
        start_time=request.args.get("start_time", "-1h"),  # ⚠️ Different format
        limit=min(int(request.args.get("limit", 1000)), 10000),
    )

    return jsonify({
        "device_id": device_id,
        "device_name": device.name,
        "device_type": device.device_type,
        "start_time": request.args.get("start_time", "-1h"),
        "data": telemetry_data,  # ⚠️ Different structure
        "count": len(telemetry_data),
        "iotdb_available": iotdb_service.is_available(),
    }), 200
```

**Gaps to Address:**

1. ❌ No `data_type` filtering (only returns all measurements)
2. ❌ No pagination support (`page` parameter)
3. ❌ Time format uses relative strings (`"-1h"`) instead of ISO timestamps
4. ❌ No aggregation endpoint
5. ⚠️ Different response structure than Node.js API
6. ⚠️ Authentication uses API key (good) but Node.js has none

---

## 3. Migration Requirements

### 3.1 New Flask Endpoints

#### Endpoint 1: GET /api/v1/telemetry/device/<device_id>

**Purpose:** Retrieve telemetry data for a device with filtering and pagination

**Route Definition:**

```python
@telemetry_bp.route("/device/<int:device_id>", methods=["GET"])
def get_device_telemetry_data(device_id):
    """
    Get telemetry data for a device

    Query Parameters:
        - data_type (str, optional): Filter by measurement type
        - start_date (ISO string, optional): Start timestamp
        - end_date (ISO string, optional): End timestamp
        - limit (int, default: 100): Records per page
        - page (int, default: 1): Page number

    Authentication: API key or JWT token

    Returns:
        200: Telemetry data with pagination
        404: Device not found
        401: Unauthorized
        500: Server error
    """
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `data_type` | string | No | None | Filter by measurement (e.g., "temperature") |
| `start_date` | ISO 8601 | No | None | Start timestamp (e.g., "2025-01-15T00:00:00Z") |
| `end_date` | ISO 8601 | No | None | End timestamp |
| `limit` | integer | No | 100 | Max records per page (1-10000) |
| `page` | integer | No | 1 | Page number (1-indexed) |

**Request Example:**

```
GET /api/v1/telemetry/device/123?data_type=temperature&start_date=2025-01-15T00:00:00Z&end_date=2025-01-16T00:00:00Z&limit=50&page=1
Headers:
  X-API-Key: device_api_key_here
  OR
  Authorization: Bearer jwt_token_here
```

**Response Schema (Success - 200):**

```json
{
  "success": true,
  "device_id": 123,
  "device_name": "Temperature Sensor 1",
  "device_type": "sensor",
  "telemetry": [
    {
      "timestamp": "2025-01-15T10:30:00.000Z",
      "temperature": 23.5,
      "temperature_unit": "celsius"
    },
    {
      "timestamp": "2025-01-15T10:35:00.000Z",
      "temperature": 24.1,
      "temperature_unit": "celsius"
    }
  ],
  "pagination": {
    "total": 2,
    "currentPage": 1,
    "totalPages": 1,
    "limit": 50
  },
  "filters": {
    "data_type": "temperature",
    "start_date": "2025-01-15T00:00:00Z",
    "end_date": "2025-01-16T00:00:00Z"
  },
  "iotdb_available": true
}
```

**Response Schema (Error - 404):**

```json
{
  "success": false,
  "error": "Device not found",
  "device_id": 123
}
```

#### Endpoint 2: GET /api/v1/telemetry/device/<device_id>/aggregated

**Purpose:** Get aggregated telemetry data (avg, sum, min, max, count)

**Route Definition:**

```python
@telemetry_bp.route("/device/<int:device_id>/aggregated", methods=["GET"])
def get_device_aggregated_data(device_id):
    """
    Get aggregated telemetry data for a device

    Query Parameters:
        - data_type (str, REQUIRED): Measurement to aggregate
        - aggregation (str, REQUIRED): Function (avg, sum, min, max, count)
        - start_date (ISO string, optional): Start timestamp
        - end_date (ISO string, optional): End timestamp

    Authentication: API key or JWT token

    Returns:
        200: Aggregated result
        400: Missing required parameters
        404: Device not found
        401: Unauthorized
        500: Server error
    """
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `data_type` | string | **YES** | - | Measurement name (e.g., "temperature") |
| `aggregation` | string | **YES** | - | Function: "avg", "sum", "min", "max", "count" |
| `start_date` | ISO 8601 | No | None | Start timestamp |
| `end_date` | ISO 8601 | No | None | End timestamp |

**Request Example:**

```
GET /api/v1/telemetry/device/123/aggregated?data_type=temperature&aggregation=avg&start_date=2025-01-15T00:00:00Z
Headers:
  X-API-Key: device_api_key_here
```

**Response Schema (Success - 200):**

```json
{
  "success": true,
  "device_id": 123,
  "device_name": "Temperature Sensor 1",
  "aggregation": {
    "type": "avg",
    "data_type": "temperature",
    "value": 24.5,
    "count": 150,
    "start_date": "2025-01-15T00:00:00Z",
    "end_date": "2025-01-15T23:59:59.999Z"
  },
  "iotdb_available": true
}
```

**Response Schema (Error - 400):**

```json
{
  "success": false,
  "error": "Missing required parameters",
  "required": ["data_type", "aggregation"]
}
```

### 3.2 Authentication Requirements

**Current State:**

- ❌ Node.js endpoints have **NO authentication** (security risk)
- ✅ Flask POST endpoint uses API key authentication

**Target State:**

- ✅ Support **dual authentication**:
  1. **API Key** (`X-API-Key` header) - for device-to-device queries
  2. **JWT Token** (`Authorization: Bearer` header) - for user/admin queries

**Implementation:**

```python
from src.middleware.auth import verify_api_key_or_jwt

@telemetry_bp.route("/device/<int:device_id>", methods=["GET"])
@verify_api_key_or_jwt  # Decorator for dual auth
def get_device_telemetry_data(device_id):
    # Access device from request context (set by middleware)
    authenticated_entity = request.authenticated_entity  # Device or User object

    # Authorization: Check if requester has access to device
    if isinstance(authenticated_entity, Device):
        if authenticated_entity.id != device_id:
            return jsonify({"error": "Forbidden"}), 403
    elif isinstance(authenticated_entity, User):
        device = Device.query.get(device_id)
        if device.user_id != authenticated_entity.id and not authenticated_entity.is_admin:
            return jsonify({"error": "Forbidden"}), 403
```

**Middleware to Create:**

```python
# File: Connectivity-Layer/src/middleware/auth.py

def verify_api_key_or_jwt(f):
    """Decorator to verify API key or JWT token"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Try API key first
        api_key = request.headers.get("X-API-Key")
        if api_key:
            device = Device.query.filter_by(api_key=api_key).first()
            if device:
                request.authenticated_entity = device
                request.auth_type = "api_key"
                return f(*args, **kwargs)

        # Try JWT token
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
                user = User.query.get(payload["user_id"])
                if user:
                    request.authenticated_entity = user
                    request.auth_type = "jwt"
                    return f(*args, **kwargs)
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token expired"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"error": "Invalid token"}), 401

        return jsonify({"error": "Authentication required"}), 401

    return decorated_function
```

### 3.3 IoTDB Service Enhancements

**Current Method (`get_device_telemetry`):**

```python
def get_device_telemetry(device_id, start_time=None, end_time=None, limit=100, user_id=None):
    # Issues:
    # 1. start_time uses relative strings ("-1h") instead of timestamps
    # 2. No data_type filtering
    # 3. No pagination (page parameter)
    # 4. Returns raw IoTDB records (needs formatting)
```

**Enhanced Method (New):**

```python
def query_telemetry_data(
    device_id: str,
    user_id: str,
    data_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 100,
    page: int = 1
) -> Dict[str, Any]:
    """
    Query telemetry data with filtering and pagination

    Args:
        device_id: Device identifier
        user_id: User identifier (for path construction)
        data_type: Optional measurement filter (e.g., "temperature")
        start_date: Optional start timestamp (datetime object)
        end_date: Optional end timestamp (datetime object)
        limit: Records per page (max 10000)
        page: Page number (1-indexed)

    Returns:
        {
            "records": [{"timestamp": ..., "temperature": ...}],
            "total": 150,
            "page": 1,
            "pages": 2
        }
    """
    device_path = iotdb_config.get_device_path(device_id, user_id)

    # Build SQL query
    measurements = f"{data_type}" if data_type else "*"
    sql = f"SELECT {measurements} FROM {device_path}"

    # Add time filters
    conditions = []
    if start_date:
        conditions.append(f"time >= {int(start_date.timestamp() * 1000)}")
    if end_date:
        conditions.append(f"time <= {int(end_date.timestamp() * 1000)}")

    if conditions:
        sql += " WHERE " + " AND ".join(conditions)

    # Add pagination (offset = (page - 1) * limit)
    offset = (page - 1) * limit
    sql += f" LIMIT {limit} OFFSET {offset}"

    # Execute query
    result_set = self.session.execute_query_statement(sql)

    # Parse results
    records = []
    while result_set.has_next():
        record = result_set.next()
        records.append({
            "timestamp": datetime.fromtimestamp(record.get_timestamp() / 1000).isoformat() + "Z",
            **{field: record.get_field(field) for field in record.get_fields()}
        })

    # Get total count (separate query)
    count_sql = f"SELECT COUNT(*) FROM {device_path}"
    if conditions:
        count_sql += " WHERE " + " AND ".join(conditions)

    count_result = self.session.execute_query_statement(count_sql)
    total = count_result.next().get_field("count") if count_result.has_next() else 0

    return {
        "records": records,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit  # Ceiling division
    }
```

**New Method (Aggregation):**

```python
def aggregate_telemetry_data(
    device_id: str,
    user_id: str,
    data_type: str,
    aggregation: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Aggregate telemetry data

    Args:
        device_id: Device identifier
        user_id: User identifier
        data_type: Measurement to aggregate (REQUIRED)
        aggregation: Function - "avg", "sum", "min", "max", "count"
        start_date: Optional start timestamp
        end_date: Optional end timestamp

    Returns:
        {
            "value": 24.5,
            "count": 150,
            "aggregation": "avg",
            "data_type": "temperature"
        }
    """
    device_path = iotdb_config.get_device_path(device_id, user_id)

    # Validate aggregation function
    valid_aggs = ["avg", "sum", "min", "max", "count"]
    if aggregation.lower() not in valid_aggs:
        raise ValueError(f"Invalid aggregation: {aggregation}")

    # Build SQL
    sql = f"SELECT {aggregation.upper()}({data_type}) AS value, COUNT({data_type}) AS count FROM {device_path}"

    # Add time filters
    conditions = []
    if start_date:
        conditions.append(f"time >= {int(start_date.timestamp() * 1000)}")
    if end_date:
        conditions.append(f"time <= {int(end_date.timestamp() * 1000)}")

    if conditions:
        sql += " WHERE " + " AND ".join(conditions)

    # Execute
    result_set = self.session.execute_query_statement(sql)

    if result_set.has_next():
        record = result_set.next()
        return {
            "value": record.get_field("value"),
            "count": record.get_field("count"),
            "aggregation": aggregation,
            "data_type": data_type
        }
    else:
        return {
            "value": None,
            "count": 0,
            "aggregation": aggregation,
            "data_type": data_type
        }
```

### 3.4 Database Models

**No changes required** - Flask backend already has Device model:

```python
# Connectivity-Layer/src/models.py
class Device(db.Model):
    __tablename__ = 'devices'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    device_type = db.Column(db.String(50), nullable=False)
    api_key = db.Column(db.String(255), unique=True, nullable=False)
    status = db.Column(db.String(20), default='offline')
    last_seen = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationship
    user = db.relationship('User', backref='devices')
```

---

## 4. Implementation Plan

### Phase 1: Enhance IoTDB Service (2-3 hours)

**Files to Modify:**

1. `Connectivity-Layer/src/services/iotdb.py`

**Tasks:**

- [ ] Add `query_telemetry_data()` method with filtering and pagination
- [ ] Add `aggregate_telemetry_data()` method for aggregations
- [ ] Update `get_device_telemetry()` to use new method (or deprecate)
- [ ] Add comprehensive error handling and logging
- [ ] Write unit tests for new methods

**Test Cases:**

```python
# tests/test_iotdb_service.py
def test_query_telemetry_data_with_filters():
    result = iotdb_service.query_telemetry_data(
        device_id="123",
        user_id="1",
        data_type="temperature",
        start_date=datetime(2025, 1, 15),
        limit=50,
        page=1
    )
    assert "records" in result
    assert "total" in result

def test_aggregate_telemetry_data():
    result = iotdb_service.aggregate_telemetry_data(
        device_id="123",
        user_id="1",
        data_type="temperature",
        aggregation="avg"
    )
    assert "value" in result
    assert "count" in result
```

### Phase 2: Create Authentication Middleware (1-2 hours)

**Files to Create/Modify:**

1. `Connectivity-Layer/src/middleware/auth.py` (create or enhance)

**Tasks:**

- [ ] Implement `verify_api_key_or_jwt()` decorator
- [ ] Add authorization logic (device/user ownership checks)
- [ ] Handle token expiration and errors
- [ ] Write unit tests for authentication

**Test Cases:**

```python
# tests/test_auth_middleware.py
def test_api_key_authentication():
    # Test with valid API key

def test_jwt_authentication():
    # Test with valid JWT token

def test_authorization_device_access():
    # Test device can only access own data

def test_authorization_user_access():
    # Test user can access own devices

def test_admin_access():
    # Test admin can access all devices
```

### Phase 3: Implement New Flask Endpoints (3-4 hours)

**Files to Modify:**

1. `Connectivity-Layer/src/routes/telemetry.py`

**Tasks:**

- [ ] Rename existing `get_device_telemetry()` to `get_device_telemetry_legacy()`
- [ ] Create new `get_device_telemetry_data()` with pagination
- [ ] Create new `get_device_aggregated_data()`
- [ ] Add request validation and error handling
- [ ] Add comprehensive logging
- [ ] Write integration tests

**Test Cases:**

```python
# tests/integration/test_telemetry_api.py
def test_get_telemetry_with_filters():
    response = client.get(
        "/api/v1/telemetry/device/123?data_type=temperature&limit=50&page=1",
        headers={"X-API-Key": "test_key"}
    )
    assert response.status_code == 200
    assert "telemetry" in response.json

def test_get_aggregated_data():
    response = client.get(
        "/api/v1/telemetry/device/123/aggregated?data_type=temperature&aggregation=avg",
        headers={"X-API-Key": "test_key"}
    )
    assert response.status_code == 200
    assert "aggregation" in response.json

def test_unauthorized_access():
    response = client.get("/api/v1/telemetry/device/123")
    assert response.status_code == 401
```

### Phase 4: Update Node.js Frontend (1-2 hours)

**Files to Modify:**

1. `IoTFlow_Dashboard/iotflow-frontend/src/services/api.js` (or equivalent)

**Tasks:**

- [ ] Update telemetry API calls to use Flask backend URL
- [ ] Change base URL from `http://localhost:3001` to `http://localhost:5000` (or unified proxy)
- [ ] Update request/response handling if structure changed
- [ ] Add error handling for Flask API responses
- [ ] Test frontend integration

**Example Changes:**

```javascript
// OLD (Node.js)
const getTelemetryData = async (deviceId, filters) => {
  const response = await axios.get(
    `http://localhost:3001/api/telemetry/${deviceId}`,
    {
      params: filters,
    },
  );
  return response.data;
};

// NEW (Flask)
const getTelemetryData = async (deviceId, filters) => {
  const response = await axios.get(
    `http://localhost:5000/api/v1/telemetry/device/${deviceId}`,
    {
      params: filters,
      headers: {
        Authorization: `Bearer ${getJWTToken()}`, // Add JWT auth
      },
    },
  );
  return response.data;
};
```

### Phase 5: Deprecate Node.js Endpoints (30 minutes)

**Files to Modify:**

1. `IoTFlow_Dashboard/iotflow-backend/src/routes/telemetryRoutes.js`

**Tasks:**

- [ ] Add deprecation warnings to Node.js endpoints
- [ ] Update API documentation
- [ ] (Optional) Proxy requests to Flask for backward compatibility

**Example:**

```javascript
// Deprecation notice
router.get(
  "/:device_id",
  (req, res, next) => {
    console.warn(
      "⚠️ DEPRECATED: Use Flask API at /api/v1/telemetry/device/:id",
    );
    res.set(
      "X-Deprecation-Warning",
      "This endpoint is deprecated. Use Flask API.",
    );
    next();
  },
  TelemetryController.getTelemetryData,
);
```

### Phase 6: Testing & Documentation (2-3 hours)

**Tasks:**

- [ ] Run full test suite (unit + integration)
- [ ] Test end-to-end flow (frontend → Flask → IoTDB)
- [ ] Update API documentation (API_REFERENCE.md)
- [ ] Update architecture diagrams
- [ ] Create migration guide for developers
- [ ] Performance testing (compare Node.js vs Flask)

---

## 5. Technical Specifications

### 5.1 Dependencies

**Flask Backend:**

```python
# requirements.txt (already present)
Flask==2.3.2
iotdb-session==1.2.0  # IoTDB Python client
PyJWT==2.8.0  # For JWT authentication
python-dotenv==1.0.0
SQLAlchemy==2.0.19
```

### 5.2 Environment Variables

```bash
# .env file (Connectivity-Layer/)
IOTDB_HOST=localhost
IOTDB_PORT=6667  # Native session port
IOTDB_USERNAME=root
IOTDB_PASSWORD=root
IOTDB_DATABASE=root.iotflow

JWT_SECRET=your_secret_key_here  # Same as Node.js backend
JWT_ALGORITHM=HS256
```

### 5.3 API Endpoints Summary

| Endpoint                                  | Method | Backend | Status          |
| ----------------------------------------- | ------ | ------- | --------------- |
| `/api/v1/telemetry`                       | POST   | Flask   | ✅ Exists       |
| `/api/v1/telemetry/device/:id`            | GET    | Flask   | 🔄 To Implement |
| `/api/v1/telemetry/device/:id/aggregated` | GET    | Flask   | 🔄 To Implement |
| `/api/v1/telemetry/device/:id/latest`     | GET    | Flask   | ✅ Exists       |
| `/api/telemetry/:id`                      | GET    | Node.js | ⚠️ Deprecate    |
| `/api/telemetry/device/:id/aggregated`    | GET    | Node.js | ⚠️ Deprecate    |

### 5.4 Response Time Targets

| Endpoint                           | Target  | Current (Node.js) |
| ---------------------------------- | ------- | ----------------- |
| GET device telemetry (100 records) | < 200ms | ~150ms            |
| GET aggregated data                | < 100ms | ~80ms             |
| POST telemetry                     | < 50ms  | ~40ms             |

**Expected Improvement:** 10-20% faster due to:

- No inter-service HTTP calls
- Native IoTDB session (vs REST API in Node.js)
- Single Python process

### 5.5 Error Handling

**Standard Error Response:**

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "data_type",
    "issue": "Missing required parameter"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Error Codes:**

- `AUTH_REQUIRED` (401) - No authentication provided
- `AUTH_INVALID` (401) - Invalid API key or token
- `FORBIDDEN` (403) - Insufficient permissions
- `DEVICE_NOT_FOUND` (404) - Device does not exist
- `IOTDB_UNAVAILABLE` (503) - IoTDB service down
- `INVALID_PARAMETERS` (400) - Bad request parameters
- `QUERY_FAILED` (500) - IoTDB query error

---

## 6. Testing Strategy

### 6.1 Unit Tests

**IoTDB Service:**

- [ ] Test `query_telemetry_data()` with all parameter combinations
- [ ] Test `aggregate_telemetry_data()` with all aggregation functions
- [ ] Test error handling (device not found, IoTDB down)
- [ ] Test date parsing and timezone handling
- [ ] Test pagination logic

**Authentication Middleware:**

- [ ] Test API key validation
- [ ] Test JWT token validation
- [ ] Test token expiration
- [ ] Test authorization (ownership checks)
- [ ] Test admin bypass

### 6.2 Integration Tests

**API Endpoints:**

- [ ] Test full request/response cycle
- [ ] Test with real IoTDB instance
- [ ] Test authentication headers
- [ ] Test error responses (404, 401, 403)
- [ ] Test pagination and filtering
- [ ] Test aggregation functions

### 6.3 Performance Tests

**Load Testing:**

```python
# Using locust (already in project)
# File: Connectivity-Layer/locust/telemetry_load_test.py

from locust import HttpUser, task, between

class TelemetryUser(HttpUser):
    wait_time = between(1, 3)

    @task
    def get_telemetry(self):
        self.client.get(
            "/api/v1/telemetry/device/123?limit=100&page=1",
            headers={"X-API-Key": "test_key"}
        )

    @task
    def get_aggregated(self):
        self.client.get(
            "/api/v1/telemetry/device/123/aggregated?data_type=temperature&aggregation=avg",
            headers={"X-API-Key": "test_key"}
        )
```

**Benchmarks:**

- [ ] 100 requests/sec sustained load
- [ ] < 200ms p95 response time
- [ ] < 500ms p99 response time
- [ ] < 1% error rate

### 6.4 Compatibility Tests

**Frontend Integration:**

- [ ] Test React frontend can fetch data
- [ ] Test data visualization (charts)
- [ ] Test real-time updates
- [ ] Test error handling in UI

---

## 7. Migration Checklist

### Pre-Migration

- [ ] Backup current Node.js telemetry routes
- [ ] Backup IoTDB database
- [ ] Document current API usage (log analysis)
- [ ] Set up monitoring for both backends

### Development

- [ ] Implement Phase 1: IoTDB service enhancements
- [ ] Implement Phase 2: Authentication middleware
- [ ] Implement Phase 3: Flask endpoints
- [ ] Write comprehensive tests (80%+ coverage)
- [ ] Code review and approval

### Testing

- [ ] Run unit tests (100% pass)
- [ ] Run integration tests (100% pass)
- [ ] Run performance tests (meet targets)
- [ ] Test frontend integration
- [ ] Test backward compatibility

### Deployment

- [ ] Deploy Flask backend with new endpoints
- [ ] Update frontend to use Flask API
- [ ] Add deprecation warnings to Node.js endpoints
- [ ] Monitor error rates and response times
- [ ] Rollback plan ready

### Post-Migration

- [ ] Monitor production metrics (7 days)
- [ ] Verify zero errors from Flask endpoints
- [ ] Remove Node.js endpoints (after 30 days)
- [ ] Update all documentation
- [ ] Archive old code

---

## 8. Risk Assessment

| Risk                              | Impact | Probability | Mitigation                             |
| --------------------------------- | ------ | ----------- | -------------------------------------- |
| IoTDB data format incompatibility | High   | Low         | Use same data model, extensive testing |
| Authentication breaks frontend    | High   | Medium      | Gradual rollout, keep Node.js proxy    |
| Performance degradation           | Medium | Low         | Load testing before deployment         |
| Data loss during migration        | High   | Very Low    | Read-only migration, no data changes   |
| Frontend breaking changes         | High   | Medium      | API versioning, backward compatibility |

---

## 9. Rollback Plan

**If issues occur after deployment:**

1. **Immediate (< 5 minutes):**
   - Revert frontend to use Node.js API
   - Update environment variable: `TELEMETRY_API_URL=http://localhost:3001`

2. **Short-term (< 1 hour):**
   - Add proxy in Node.js to forward to Flask (already works)
   - Fix Flask issues while Node.js serves traffic

3. **Investigation:**
   - Check Flask logs: `docker logs connectivity-layer`
   - Check IoTDB logs: `docker logs iotdb`
   - Check error rates in monitoring dashboard

**Rollback Criteria:**

- Error rate > 5% for 10 minutes
- Response time p95 > 500ms for 10 minutes
- IoTDB connection failures > 10% for 5 minutes

---

## 10. Success Criteria

**Functional:**

- ✅ All telemetry queries return correct data
- ✅ Pagination works correctly
- ✅ Filtering by data_type works
- ✅ Aggregations return accurate results
- ✅ Authentication prevents unauthorized access
- ✅ Frontend displays data correctly

**Performance:**

- ✅ Response time < 200ms (p95)
- ✅ No increase in error rate
- ✅ Support 100+ requests/sec

**Quality:**

- ✅ Test coverage > 80%
- ✅ Zero critical bugs in production (7 days)
- ✅ API documentation complete
- ✅ Code review approved

**Operational:**

- ✅ Monitoring dashboards updated
- ✅ Alerts configured for Flask API
- ✅ Runbooks updated
- ✅ Team trained on new architecture

---

## 11. Next Steps

1. **Review this document** with the team
2. **Approve architecture** and timeline
3. **Create GitHub issues** for each phase
4. **Set up development environment** (Flask backend locally)
5. **Start Phase 1** - IoTDB service enhancements
6. **Schedule testing** sessions with frontend team
7. **Plan deployment** window (low-traffic period)

---

## 12. Questions & Answers

**Q: Why migrate from Node.js to Flask for telemetry?**  
A: Flask backend already has IoTDB infrastructure. Consolidating read/write operations reduces complexity and improves performance.

**Q: Will this break existing frontend code?**  
A: Minimal impact. API contract remains similar, only URL changes. We'll maintain backward compatibility during transition.

**Q: What about real-time telemetry (WebSockets)?**  
A: Out of scope for this migration. Current implementation uses polling. WebSockets can be added later to Flask using Flask-SocketIO.

**Q: How long will migration take?**  
A: Estimated 2-3 days of development + 1 day testing + 1 day deployment = ~1 week total.

**Q: What if IoTDB goes down during migration?**  
A: IoTDB is already in production. Migration only changes which backend queries it. No downtime required.

---

## Appendix A: File Locations

**Flask Backend (Connectivity-Layer):**

- Routes: `src/routes/telemetry.py`
- Service: `src/services/iotdb.py`
- Config: `src/config/iotdb_config.py`
- Models: `src/models.py`
- Tests: `tests/integration/test_telemetry_api.py`

**Node.js Backend (IoTFlow_Dashboard/iotflow-backend):**

- Routes: `src/routes/telemetryRoutes.js`
- Controller: `src/controllers/telemetryController.js`
- IoTDB Client: `src/utils/iotdbClient.js`
- Tests: `tests/integration/telemetry.test.js`

**Frontend (IoTFlow_Dashboard/iotflow-frontend):**

- API Service: `src/services/api.js`
- Telemetry Components: `src/components/DeviceTelemetry.js`
- Config: `src/config.js`

---

## Appendix B: SQL Query Examples

**Node.js (REST API):**

```sql
-- Get telemetry data
SELECT temperature, humidity
FROM root.iotflow.users.user_1.devices.device_123
WHERE time >= 1705276800000 AND time <= 1705363199999
LIMIT 100 OFFSET 0

-- Get aggregated data
SELECT AVG(temperature) AS value, COUNT(temperature) AS count
FROM root.iotflow.users.user_1.devices.device_123
WHERE time >= 1705276800000 AND time <= 1705363199999
```

**Flask (Native Session):**

```python
# Same SQL, executed via Python session
sql = "SELECT temperature, humidity FROM root.iotflow.users.user_1.devices.device_123 WHERE time >= 1705276800000 LIMIT 100 OFFSET 0"
result_set = session.execute_query_statement(sql)
```

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Author:** GitHub Copilot  
**Status:** DRAFT - Ready for Review
