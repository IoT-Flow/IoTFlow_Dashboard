import { flaskApi } from './api';

/**
 * Flask Metrics Service
 * Handles communication with Flask backend for admin statistics and metrics
 */

/**
 * Get system statistics from Flask backend
 * @param {string} adminToken - Admin authentication token
 * @returns {Promise} System statistics including device, auth, and config stats
 */
export const getSystemStats = async adminToken => {
  if (!adminToken) {
    throw new Error('Admin token is required');
  }

  const response = await flaskApi.get('/admin/stats', {
    headers: {
      Authorization: `admin ${adminToken}`,
    },
  });

  return response.data;
};

/**
 * Get detailed device statistics from Flask backend
 * @param {string} adminToken - Admin authentication token
 * @returns {Promise} Detailed device list with statistics
 */
export const getDeviceStats = async adminToken => {
  if (!adminToken) {
    throw new Error('Admin token is required');
  }

  const response = await flaskApi.get('/admin/devices', {
    headers: {
      Authorization: `admin ${adminToken}`,
    },
  });

  return response.data;
};

/**
 * Get telemetry service metrics
 * @returns {Promise} Telemetry service status and metrics
 */
export const getTelemetryMetrics = async () => {
  const response = await flaskApi.get('/telemetry/status');
  return response.data;
};

/**
 * Get specific device details from Flask backend
 * @param {string} adminToken - Admin authentication token
 * @param {number} deviceId - Device ID
 * @returns {Promise} Detailed device information
 */
export const getDeviceDetails = async (adminToken, deviceId) => {
  if (!adminToken) {
    throw new Error('Admin token is required');
  }

  if (!deviceId) {
    throw new Error('Device ID is required');
  }

  const response = await flaskApi.get(`/admin/devices/${deviceId}`, {
    headers: {
      Authorization: `admin ${adminToken}`,
    },
  });

  return response.data;
};

/**
 * Delete a device from Flask backend
 * @param {string} adminToken - Admin authentication token
 * @param {number} deviceId - Device ID to delete
 * @returns {Promise} Deletion status
 */
export const deleteDevice = async (adminToken, deviceId) => {
  if (!adminToken) {
    throw new Error('Admin token is required');
  }

  if (!deviceId) {
    throw new Error('Device ID is required');
  }

  const response = await flaskApi.delete(`/admin/devices/${deviceId}`, {
    headers: {
      Authorization: `admin ${adminToken}`,
    },
  });

  return response.data;
};

/**
 * Get combined admin dashboard stats from both backends
 * @param {string} adminToken - Admin authentication token
 * @returns {Promise} Combined statistics from Flask and Node backends
 */
export const getCombinedAdminStats = async adminToken => {
  try {
    // Fetch both in parallel
    const [systemStats, telemetryMetrics] = await Promise.all([
      getSystemStats(adminToken),
      getTelemetryMetrics(),
    ]);

    return {
      success: true,
      timestamp: systemStats.timestamp,
      flask_backend: {
        device_stats: systemStats.device_stats,
        auth_stats: systemStats.auth_stats,
        config_stats: systemStats.config_stats,
      },
      telemetry: {
        iotdb_available: telemetryMetrics.iotdb_available,
        iotdb_host: telemetryMetrics.iotdb_host,
        iotdb_port: telemetryMetrics.iotdb_port,
        status: telemetryMetrics.status,
      },
    };
  } catch (error) {
    throw new Error(`Failed to get combined stats: ${error.message}`);
  }
};

export default {
  getSystemStats,
  getDeviceStats,
  getTelemetryMetrics,
  getDeviceDetails,
  deleteDevice,
  getCombinedAdminStats,
};
