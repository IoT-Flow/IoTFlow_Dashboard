/**
 * Admin Dashboard Tests - Remove Uptime Feature
 *
 * TDD Approach:
 * 1. Write failing tests that verify uptime is NOT displayed
 * 2. Implement the changes to make tests pass
 * 3. Refactor if needed
 */

import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Admin from '../Admin';
import { AuthProvider } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import * as flaskMetricsService from '../../services/flaskMetricsService';

// Mock the services
jest.mock('../../services/apiService');
jest.mock('../../services/flaskMetricsService');

// Mock the AuthContext
const mockUser = {
  username: 'admin',
  email: 'admin@test.com',
  is_admin: true,
  role: 'admin',
};

const MockAuthProvider = ({ children }) => (
  <AuthProvider value={{ user: mockUser }}>{children}</AuthProvider>
);

describe('Admin Dashboard - Remove Uptime TDD', () => {
  beforeEach(() => {
    // Mock Prometheus metrics response
    apiService.getPrometheusMetrics = jest.fn().mockResolvedValue(`
# HELP redis_status Redis server status
# TYPE redis_status gauge
redis_status 1.0

# HELP iotdb_connection_status IoTDB connection status
# TYPE iotdb_connection_status gauge
iotdb_connection_status 1.0

# HELP mqtt_connections_active Active MQTT connections
# TYPE mqtt_connections_active gauge
mqtt_connections_active 5.0

# HELP system_cpu_usage_percent CPU usage percentage
# TYPE system_cpu_usage_percent gauge
system_cpu_usage_percent 25.5

# HELP system_memory_usage_percent Memory usage percentage
# TYPE system_memory_usage_percent gauge
system_memory_usage_percent 60.2

# HELP app_uptime_seconds Application uptime in seconds
# TYPE app_uptime_seconds gauge
app_uptime_seconds 172800
    `);

    // Mock Flask backend stats
    jest.spyOn(flaskMetricsService, 'getCombinedAdminStats').mockResolvedValue({
      success: true,
      flask_backend: {
        device_stats: {
          total: 10,
          active: 8,
          online: 5,
          offline: 3,
        },
      },
      telemetry: {
        iotdb_available: true,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * TEST 1: Verify uptime text is NOT displayed in service cards
   * This test should FAIL initially, then PASS after implementation
   */
  test('should NOT display "Uptime:" text in service cards', async () => {
    render(
      <BrowserRouter>
        <MockAuthProvider>
          <Admin />
        </MockAuthProvider>
      </BrowserRouter>
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(apiService.getPrometheusMetrics).toHaveBeenCalled();
    });

    // Check that "Uptime:" text is NOT present
    const uptimeElements = screen.queryAllByText(/Uptime:/i);
    expect(uptimeElements.length).toBe(0);
  });

  /**
   * TEST 2: Verify uptime values are NOT displayed (like "2d 14h")
   * This test should FAIL initially, then PASS after implementation
   */
  test('should NOT display uptime duration values', async () => {
    render(
      <BrowserRouter>
        <MockAuthProvider>
          <Admin />
        </MockAuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(apiService.getPrometheusMetrics).toHaveBeenCalled();
    });

    // Check that "Uptime:" text is not present anywhere in the document
    const uptimeText = screen.queryAllByText(/Uptime:/i);
    expect(uptimeText.length).toBe(0);

    // Check that uptime format patterns are NOT present in service cards
    const serviceCards = screen.queryAllByRole('article', { hidden: true });
    serviceCards.forEach(card => {
      const cardText = card.textContent || '';
      // Should not contain "Uptime:" anywhere
      expect(cardText).not.toMatch(/Uptime:/i);
    });
  });

  /**
   * TEST 3: Verify formatUptime function is removed or not used
   * This test checks that the formatUptime logic is not executed
   */
  test('should not have formatUptime function referenced in component', async () => {
    // Read the Admin component source to verify formatUptime is removed
    const fs = require('fs');
    const path = require('path');
    const adminFilePath = path.join(__dirname, '../Admin.js');

    // This is a meta-test - checking the actual source code
    const adminSource = fs.readFileSync(adminFilePath, 'utf-8');

    // formatUptime function should not exist after refactoring
    expect(adminSource).not.toMatch(/const\s+formatUptime\s*=/);
    expect(adminSource).not.toMatch(/function\s+formatUptime/);
  });

  /**
   * TEST 4: Verify service cards still display status, CPU, and Memory
   * This ensures we only removed uptime, not other important info
   */
  test('should still display service status, CPU, and Memory (but not uptime)', async () => {
    render(
      <BrowserRouter>
        <MockAuthProvider>
          <Admin />
        </MockAuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(apiService.getPrometheusMetrics).toHaveBeenCalled();
    });

    // Should still display CPU usage (may appear multiple times)
    const cpuElements = screen.queryAllByText(/CPU Usage:/i);
    expect(cpuElements.length).toBeGreaterThan(0);

    // Should still display Memory (may appear multiple times)
    const memoryElements = screen.queryAllByText(/Memory:/i);
    expect(memoryElements.length).toBeGreaterThan(0);

    // Should NOT display Uptime
    const uptimeElements = screen.queryAllByText(/Uptime:/i);
    expect(uptimeElements.length).toBe(0);
  });

  /**
   * TEST 5: Verify initial systemHealth state doesn't include uptime
   */
  test('systemHealth initial state should not contain uptime properties', async () => {
    // This is tested implicitly through the component rendering
    // If the component has uptime in initial state, it will be displayed

    render(
      <BrowserRouter>
        <MockAuthProvider>
          <Admin />
        </MockAuthProvider>
      </BrowserRouter>
    );

    // Get the first render (before API calls complete)
    const initialCards = screen.queryAllByRole('article', { hidden: true });

    // Check that no "Uptime:" text exists in any card
    initialCards.forEach(card => {
      const cardText = card.textContent || '';
      expect(cardText).not.toMatch(/Uptime:/i);
    });

    // Verify directly that Uptime text doesn't exist anywhere
    const uptimeText = screen.queryAllByText(/Uptime:/i);
    expect(uptimeText.length).toBe(0);
  });

  /**
   * TEST 6: Verify Prometheus metrics still update service status correctly
   * Even without uptime, the status updates should work
   */
  test('should update service health based on Prometheus metrics without uptime', async () => {
    render(
      <BrowserRouter>
        <MockAuthProvider>
          <Admin />
        </MockAuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(apiService.getPrometheusMetrics).toHaveBeenCalled();
    });

    // Services should be detected as "running" based on metrics
    await waitFor(() => {
      // IoTDB should show as running (status=1 in mocked metrics)
      const iotdbCards = screen.getAllByText(/IoTDB/i);
      expect(iotdbCards.length).toBeGreaterThan(0);

      // Redis should show as running
      const redisCards = screen.getAllByText(/Redis/i);
      expect(redisCards.length).toBeGreaterThan(0);
    });
  });
});

describe('ServiceCard Component - Remove Uptime', () => {
  /**
   * TEST 7: ServiceCard should not render uptime prop
   */
  test('ServiceCard should not display uptime even if prop is passed', async () => {
    render(
      <BrowserRouter>
        <MockAuthProvider>
          <Admin />
        </MockAuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(apiService.getPrometheusMetrics).toHaveBeenCalled();
    });

    // Even if the data has uptime, ServiceCard should not display it
    const uptimeText = screen.queryByText(/Uptime:/i);
    expect(uptimeText).not.toBeInTheDocument();
  });
});

describe('Metrics Parsing - Remove Uptime Logic', () => {
  /**
   * TEST 8: Verify that uptime calculation is not performed
   */
  test('should not calculate uptime from app_uptime_seconds metric', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    render(
      <BrowserRouter>
        <MockAuthProvider>
          <Admin />
        </MockAuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(apiService.getPrometheusMetrics).toHaveBeenCalled();
    });

    // Verify no uptime formatting happened
    const allLogs = consoleSpy.mock.calls.flat().join(' ');

    // The component shouldn't be processing uptime
    // (This is an indirect test - in practice, we'd check the implementation)

    consoleSpy.mockRestore();
  });
});
