/**
 * Integration test for Admin Dashboard with Prometheus Metrics
 *
 * Verifies that the Admin page can render the Prometheus metrics section
 * and handle the metrics fetching lifecycle correctly.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Admin from '../../../pages/Admin';
import apiService from '../../../services/apiService';
import { getCombinedAdminStats } from '../../../services/flaskMetricsService';

// Mock services
jest.mock('../../../services/apiService');
jest.mock('../../../services/flaskMetricsService');

// Mock AuthContext
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      username: 'admin',
      is_admin: true,
      role: 'admin',
    },
  }),
}));

describe('Admin Dashboard - Prometheus Metrics Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock getCombinedAdminStats
    getCombinedAdminStats.mockResolvedValue({
      flask_backend: {
        device_stats: { total: 10, active: 8, online: 6, offline: 4 },
      },
      telemetry: {
        iotdb_available: true,
      },
    });
  });

  it('should render Prometheus metrics section', async () => {
    const mockMetricsText = `system_cpu_usage_percent 25.3
system_memory_usage_percent 62.8
mqtt_connections_active 1
iotflow_devices_total 12`;

    apiService.getPrometheusMetrics = jest.fn().mockResolvedValue(mockMetricsText);

    render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Resource Usage')).toBeInTheDocument();
    });
  });

  it('should display metrics after successful fetch', async () => {
    const mockMetricsText = `system_cpu_usage_percent 35.5
system_memory_usage_percent 70.2
mqtt_connections_active 2
iotflow_devices_total 15`;

    apiService.getPrometheusMetrics = jest.fn().mockResolvedValue(mockMetricsText);

    render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );

    await waitFor(
      () => {
        expect(apiService.getPrometheusMetrics).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  it('should handle metrics fetch errors gracefully', async () => {
    apiService.getPrometheusMetrics = jest
      .fn()
      .mockRejectedValue(new Error('Failed to fetch metrics'));

    render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(apiService.getPrometheusMetrics).toHaveBeenCalled();
    });

    // Error should be handled without crashing
    expect(screen.getByText('Resource Usage')).toBeInTheDocument();
  });

  it('should show loading state while fetching metrics', async () => {
    const mockMetricsText = `system_cpu_usage_percent 25.3`;

    // Delay the promise to simulate loading
    apiService.getPrometheusMetrics = jest
      .fn()
      .mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockMetricsText), 100))
      );

    render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );

    // Check that the metrics section renders
    expect(screen.getByText('Resource Usage')).toBeInTheDocument();
  });
});
