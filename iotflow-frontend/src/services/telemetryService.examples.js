/**
 * Example: Using Flask Backend Telemetry Service
 *
 * This file demonstrates how to use the telemetry service to interact
 * with the Flask backend for IoTDB telemetry operations.
 */

import React from 'react';
import {
  storeTelemetry,
  getDeviceTelemetry,
  getLatestTelemetry,
  getAggregatedTelemetry,
  deleteTelemetry,
  getTelemetryStatus,
  getUserTelemetry,
} from './telemetryService';

// Example 1: Store telemetry data
export const exampleStoreTelemetry = async deviceApiKey => {
  try {
    const data = {
      temperature: 25.5,
      humidity: 60,
      pressure: 1013.25,
    };

    const metadata = {
      location: 'sensor_room_1',
      unit: 'celsius',
    };

    const response = await storeTelemetry(deviceApiKey, data, metadata, new Date().toISOString());

    console.log('Telemetry stored:', response);
    return response;
  } catch (error) {
    console.error('Error storing telemetry:', error.response?.data || error.message);
    throw error;
  }
};

// Example 2: Get device telemetry with pagination
export const exampleGetDeviceTelemetry = async (deviceApiKey, deviceId) => {
  try {
    const params = {
      data_type: 'temperature',
      start_date: '2025-12-01T00:00:00Z',
      end_date: '2025-12-11T23:59:59Z',
      limit: 100,
      page: 1,
    };

    const response = await getDeviceTelemetry(deviceApiKey, deviceId, params);

    console.log('Device telemetry:', response.telemetry);
    console.log('Pagination:', response.pagination);
    return response;
  } catch (error) {
    console.error('Error getting telemetry:', error.response?.data || error.message);
    throw error;
  }
};

// Example 3: Get latest telemetry
export const exampleGetLatestTelemetry = async (deviceApiKey, deviceId) => {
  try {
    const response = await getLatestTelemetry(deviceApiKey, deviceId);

    console.log('Latest telemetry:', response.latest_data);
    return response;
  } catch (error) {
    console.error('Error getting latest telemetry:', error.response?.data || error.message);
    throw error;
  }
};

// Example 4: Get aggregated telemetry (average temperature)
export const exampleGetAggregatedTelemetry = async (deviceApiKey, deviceId) => {
  try {
    const response = await getAggregatedTelemetry(
      deviceApiKey,
      deviceId,
      'temperature',
      'avg',
      '2025-12-01T00:00:00Z',
      '2025-12-11T23:59:59Z'
    );

    console.log('Aggregated data:', response.aggregation);
    return response;
  } catch (error) {
    console.error('Error getting aggregated telemetry:', error.response?.data || error.message);
    throw error;
  }
};

// Example 5: Delete telemetry data
export const exampleDeleteTelemetry = async (deviceApiKey, deviceId) => {
  try {
    const response = await deleteTelemetry(
      deviceApiKey,
      deviceId,
      '2025-12-01T00:00:00Z',
      '2025-12-01T23:59:59Z'
    );

    console.log('Telemetry deleted:', response);
    return response;
  } catch (error) {
    console.error('Error deleting telemetry:', error.response?.data || error.message);
    throw error;
  }
};

// Example 6: Check telemetry service status
export const exampleGetTelemetryStatus = async () => {
  try {
    const response = await getTelemetryStatus();

    console.log('IoTDB available:', response.iotdb_available);
    console.log('Status:', response.status);
    return response;
  } catch (error) {
    console.error('Error getting status:', error.response?.data || error.message);
    throw error;
  }
};

// Example 7: Get all telemetry for a user
export const exampleGetUserTelemetry = async (deviceApiKey, userId) => {
  try {
    const params = {
      limit: 500,
      start_time: '-24h', // Last 24 hours
    };

    const response = await getUserTelemetry(deviceApiKey, userId, params);

    console.log('User telemetry:', response.telemetry);
    console.log('Total count:', response.total_count);
    return response;
  } catch (error) {
    console.error('Error getting user telemetry:', error.response?.data || error.message);
    throw error;
  }
};

// Example 8: Using in a React component
export const TelemetryComponent = () => {
  const [telemetryData, setTelemetryData] = React.useState(null);
  const deviceApiKey = 'your-device-api-key'; // Get from device object
  const deviceId = 1; // Your device ID

  React.useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const data = await getLatestTelemetry(deviceApiKey, deviceId);
        setTelemetryData(data.latest_data);
      } catch (error) {
        console.error('Failed to fetch telemetry:', error);
      }
    };

    fetchTelemetry();
  }, [deviceApiKey, deviceId]);

  return (
    <div>
      {telemetryData ? (
        <pre>{JSON.stringify(telemetryData, null, 2)}</pre>
      ) : (
        <p>Loading telemetry...</p>
      )}
    </div>
  );
};
