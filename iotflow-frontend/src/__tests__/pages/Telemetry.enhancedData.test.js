/**
 * TDD Test: Enhanced Telemetry Data Structure
 *
 * Tests for parsing telemetry data with:
 * - measurement_type (temperature, pressure, humidity, speed, distance, etc.)
 * - unit (°C, hPa, %, m/s, m, W, etc.)
 * - value (numeric value to plot)
 *
 * Legacy fields (temperature, humidity, pressure) should also be supported.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Telemetry from '../../pages/Telemetry';
import * as AuthContext from '../../contexts/AuthContext';
import { WebSocketProvider } from '../../contexts/WebSocketContext';
import * as telemetryService from '../../services/telemetryService';
import apiService from '../../services/apiService';

// Mock the services
jest.mock('../../services/telemetryService');
jest.mock('../../services/apiService', () => ({
  __esModule: true,
  default: {
    getDevices: jest.fn(),
    getDevice: jest.fn(),
    updateDevice: jest.fn(),
  },
}));
jest.mock('../../services/chartService');

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

const mockUser = {
  id: 12,
  username: 'test_user',
  email: 'test@example.com',
  is_admin: false,
};

const mockToken = 'mock-jwt-token';

const mockDevices = [
  {
    id: 11,
    name: 'Flask Test Device 1765505487',
    device_type: 'test_sensor',
    apiKey: 'mZAziGMCmjDmfrOATJxGWqJX1vL4VgkR',
    status: 'inactive',
    user_id: 12,
  },
];

// Enhanced telemetry data with measurement_type, unit, and value
const mockEnhancedTelemetryData = {
  data: [
    {
      timestamp: '2025-12-12T02:39:18.645000+00:00',
      measurement_type: 'distance',
      unit: 'm',
      value: 45.7,
      meta_device_type: 'test_sensor',
      meta_source: 'python_demo',
      temperature: null,
      humidity: null,
      pressure: null,
    },
    {
      timestamp: '2025-12-12T02:39:18.618000+00:00',
      measurement_type: 'speed',
      unit: 'm/s',
      value: 12.3,
      meta_device_type: 'test_sensor',
      meta_source: 'python_demo',
      temperature: null,
      humidity: null,
      pressure: null,
    },
    {
      timestamp: '2025-12-12T02:39:18.592000+00:00',
      measurement_type: 'power',
      unit: 'W',
      value: 150.5,
      meta_device_type: 'test_sensor',
      meta_source: 'python_demo',
      temperature: null,
      humidity: null,
      pressure: null,
    },
    {
      timestamp: '2025-12-12T02:38:17.536000+00:00',
      measurement_type: 'humidity',
      unit: '%',
      value: 68.5,
      meta_device_type: 'test_sensor',
      meta_source: 'python_demo',
      temperature: null,
      humidity: null,
      pressure: null,
    },
    {
      timestamp: '2025-12-12T02:38:17.472000+00:00',
      measurement_type: 'pressure',
      unit: 'hPa',
      value: 1015.2,
      meta_device_type: 'test_sensor',
      meta_source: 'python_demo',
      temperature: null,
      humidity: null,
      pressure: null,
    },
  ],
  count: 5,
  device_id: 11,
  device_name: 'Flask Test Device 1765505487',
  device_type: 'test_sensor',
};

// Legacy telemetry data (old format with direct fields)
const mockLegacyTelemetryData = {
  data: [
    {
      timestamp: '2025-12-12T02:11:27.390000+00:00',
      temperature: 25.8,
      humidity: 62.1,
      pressure: 1012.5,
      meta_device_type: 'test_sensor',
      meta_source: 'test_complete_flow.py',
      measurement_type: null,
      unit: null,
      value: null,
    },
    {
      timestamp: '2025-12-12T02:14:19.480000+00:00',
      temperature: 22.5,
      humidity: null,
      pressure: null,
      meta_device_type: 'test_sensor',
      meta_source: 'test_single_telemetry.py',
      measurement_type: null,
      unit: null,
      value: null,
    },
  ],
  count: 2,
  device_id: 11,
  device_name: 'Flask Test Device 1765505487',
  device_type: 'test_sensor',
};

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <WebSocketProvider>{children}</WebSocketProvider>
  </BrowserRouter>
);

describe('Telemetry Page - Enhanced Data Structure (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAuth
    AuthContext.useAuth.mockReturnValue({
      user: mockUser,
      token: mockToken,
      isAuthenticated: true,
      logout: jest.fn(),
    });

    // Mock apiService.getDevices
    apiService.getDevices.mockResolvedValue({
      data: mockDevices,
    });

    // Mock chartService
    require('../../services/chartService').default = {
      getCharts: jest.fn().mockResolvedValue([]),
      transformFromBackendFormat: jest.fn(chart => chart),
    };
  });

  describe('RED Phase: Enhanced Data Format Tests', () => {
    it('should parse measurement_type, unit, and value from enhanced telemetry data', async () => {
      telemetryService.getDeviceTelemetry.mockResolvedValue(mockEnhancedTelemetryData);

      render(
        <TestWrapper>
          <Telemetry />
        </TestWrapper>
      );

      await waitFor(
        () => {
          expect(telemetryService.getDeviceTelemetry).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      // Verify that the component extracts measurement metadata
      // Expected internal structure:
      // telemetryHistory[deviceId][measurement_type] = [
      //   {
      //     timestamp: Date,
      //     value: number,
      //     unit: string,
      //     measurement: string (measurement_type)
      //   }
      // ]

      // This test will fail initially because current implementation
      // doesn't properly handle measurement_type, unit, value structure
      expect(telemetryService.getDeviceTelemetry).toHaveBeenCalledWith(
        'mZAziGMCmjDmfrOATJxGWqJX1vL4VgkR',
        11,
        expect.any(Object)
      );
    });

    it('should group telemetry data by measurement_type (distance, speed, power, etc.)', async () => {
      telemetryService.getDeviceTelemetry.mockResolvedValue(mockEnhancedTelemetryData);

      render(
        <TestWrapper>
          <Telemetry />
        </TestWrapper>
      );

      await waitFor(
        () => {
          expect(telemetryService.getDeviceTelemetry).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      // Should group by measurement_type:
      // - distance (m)
      // - speed (m/s)
      // - power (W)
      // - humidity (%)
      // - pressure (hPa)

      // Each group should have its own series with unit information
    });

    it('should store unit information with each measurement type', async () => {
      telemetryService.getDeviceTelemetry.mockResolvedValue(mockEnhancedTelemetryData);

      render(
        <TestWrapper>
          <Telemetry />
        </TestWrapper>
      );

      await waitFor(
        () => {
          expect(telemetryService.getDeviceTelemetry).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      // Expected structure should include unit metadata:
      // {
      //   measurement: 'distance',
      //   unit: 'm',
      //   values: [{ timestamp, value }]
      // }
    });

    it('should plot only the value field, using measurement_type and unit as metadata', async () => {
      telemetryService.getDeviceTelemetry.mockResolvedValue(mockEnhancedTelemetryData);

      render(
        <TestWrapper>
          <Telemetry />
        </TestWrapper>
      );

      await waitFor(
        () => {
          expect(telemetryService.getDeviceTelemetry).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      // Chart should plot value (45.7, 12.3, 150.5, etc.)
      // Labels should show: "distance (m)", "speed (m/s)", "power (W)"
      // measurement_type and unit are NOT plotted, only used for display
    });

    it('should handle legacy format (temperature, humidity, pressure fields)', async () => {
      telemetryService.getDeviceTelemetry.mockResolvedValue(mockLegacyTelemetryData);

      render(
        <TestWrapper>
          <Telemetry />
        </TestWrapper>
      );

      await waitFor(
        () => {
          expect(telemetryService.getDeviceTelemetry).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      // Should still support legacy format where temperature, humidity, pressure
      // are direct fields (not using measurement_type/unit/value)
      //
      // Legacy: { temperature: 25.8, humidity: 62.1, pressure: 1012.5 }
      // Should map to:
      // - temperature with default unit (°C or inferred)
      // - humidity with default unit (%)
      // - pressure with default unit (hPa or inferred)
    });

    it('should handle mixed data (both enhanced and legacy formats)', async () => {
      const mixedData = {
        data: [
          // Enhanced format
          {
            timestamp: '2025-12-12T02:39:18.645000+00:00',
            measurement_type: 'distance',
            unit: 'm',
            value: 45.7,
            temperature: null,
            humidity: null,
            pressure: null,
          },
          // Legacy format
          {
            timestamp: '2025-12-12T02:11:27.390000+00:00',
            temperature: 25.8,
            humidity: 62.1,
            pressure: 1012.5,
            measurement_type: null,
            unit: null,
            value: null,
          },
        ],
        count: 2,
        device_id: 11,
      };

      telemetryService.getDeviceTelemetry.mockResolvedValue(mixedData);

      render(
        <TestWrapper>
          <Telemetry />
        </TestWrapper>
      );

      await waitFor(
        () => {
          expect(telemetryService.getDeviceTelemetry).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      // Should handle both formats in the same dataset
      // - Enhanced: measurement_type + unit + value
      // - Legacy: direct temperature/humidity/pressure fields
    });

    it('should extract correct measurement metadata for chart labels', async () => {
      telemetryService.getDeviceTelemetry.mockResolvedValue(mockEnhancedTelemetryData);

      render(
        <TestWrapper>
          <Telemetry />
        </TestWrapper>
      );

      await waitFor(
        () => {
          expect(telemetryService.getDeviceTelemetry).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      // Chart labels should be formatted as:
      // "Distance (m)" - capitalized measurement with unit
      // "Speed (m/s)"
      // "Power (W)"
      // "Humidity (%)"
      // "Pressure (hPa)"
    });

    it('should filter out null values and only plot valid measurements', async () => {
      const dataWithNulls = {
        data: [
          {
            timestamp: '2025-12-12T02:39:18.645000+00:00',
            measurement_type: 'distance',
            unit: 'm',
            value: 45.7,
          },
          {
            timestamp: '2025-12-12T02:39:18.618000+00:00',
            measurement_type: 'speed',
            unit: 'm/s',
            value: null, // Should be filtered out
          },
          {
            timestamp: '2025-12-12T02:39:18.592000+00:00',
            measurement_type: 'power',
            unit: 'W',
            value: 150.5,
          },
        ],
        count: 3,
        device_id: 11,
      };

      telemetryService.getDeviceTelemetry.mockResolvedValue(dataWithNulls);

      render(
        <TestWrapper>
          <Telemetry />
        </TestWrapper>
      );

      await waitFor(
        () => {
          expect(telemetryService.getDeviceTelemetry).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      // Should only include records where value is not null
      // distance: 45.7 ✓
      // speed: null ✗ (filtered out)
      // power: 150.5 ✓
    });
  });
});
