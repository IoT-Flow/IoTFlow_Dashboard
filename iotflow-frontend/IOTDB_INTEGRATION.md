# IoTDB Telemetry Integration - Device Dashboard

This document describes the IoTDB telemetry integration implemented in the IoTFlow Dashboard device management system.

## Overview

The IoTFlow Dashboard now integrates with IoTDB (Internet of Things Database) to display real-time telemetry data from connected IoT devices. This integration provides live monitoring capabilities with historical data analysis.

## Features Implemented

### 🔄 Real-time Telemetry Display
- **Live Device Data**: Real-time telemetry values displayed directly in the device table
- **Auto-refresh**: Telemetry data automatically refreshes every 30 seconds
- **Device-specific Metrics**: Shows relevant telemetry based on device type
- **Last Updated Timestamps**: Displays when each device last sent data

### 📊 Telemetry Data Types

#### Temperature Sensors
- Temperature readings (°C)
- Humidity levels (%)
- Last measurement timestamp

#### Pressure Sensors
- Atmospheric pressure (hPa)
- Pressure trend analysis
- Real-time monitoring

#### Smart Controllers
- **LED Controllers**: Power status, brightness levels, color information
- **Door Locks**: Lock/unlock status, battery levels
- **Fans**: Power status, speed levels
- **Pumps**: Power status, flow rates, pressure readings

#### Environmental Sensors
- Multi-parameter environmental monitoring
- Gas concentration levels
- Air quality metrics

### 📈 Message Analytics
- **24-hour Message Count**: Shows total messages received in the last 24 hours
- **Message Frequency**: Calculated based on device type and usage patterns
- **Historical Tracking**: Tracks message patterns over time

### 🎛️ Interactive Controls
- **Manual Refresh**: Force refresh telemetry data
- **Real-time Status**: Visual indicators showing data sync status
- **Device Statistics**: Summary of active devices and total messages

## Technical Implementation

### API Service Integration

#### New Methods Added:
```javascript
// Get real-time telemetry data
await apiService.getDeviceTelemetryData(deviceId, dataTypes, timeRange)

// Get latest telemetry for all devices
await apiService.getLatestTelemetryData()

// Get device message statistics
await apiService.getDeviceMessageCount(deviceId, timeRange)

// Get aggregated telemetry statistics
await apiService.getDeviceTelemetryStats(deviceId, timeRange)

// Execute custom IoTDB queries
await apiService.queryIoTDB(query, params)
```

### Data Flow Architecture

```
IoT Devices → MQTT Broker → IoTDB Database → REST API → Dashboard
                ↓
        Real-time WebSocket → Live Updates
```

### Demo Mode Implementation

When IoTDB backend is not available, the system provides:
- **Realistic Demo Data**: Simulated telemetry data with realistic patterns
- **Time-based Variations**: Temperature/humidity cycles based on time of day
- **Device-specific Patterns**: Different data patterns for different device types
- **Message Count Simulation**: Realistic message frequencies based on device type

## User Interface Enhancements

### Device Table Updates
- **Latest Telemetry Column**: Shows current device readings
- **Enhanced Status Display**: Visual status indicators with data freshness
- **Message Count Display**: 24-hour message statistics
- **Real-time Indicators**: Loading spinners during data refresh

### Header Statistics
- **Active Device Count**: Number of devices currently reporting
- **Total Messages**: Aggregated message count across all devices
- **Sync Status**: Real-time data synchronization indicators

### Interactive Features
- **Refresh Button**: Manual telemetry data refresh
- **Auto-refresh**: Configurable automatic data updates
- **Loading States**: Visual feedback during data loading

## Device Type Mappings

### Sensor Devices
| Device Type | Telemetry Data | Update Frequency |
|-------------|----------------|------------------|
| Temperature | temp, humidity | 1 minute |
| Pressure | pressure | 2 minutes |
| Motion | detection, battery | On event |
| Light | lux, spectrum | 1 minute |
| Air Quality | CO2, PM2.5, VOC | 5 minutes |

### Control Devices
| Device Type | Telemetry Data | Update Frequency |
|-------------|----------------|------------------|
| LED | power, brightness, color | 5 minutes |
| Door Lock | status, battery | 10 minutes |
| Fan | power, speed | 3 minutes |
| Pump | power, flow_rate, pressure | 30 seconds |
| Thermostat | temp, set_point, mode | 2 minutes |

## Configuration

### Environment Variables
```env
# IoTDB Connection
REACT_APP_API_URL=http://localhost:3001
REACT_APP_IOTDB_ENDPOINT=http://localhost:8181

# Telemetry Settings
REACT_APP_TELEMETRY_REFRESH_INTERVAL=30000
REACT_APP_MAX_TELEMETRY_POINTS=1000
```

### Auto-refresh Configuration
- **Default Interval**: 30 seconds
- **Configurable**: Can be adjusted per user preference
- **Pause/Resume**: Manual control over auto-refresh

## Error Handling

### Graceful Degradation
- **API Unavailable**: Falls back to demo data generation
- **Network Issues**: Displays last known data with indicators
- **Device Offline**: Shows appropriate status messages
- **Data Corruption**: Validates and sanitizes telemetry data

### Error States
- **No Data Available**: Clear messaging when devices haven't reported
- **Connection Issues**: Network status indicators
- **Outdated Data**: Timestamps show data freshness

## Performance Optimizations

### Data Loading
- **Batch Requests**: Loads telemetry for multiple devices efficiently
- **Caching**: Reduces redundant API calls
- **Pagination**: Handles large device collections
- **Lazy Loading**: Loads telemetry data as needed

### Real-time Updates
- **Efficient Polling**: Optimized refresh intervals
- **Selective Updates**: Only updates changed data
- **Background Processing**: Non-blocking data refreshes

## Future Enhancements

### Planned Features
- **Real-time WebSocket Integration**: Live telemetry streaming
- **Historical Data Visualization**: Charts and graphs
- **Alert Thresholds**: Configurable telemetry alerts
- **Data Export**: CSV/JSON export of telemetry data
- **Custom Dashboards**: User-configurable telemetry displays

### IoTDB Advanced Features
- **Custom Queries**: SQL-like queries for complex data analysis
- **Aggregation Functions**: Advanced statistical analysis
- **Time Series Analysis**: Trend detection and forecasting
- **Data Retention Policies**: Configurable data lifecycle management

## Usage Instructions

### Viewing Telemetry Data
1. Navigate to the **Device Management** page
2. Telemetry data appears in the **Latest Telemetry** column
3. Use the **Refresh Data** button to update manually
4. Check the header for overall statistics

### Understanding Display Format
- **Temperature**: `23.5°C | 65%` (temperature | humidity)
- **LED Controller**: `ON | 85%` (power status | brightness)
- **Door Lock**: `🔒 Locked | 78%` (lock status | battery)
- **Pump**: `ON | 45.2 L/min` (power status | flow rate)

### Troubleshooting
- **No Data**: Check device connection and IoTDB service
- **Outdated Data**: Verify device is online and transmitting
- **Loading Issues**: Use manual refresh or check network connection

This integration transforms the device management page from a static list into a dynamic, real-time monitoring dashboard that provides immediate insights into device performance and telemetry data.
