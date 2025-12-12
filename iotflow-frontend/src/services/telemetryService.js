import { flaskApi } from './api';

/**
 * Telemetry Service
 * Handles communication with Flask backend for telemetry operations
 */

/**
 * Check telemetry service health status
 * @returns {Promise} Service status information
 */
export const checkTelemetryStatus = async () => {
  const response = await flaskApi.get('/telemetry/status');
  return response.data;
};

/**
 * Store telemetry data for a device
 * @param {string} apiKey - Device API key
 * @param {object} data - Telemetry data object
 * @param {object} metadata - Optional metadata
 * @param {number} timestamp - Optional timestamp
 * @returns {Promise} Response with success status
 */
export const storeTelemetry = async (apiKey, data, metadata = {}, timestamp = null) => {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  if (!data) {
    throw new Error('Telemetry data is required');
  }

  const payload = {
    data,
    metadata,
  };

  if (timestamp) {
    payload.timestamp = timestamp;
  }

  const response = await flaskApi.post('/telemetry', payload, {
    headers: {
      'X-API-Key': apiKey,
    },
  });

  return response.data;
};

/**
 * Get telemetry data for a device
 * @param {string} apiKey - Device API key
 * @param {string} deviceId - Device ID
 * @param {object} params - Query parameters (page, per_page, start_date, end_date)
 * @returns {Promise} Telemetry data with pagination
 */
export const getDeviceTelemetry = async (apiKey, deviceId, params = {}) => {
  if (!deviceId) {
    throw new Error('Device ID is required');
  }

  const response = await flaskApi.get(`/telemetry/${deviceId}`, {
    headers: {
      'X-API-Key': apiKey,
    },
    params,
  });

  return response.data;
};

/**
 * Get latest telemetry data for a device
 * @param {string} apiKey - Device API key
 * @param {string} deviceId - Device ID
 * @returns {Promise} Latest telemetry data
 */
export const getLatestTelemetry = async (apiKey, deviceId) => {
  if (!deviceId) {
    throw new Error('Device ID is required');
  }

  const response = await flaskApi.get(`/telemetry/${deviceId}/latest`, {
    headers: {
      'X-API-Key': apiKey,
    },
  });

  return response.data;
};

/**
 * Query telemetry data within a time range
 * @param {string} apiKey - Device API key
 * @param {string} deviceId - Device ID
 * @param {string} startTime - Start time (ISO 8601)
 * @param {string} endTime - End time (ISO 8601)
 * @returns {Promise} Telemetry data within time range
 */
export const queryTelemetryByTime = async (apiKey, deviceId, startTime, endTime) => {
  if (!startTime || !endTime) {
    throw new Error('Start time and end time are required');
  }

  const response = await flaskApi.get(`/telemetry/${deviceId}/query`, {
    headers: {
      'X-API-Key': apiKey,
    },
    params: {
      start_time: startTime,
      end_time: endTime,
    },
  });

  return response.data;
};

/**
 * Delete telemetry data for a device
 * @param {string} adminToken - Admin token for authorization
 * @param {string} deviceId - Device ID
 * @returns {Promise} Deletion status
 */
export const deleteTelemetry = async (adminToken, deviceId) => {
  if (!adminToken) {
    throw new Error('Admin token is required');
  }

  if (!deviceId) {
    throw new Error('Device ID is required');
  }

  const response = await flaskApi.delete(`/telemetry/${deviceId}`, {
    headers: {
      Authorization: `admin ${adminToken}`,
    },
  });

  return response.data;
};

/**
 * Get device time series data for specific metrics
 * @param {string} apiKey - Device API key
 * @param {string} deviceId - Device ID
 * @param {object} params - Parameters (metrics array, start_time, end_time, interval)
 * @returns {Promise} Time series data
 */
export const getDeviceTimeSeries = async (apiKey, deviceId, params = {}) => {
  if (!params.metrics || params.metrics.length === 0) {
    throw new Error('At least one metric is required');
  }

  const response = await flaskApi.get(`/telemetry/${deviceId}/timeseries`, {
    headers: {
      'X-API-Key': apiKey,
    },
    params,
  });

  return response.data;
};

/**
 * Get telemetry data for all devices of a user
 * @param {string} apiKey - Device API key (from any device owned by the user)
 * @param {number} userId - User ID
 * @param {object} params - Query parameters (limit, start_time, end_time)
 * @returns {Promise} User telemetry data
 */
export const getUserTelemetry = async (apiKey, userId, params = {}) => {
  const response = await flaskApi.get(`/telemetry/user/${userId}`, {
    headers: {
      'X-API-Key': apiKey,
    },
    params,
  });

  return response.data;
};

export default {
  checkTelemetryStatus,
  storeTelemetry,
  getDeviceTelemetry,
  getLatestTelemetry,
  queryTelemetryByTime,
  deleteTelemetry,
  getDeviceTimeSeries,
  getUserTelemetry,
};
