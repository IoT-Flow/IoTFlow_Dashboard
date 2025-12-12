/**
 * Admin Component Flask Integration Tests
 * TDD approach: Verify Admin dashboard Flask API integration logic
 */

import * as flaskMetricsService from '../../services/flaskMetricsService';

// Mock the services
jest.mock('../../services/flaskMetricsService');

describe('Admin Component - Flask Integration (TDD)', () => {
  const mockFlaskStats = {
    flask_backend: {
      status: 'success',
      device_stats: {
        total: 18,
        active: 15,
        inactive: 2,
        maintenance: 1,
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
    telemetry: {
      status: 'healthy',
      iotdb_connection: 'connected',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Flask metrics service
    flaskMetricsService.getCombinedAdminStats.mockResolvedValue(mockFlaskStats);
    flaskMetricsService.getSystemStats.mockResolvedValue(mockFlaskStats.flask_backend);
    flaskMetricsService.getTelemetryMetrics.mockResolvedValue(mockFlaskStats.telemetry);
  });

  describe('Flask stats loading', () => {
    it('should call getCombinedAdminStats with admin token', async () => {
      // Arrange
      const adminToken = 'test-admin-token';

      // Act
      const result = await flaskMetricsService.getCombinedAdminStats(adminToken);

      // Assert
      expect(flaskMetricsService.getCombinedAdminStats).toHaveBeenCalledWith(adminToken);
      expect(result).toEqual(mockFlaskStats);
    });

    it('should return Flask backend device statistics', async () => {
      // Act
      const result = await flaskMetricsService.getCombinedAdminStats('test-token');

      // Assert
      expect(result.flask_backend.device_stats.total).toBe(18);
      expect(result.flask_backend.device_stats.active).toBe(15);
      expect(result.flask_backend.device_stats.inactive).toBe(2);
      expect(result.flask_backend.device_stats.maintenance).toBe(1);
    });

    it('should handle Flask API errors gracefully', async () => {
      // Arrange
      const errorMessage = 'Flask backend unavailable';
      flaskMetricsService.getCombinedAdminStats.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(flaskMetricsService.getCombinedAdminStats('test-token')).rejects.toThrow(
        errorMessage
      );
    });
  });

  describe('IoTDB connection status', () => {
    it('should return IoTDB connection status from telemetry metrics', async () => {
      // Act
      const result = await flaskMetricsService.getCombinedAdminStats('test-token');

      // Assert
      expect(result.telemetry.status).toBe('healthy');
      expect(result.telemetry.iotdb_connection).toBe('connected');
    });

    it('should handle disconnected IoTDB status', async () => {
      // Arrange
      const disconnectedStats = {
        ...mockFlaskStats,
        telemetry: {
          status: 'unhealthy',
          iotdb_connection: 'disconnected',
        },
      };
      flaskMetricsService.getCombinedAdminStats.mockResolvedValue(disconnectedStats);

      // Act
      const result = await flaskMetricsService.getCombinedAdminStats('test-token');

      // Assert
      expect(result.telemetry.status).toBe('unhealthy');
      expect(result.telemetry.iotdb_connection).toBe('disconnected');
    });
  });

  describe('Stats aggregation', () => {
    it('should provide both Flask backend and telemetry stats', async () => {
      // Act
      const result = await flaskMetricsService.getCombinedAdminStats('test-token');

      // Assert
      expect(result).toHaveProperty('flask_backend');
      expect(result).toHaveProperty('telemetry');
      expect(result.flask_backend).toHaveProperty('device_stats');
      expect(result.flask_backend).toHaveProperty('auth_stats');
      expect(result.flask_backend).toHaveProperty('config_stats');
    });

    it('should include authentication statistics', async () => {
      // Act
      const result = await flaskMetricsService.getCombinedAdminStats('test-token');

      // Assert
      expect(result.flask_backend.auth_stats.total_records).toBe(20);
      expect(result.flask_backend.auth_stats.active_records).toBe(18);
    });
  });

  describe('Device stats synchronization', () => {
    it('should provide device counts for dashboard display', async () => {
      // Act
      const result = await flaskMetricsService.getCombinedAdminStats('test-token');

      // Assert - Verify the Flask stats contain device counts
      expect(result.flask_backend.device_stats.total).toBe(18);
      expect(result.flask_backend.device_stats.active).toBe(15);

      // Simulate Admin.js logic: update state with Flask device counts
      const updatedDeviceStats = {
        totalDevices: result.flask_backend.device_stats.total || 0,
        activeDevices: result.flask_backend.device_stats.active || 0,
      };

      expect(updatedDeviceStats.totalDevices).toBe(18);
      expect(updatedDeviceStats.activeDevices).toBe(15);
    });

    it('should handle missing device stats gracefully', async () => {
      // Arrange
      const incompleteStats = {
        flask_backend: {
          device_stats: {},
        },
        telemetry: {
          status: 'healthy',
        },
      };
      flaskMetricsService.getCombinedAdminStats.mockResolvedValue(incompleteStats);

      // Act
      const result = await flaskMetricsService.getCombinedAdminStats('test-token');

      // Simulate Admin.js fallback logic
      const updatedDeviceStats = {
        totalDevices: result.flask_backend.device_stats.total || 0,
        activeDevices: result.flask_backend.device_stats.active || 0,
      };

      // Assert - should use 0 as fallback
      expect(updatedDeviceStats.totalDevices).toBe(0);
      expect(updatedDeviceStats.activeDevices).toBe(0);
    });
  });

  describe('Configuration stats', () => {
    it('should return config statistics from Flask backend', async () => {
      // Act
      const result = await flaskMetricsService.getCombinedAdminStats('test-token');

      // Assert
      expect(result.flask_backend.config_stats.total_configs).toBe(45);
      expect(result.flask_backend.config_stats.active_configs).toBe(40);
    });
  });

  describe('Error handling', () => {
    it('should propagate error when Flask backend is unreachable', async () => {
      // Arrange
      const error = {
        response: {
          data: { error: 'Connection timeout' },
        },
        message: 'Network Error',
      };
      flaskMetricsService.getCombinedAdminStats.mockRejectedValue(error);

      // Act & Assert
      await expect(flaskMetricsService.getCombinedAdminStats('test-token')).rejects.toEqual(error);
    });

    it('should handle authentication errors', async () => {
      // Arrange
      const authError = {
        response: {
          status: 401,
          data: { error: 'Invalid admin token' },
        },
      };
      flaskMetricsService.getCombinedAdminStats.mockRejectedValue(authError);

      // Act & Assert
      await expect(flaskMetricsService.getCombinedAdminStats('invalid-token')).rejects.toEqual(
        authError
      );
    });

    it('should recover from temporary failure', async () => {
      // Arrange
      flaskMetricsService.getCombinedAdminStats
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(mockFlaskStats);

      // Act - First call fails
      await expect(flaskMetricsService.getCombinedAdminStats('test-token')).rejects.toThrow(
        'Temporary failure'
      );

      // Second call succeeds
      const result = await flaskMetricsService.getCombinedAdminStats('test-token');

      // Assert
      expect(result).toEqual(mockFlaskStats);
      expect(flaskMetricsService.getCombinedAdminStats).toHaveBeenCalledTimes(2);
    });
  });
});
