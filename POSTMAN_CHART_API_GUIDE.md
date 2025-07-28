# Postman Chart API Testing Guide

## Base URL
```
http://localhost:3001/api
```

## Authentication

### Step 1: Get Authentication Token

First, you need to authenticate to get a JWT token.

**Method:** POST  
**URL:** `http://localhost:3001/api/users/login`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "admin@iotflow.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@iotflow.com",
    "first_name": null,
    "last_name": null,
    "created_at": "2025-01-XX...",
    "updated_at": "2025-01-XX...",
    "last_login": "2025-01-XX..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Important:** Copy the `token` value from the response. You'll need it for all chart API requests.

---

## Chart API Endpoints

### Step 2: Test Chart Creation

**Method:** POST  
**URL:** `http://localhost:3001/api/charts`  
**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body (JSON) - Basic Line Chart:**
```json
{
  "name": "Temperature Monitoring",
  "title": "Temperature Over Time",
  "description": "Real-time temperature monitoring chart",
  "type": "line",
  "devices": ["device1", "device2"],
  "measurements": ["temperature", "humidity"],
  "timeRange": "1h",
  "refreshInterval": 30,
  "aggregation": "avg",
  "groupBy": "5m",
  "showLegend": true,
  "showGrid": true,
  "animations": true,
  "fillArea": false,
  "lineWidth": 2,
  "aspectRatio": 2,
  "customColors": ["#1976d2", "#ff5722"],
  "backgroundColor": "#ffffff",
  "borderColor": "#1976d2",
  "pointStyle": "circle"
}
```

**Body (JSON) - Gauge Chart:**
```json
{
  "name": "Pressure Gauge",
  "title": "System Pressure",
  "description": "Current system pressure gauge",
  "type": "gauge",
  "devices": ["pressure_sensor_01"],
  "measurements": ["pressure"],
  "timeRange": "5m",
  "refreshInterval": 10,
  "aggregation": "last",
  "showLegend": false,
  "showGrid": false,
  "animations": true,
  "customColors": ["#4caf50", "#ff9800", "#f44336"],
  "backgroundColor": "#ffffff",
  "yAxisMin": 0,
  "yAxisMax": 100
}
```

**Body (JSON) - Pie Chart:**
```json
{
  "name": "Device Status Distribution",
  "title": "Device Status Overview",
  "description": "Distribution of device statuses",
  "type": "pie",
  "devices": ["all"],
  "measurements": ["status"],
  "timeRange": "1h",
  "refreshInterval": 60,
  "aggregation": "count",
  "showLegend": true,
  "animations": true,
  "customColors": ["#4caf50", "#ff9800", "#f44336", "#9c27b0"]
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Temperature Monitoring",
    "title": "Temperature Over Time",
    "description": "Real-time temperature monitoring chart",
    "type": "line",
    "user_id": 1,
    "devices": ["device1", "device2"],
    "measurements": ["temperature", "humidity"],
    "time_range": "1h",
    "refresh_interval": 30,
    "aggregation": "avg",
    "group_by": "5m",
    "appearance_config": {
      "showLegend": true,
      "showGrid": true,
      "animations": true,
      "fillArea": false,
      "lineWidth": 2,
      "aspectRatio": 2,
      "customColors": ["#1976d2", "#ff5722"],
      "backgroundColor": "#ffffff",
      "borderColor": "#1976d2",
      "pointStyle": "circle"
    },
    "created_at": "2025-01-XX...",
    "updated_at": "2025-01-XX..."
  }
}
```

### Step 3: Get All Charts

**Method:** GET  
**URL:** `http://localhost:3001/api/charts`  
**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

### Step 4: Get Specific Chart

**Method:** GET  
**URL:** `http://localhost:3001/api/charts/1`  
**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

### Step 5: Update Chart

**Method:** PUT  
**URL:** `http://localhost:3001/api/charts/1`  
**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body (JSON):**
```json
{
  "name": "Updated Temperature Monitoring",
  "title": "Updated Temperature Over Time",
  "description": "Updated real-time temperature monitoring chart",
  "type": "line",
  "devices": ["device1", "device2", "device3"],
  "measurements": ["temperature", "humidity", "pressure"],
  "timeRange": "2h",
  "refreshInterval": 60,
  "aggregation": "avg",
  "groupBy": "10m",
  "showLegend": true,
  "showGrid": true,
  "animations": true,
  "fillArea": true,
  "lineWidth": 3,
  "customColors": ["#1976d2", "#ff5722", "#4caf50"]
}
```

### Step 6: Duplicate Chart

**Method:** POST  
**URL:** `http://localhost:3001/api/charts/1/duplicate`  
**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

### Step 7: Delete Chart

**Method:** DELETE  
**URL:** `http://localhost:3001/api/charts/1`  
**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## Chart Types Available

1. **line** - Line chart for time series data
2. **bar** - Bar chart for categorical data
3. **area** - Area chart with filled regions
4. **scatter** - Scatter plot for correlation analysis
5. **pie** - Pie chart for proportion display
6. **doughnut** - Doughnut chart variant of pie
7. **gauge** - Gauge chart for single value display
8. **radar** - Radar chart for multi-dimensional data
9. **heatmap** - Heatmap for matrix data visualization
10. **treemap** - Treemap for hierarchical data
11. **sankey** - Sankey diagram for flow visualization
12. **candlestick** - Candlestick chart for financial data
13. **funnel** - Funnel chart for process analysis
14. **waterfall** - Waterfall chart for cumulative effects
15. **parallel** - Parallel coordinates for multi-variate analysis
16. **themeRiver** - Theme river for stacked time series
17. **sunburst** - Sunburst chart for hierarchical data
18. **graph** - Network graph for relationships
19. **liquidFill** - Liquid fill gauge for percentage display

---

## Common Error Responses

### 401 Unauthorized
```json
{
  "message": "Access denied. No token provided."
}
```
**Solution:** Make sure you include the Authorization header with a valid Bearer token.

### 403 Forbidden
```json
{
  "message": "Invalid token."
}
```
**Solution:** Get a new token by logging in again.

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```
**Solution:** Check your request body format and required fields.

### 404 Not Found
```json
{
  "error": "Chart not found"
}
```
**Solution:** Make sure the chart ID exists and belongs to your user.

---

## Tips for Testing

1. **Always authenticate first** - Get a fresh token before testing chart endpoints
2. **Copy the token carefully** - Make sure there are no extra spaces or characters
3. **Use the correct Content-Type** - Always set `Content-Type: application/json` for POST and PUT requests
4. **Check the response** - Look for success indicators and error messages
5. **Test step by step** - Start with creating a chart, then test other operations
6. **Try different chart types** - Test various chart types to ensure compatibility

---

## Environment Setup

Make sure your servers are running:

1. **Backend:** `cd iotflow-backend && npm start` (should run on port 3001)
2. **Frontend:** `cd iotflow-frontend && npm start` (should run on port 3000)

You can also test the backend health at: `http://localhost:3001/api/health`
