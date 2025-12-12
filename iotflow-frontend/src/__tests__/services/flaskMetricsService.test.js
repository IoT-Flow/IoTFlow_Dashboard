/**
 * Flask Metrics Service Tests
 * TDD approach: Write tests first, then implement the service
 */

import { flaskApi } from '../../services/api';
import {
  getSystemStats,
  getDeviceStats,
  getTelemetryMetrics,
} from '../../services/flaskMetricsService';

// Mock axios
jest.mock('../../services/api');

describe('Flask Metrics Service - TDD', () => {
  const mockAdminToken = 'test-admin-token-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSystemStats', () => {
    it('should fetch system statistics from Flask backend', async () => {
      // Arrange
      const mockResponse = {
        data: {
          status: 'success',
          timestamp: '2025-12-11T14:30:00Z',
          device_stats: {
            total: 18,
            active: 15,
            inactive: 2,
            maintenance: 1,
            online: 12,
            offline: 3,
          },
          auth_stats: {
            total_records: 20,
            active_records: 18,
          },
          config_stats: {
            total_configs: 45,
            active_configs: 40,
          },
        },
      };

      flaskApi.get.mockResolvedValue(mockResponse);

      // Act
      const result = await getSystemStats(mockAdminToken);

      // Assert
      expect(flaskApi.get).toHaveBeenCalledWith('/admin/stats', {
        headers: {
          Authorization: `admin ${mockAdminToken}`,
        },
      });
      expect(result).toEqual(mockResponse.data);
      expect(result.device_stats.total).toBe(18);
      expect(result.device_stats.online).toBe(12);
    });

    it('should handle errors when fetching system stats', async () => {
      // Arrange
      const mockError = {
        response: {
          data: {
            error: 'Unauthorized',
          },
          status: 401,
        },
      };

      flaskApi.get.mockRejectedValue(mockError);

      // Act & Assert
      await expect(getSystemStats(mockAdminToken)).rejects.toEqual(mockError);
      expect(flaskApi.get).toHaveBeenCalledWith('/admin/stats', {
        headers: {
          Authorization: `admin ${mockAdminToken}`,
        },
      });
    });

    it('should throw error if admin token is missing', async () => {
      // Act & Assert
      await expect(getSystemStats()).rejects.toThrow('Admin token is required');
      expect(flaskApi.get).not.toHaveBeenCalled();
    });
  });

  describe('getDeviceStats', () => {
    it('should fetch detailed device statistics', async () => {
      // Arrange
      const mockResponse = {
        data: {
          status: 'success',
          total_devices: 18,
          devices: [
            {
              id: 1,
              name: 'Test Device',
              status: 'active',
              device_type: 'sensor',
              last_seen: '2025-12-11T14:25:00Z',
              auth_records_count: 1,
              config_count: 3,
            },
          ],
        },
      };

      flaskApi.get.mockResolvedValue(mockResponse);

      // Act
      const result = await getDeviceStats(mockAdminToken);

      // Assert
      expect(flaskApi.get).toHaveBeenCalledWith('/admin/devices', {
        headers: {
          Authorization: `admin ${mockAdminToken}`,
        },
      });
      expect(result).toEqual(mockResponse.data);
      expect(result.total_devices).toBe(18);
      expect(result.devices).toHaveLength(1);
    });

    it('should handle errors when fetching device stats', async () => {
      // Arrange
      const mockError = {
        response: {
          data: {
            error: 'Failed to list devices',
          },
          status: 500,
        },
      };

      flaskApi.get.mockRejectedValue(mockError);

      // Act & Assert
      await expect(getDeviceStats(mockAdminToken)).rejects.toEqual(mockError);
    });
  });

  describe('getTelemetryMetrics', () => {
    it('should fetch telemetry service metrics', async () => {
      // Arrange
      const mockResponse = {
        data: {
          iotdb_available: true,
          iotdb_host: 'localhost',
          iotdb_port: 6667,
          iotdb_database: 'root.iotflow',
          total_devices: 18,
          status: 'healthy',
        },
      };

      flaskApi.get.mockResolvedValue(mockResponse);

      // Act
      const result = await getTelemetryMetrics();

      // Assert
      expect(flaskApi.get).toHaveBeenCalledWith('/telemetry/status');
      expect(result).toEqual(mockResponse.data);
      expect(result.iotdb_available).toBe(true);
      expect(result.status).toBe('healthy');
    });

    it('should handle errors when fetching telemetry metrics', async () => {
      // Arrange
      const mockError = {
        response: {
          data: {
            error: 'Internal server error',
          },
          status: 500,
        },
      };

      flaskApi.get.mockRejectedValue(mockError);

      // Act & Assert
      await expect(getTelemetryMetrics()).rejects.toEqual(mockError);
    });
  });

  describe('Integration scenarios', () => {
    it('should combine stats from multiple endpoints for admin dashboard', async () => {
      // Arrange
      const mockSystemStats = {
        data: {
          status: 'success',
          device_stats: {
            total: 18,
            active: 15,
            online: 12,
          },
        },
      };

      const mockTelemetryMetrics = {
        data: {
          iotdb_available: true,
          status: 'healthy',
        },
      };

      flaskApi.get
        .mockResolvedValueOnce(mockSystemStats)
        .mockResolvedValueOnce(mockTelemetryMetrics);

      // Act
      const systemStats = await getSystemStats(mockAdminToken);
      const telemetryMetrics = await getTelemetryMetrics();

      // Assert
      expect(systemStats.device_stats.total).toBe(18);
      expect(telemetryMetrics.iotdb_available).toBe(true);
    });
  });
});
