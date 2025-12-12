/**
 * Telemetry Service Tests
 * TDD approach: Test Flask backend telemetry API integration
 */

import { flaskApi } from '../../services/api';
import {
  checkTelemetryStatus,
  storeTelemetry,
  getDeviceTelemetry,
  getLatestTelemetry,
  queryTelemetryByTime,
  deleteTelemetry,
  getDeviceTimeSeries,
} from '../../services/telemetryService';

// Mock axios
jest.mock('../../services/api');

describe('Telemetry Service - TDD', () => {
  const mockApiKey = 'test-device-api-key-123';
  const mockDeviceId = 'dev_001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkTelemetryStatus', () => {
    it('should fetch telemetry service health status', async () => {
      // Arrange
      const mockResponse = {
        data: {
          status: 'healthy',
          iotdb_connection: 'connected',
          version: '1.0.0',
          timestamp: '2025-12-11T14:30:00Z',
        },
      };

      flaskApi.get.mockResolvedValue(mockResponse);

      // Act
      const result = await checkTelemetryStatus();

      // Assert
      expect(flaskApi.get).toHaveBeenCalledWith('/telemetry/status');
      expect(result).toEqual(mockResponse.data);
      expect(result.status).toBe('healthy');
      expect(result.iotdb_connection).toBe('connected');
    });

    it('should handle errors when checking telemetry status', async () => {
      // Arrange
      const mockError = new Error('Service unavailable');
      flaskApi.get.mockRejectedValue(mockError);

      // Act & Assert
      await expect(checkTelemetryStatus()).rejects.toThrow('Service unavailable');
    });
  });

  describe('storeTelemetry', () => {
    it('should store telemetry data with valid API key', async () => {
      // Arrange
      const testData = {
        temperature: 25.5,
        humidity: 60,
        pressure: 1013.25,
      };
      const testMetadata = {
        sensor_type: 'DHT22',
        location: 'Room 101',
      };
      const timestamp = Date.now();

      const mockResponse = {
        data: {
          status: 'success',
          message: 'Telemetry data stored successfully',
          device_id: mockDeviceId,
          timestamp: timestamp,
        },
      };

      flaskApi.post.mockResolvedValue(mockResponse);

      // Act
      const result = await storeTelemetry(mockApiKey, testData, testMetadata, timestamp);

      // Assert
      expect(flaskApi.post).toHaveBeenCalledWith(
        '/telemetry',
        {
          data: testData,
          metadata: testMetadata,
          timestamp: timestamp,
        },
        {
          headers: {
            'X-API-Key': mockApiKey,
          },
        }
      );
      expect(result.status).toBe('success');
      expect(result.device_id).toBe(mockDeviceId);
    });

    it('should throw error if API key is missing', async () => {
      // Arrange & Act & Assert
      await expect(storeTelemetry('', { temp: 25 }, {}, Date.now())).rejects.toThrow(
        'API key is required'
      );
    });

    it('should throw error if data is missing', async () => {
      // Arrange & Act & Assert
      await expect(storeTelemetry(mockApiKey, null, {}, Date.now())).rejects.toThrow(
        'Telemetry data is required'
      );
    });

    it('should handle authentication errors', async () => {
      // Arrange
      const mockError = {
        response: {
          status: 401,
          data: { error: 'Invalid API key' },
        },
      };
      flaskApi.post.mockRejectedValue(mockError);

      // Act & Assert
      await expect(storeTelemetry(mockApiKey, { temp: 25 }, {}, Date.now())).rejects.toEqual(
        mockError
      );
    });
  });

  describe('getDeviceTelemetry', () => {
    it('should fetch device telemetry with pagination', async () => {
      // Arrange
      const params = {
        page: 1,
        per_page: 20,
      };

      const mockResponse = {
        data: {
          status: 'success',
          data: [
            {
              timestamp: '2025-12-11T14:30:00Z',
              temperature: 25.5,
              humidity: 60,
            },
            {
              timestamp: '2025-12-11T14:29:00Z',
              temperature: 25.3,
              humidity: 61,
            },
          ],
          pagination: {
            page: 1,
            per_page: 20,
            total: 2,
            pages: 1,
          },
        },
      };

      flaskApi.get.mockResolvedValue(mockResponse);

      // Act
      const result = await getDeviceTelemetry(mockApiKey, mockDeviceId, params);

      // Assert
      expect(flaskApi.get).toHaveBeenCalledWith(`/telemetry/${mockDeviceId}`, {
        headers: { 'X-API-Key': mockApiKey },
        params: params,
      });
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should fetch telemetry with date range filter', async () => {
      // Arrange
      const params = {
        start_date: '2025-12-01',
        end_date: '2025-12-11',
        page: 1,
        per_page: 50,
      };

      const mockResponse = {
        data: {
          status: 'success',
          data: [],
          pagination: { page: 1, per_page: 50, total: 0, pages: 0 },
        },
      };

      flaskApi.get.mockResolvedValue(mockResponse);

      // Act
      const result = await getDeviceTelemetry(mockApiKey, mockDeviceId, params);

      // Assert
      expect(flaskApi.get).toHaveBeenCalledWith(`/telemetry/${mockDeviceId}`, {
        headers: { 'X-API-Key': mockApiKey },
        params: params,
      });
      expect(result.data).toEqual([]);
    });

    it('should throw error if device ID is missing', async () => {
      // Act & Assert
      await expect(getDeviceTelemetry(mockApiKey, '', {})).rejects.toThrow('Device ID is required');
    });
  });

  describe('getLatestTelemetry', () => {
    it('should fetch latest telemetry for a device', async () => {
      // Arrange
      const mockResponse = {
        data: {
          status: 'success',
          device_id: mockDeviceId,
          timestamp: '2025-12-11T14:30:00Z',
          data: {
            temperature: 25.5,
            humidity: 60,
            pressure: 1013.25,
          },
        },
      };

      flaskApi.get.mockResolvedValue(mockResponse);

      // Act
      const result = await getLatestTelemetry(mockApiKey, mockDeviceId);

      // Assert
      expect(flaskApi.get).toHaveBeenCalledWith(`/telemetry/${mockDeviceId}/latest`, {
        headers: { 'X-API-Key': mockApiKey },
      });
      expect(result.device_id).toBe(mockDeviceId);
      expect(result.data.temperature).toBe(25.5);
    });

    it('should handle 404 when no telemetry exists', async () => {
      // Arrange
      const mockError = {
        response: {
          status: 404,
          data: { error: 'No telemetry data found' },
        },
      };
      flaskApi.get.mockRejectedValue(mockError);

      // Act & Assert
      await expect(getLatestTelemetry(mockApiKey, mockDeviceId)).rejects.toEqual(mockError);
    });
  });

  describe('queryTelemetryByTime', () => {
    it('should query telemetry within time range', async () => {
      // Arrange
      const startTime = '2025-12-11T10:00:00Z';
      const endTime = '2025-12-11T14:00:00Z';

      const mockResponse = {
        data: {
          status: 'success',
          device_id: mockDeviceId,
          start_time: startTime,
          end_time: endTime,
          data: [
            { timestamp: '2025-12-11T10:15:00Z', temperature: 24.0 },
            { timestamp: '2025-12-11T12:30:00Z', temperature: 25.5 },
          ],
        },
      };

      flaskApi.get.mockResolvedValue(mockResponse);

      // Act
      const result = await queryTelemetryByTime(mockApiKey, mockDeviceId, startTime, endTime);

      // Assert
      expect(flaskApi.get).toHaveBeenCalledWith(`/telemetry/${mockDeviceId}/query`, {
        headers: { 'X-API-Key': mockApiKey },
        params: {
          start_time: startTime,
          end_time: endTime,
        },
      });
      expect(result.data).toHaveLength(2);
    });

    it('should throw error if time range is invalid', async () => {
      // Act & Assert
      await expect(queryTelemetryByTime(mockApiKey, mockDeviceId, '', '')).rejects.toThrow(
        'Start time and end time are required'
      );
    });
  });

  describe('deleteTelemetry', () => {
    it('should delete telemetry data for a device', async () => {
      // Arrange
      const adminToken = 'admin-token-123';
      const mockResponse = {
        data: {
          status: 'success',
          message: 'Telemetry data deleted',
          device_id: mockDeviceId,
          deleted_count: 150,
        },
      };

      flaskApi.delete.mockResolvedValue(mockResponse);

      // Act
      const result = await deleteTelemetry(adminToken, mockDeviceId);

      // Assert
      expect(flaskApi.delete).toHaveBeenCalledWith(`/telemetry/${mockDeviceId}`, {
        headers: { Authorization: `admin ${adminToken}` },
      });
      expect(result.status).toBe('success');
      expect(result.deleted_count).toBe(150);
    });

    it('should throw error if admin token is missing', async () => {
      // Act & Assert
      await expect(deleteTelemetry('', mockDeviceId)).rejects.toThrow('Admin token is required');
    });

    it('should handle unauthorized deletion attempts', async () => {
      // Arrange
      const mockError = {
        response: {
          status: 403,
          data: { error: 'Insufficient permissions' },
        },
      };
      flaskApi.delete.mockRejectedValue(mockError);

      // Act & Assert
      await expect(deleteTelemetry('invalid-token', mockDeviceId)).rejects.toEqual(mockError);
    });
  });

  describe('getDeviceTimeSeries', () => {
    it('should fetch time series data for specific metrics', async () => {
      // Arrange
      const params = {
        metrics: ['temperature', 'humidity'],
        start_time: '2025-12-11T10:00:00Z',
        end_time: '2025-12-11T14:00:00Z',
        interval: '5m',
      };

      const mockResponse = {
        data: {
          status: 'success',
          device_id: mockDeviceId,
          metrics: {
            temperature: [
              { timestamp: '2025-12-11T10:00:00Z', value: 24.0 },
              { timestamp: '2025-12-11T10:05:00Z', value: 24.2 },
            ],
            humidity: [
              { timestamp: '2025-12-11T10:00:00Z', value: 60 },
              { timestamp: '2025-12-11T10:05:00Z', value: 61 },
            ],
          },
        },
      };

      flaskApi.get.mockResolvedValue(mockResponse);

      // Act
      const result = await getDeviceTimeSeries(mockApiKey, mockDeviceId, params);

      // Assert
      expect(flaskApi.get).toHaveBeenCalledWith(`/telemetry/${mockDeviceId}/timeseries`, {
        headers: { 'X-API-Key': mockApiKey },
        params: params,
      });
      expect(result.metrics.temperature).toHaveLength(2);
      expect(result.metrics.humidity).toHaveLength(2);
    });

    it('should throw error if metrics array is empty', async () => {
      // Act & Assert
      await expect(
        getDeviceTimeSeries(mockApiKey, mockDeviceId, {
          metrics: [],
          start_time: '2025-12-11T10:00:00Z',
          end_time: '2025-12-11T14:00:00Z',
        })
      ).rejects.toThrow('At least one metric is required');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete telemetry workflow', async () => {
      // Step 1: Check status
      const statusResponse = {
        data: { status: 'healthy', iotdb_connection: 'connected' },
      };
      flaskApi.get.mockResolvedValueOnce(statusResponse);

      const status = await checkTelemetryStatus();
      expect(status.status).toBe('healthy');

      // Step 2: Store data
      const storeResponse = {
        data: { status: 'success', device_id: mockDeviceId },
      };
      flaskApi.post.mockResolvedValueOnce(storeResponse);

      const stored = await storeTelemetry(mockApiKey, { temperature: 25.5 }, {}, Date.now());
      expect(stored.status).toBe('success');

      // Step 3: Retrieve latest
      const latestResponse = {
        data: {
          status: 'success',
          device_id: mockDeviceId,
          data: { temperature: 25.5 },
        },
      };
      flaskApi.get.mockResolvedValueOnce(latestResponse);

      const latest = await getLatestTelemetry(mockApiKey, mockDeviceId);
      expect(latest.data.temperature).toBe(25.5);
    });

    it('should handle error recovery in telemetry operations', async () => {
      // Simulate network error on first call
      const networkError = new Error('Network timeout');
      flaskApi.get.mockRejectedValueOnce(networkError);

      await expect(checkTelemetryStatus()).rejects.toThrow('Network timeout');

      // Second call succeeds
      const successResponse = {
        data: { status: 'healthy', iotdb_connection: 'connected' },
      };
      flaskApi.get.mockResolvedValueOnce(successResponse);

      const status = await checkTelemetryStatus();
      expect(status.status).toBe('healthy');
    });
  });
});
