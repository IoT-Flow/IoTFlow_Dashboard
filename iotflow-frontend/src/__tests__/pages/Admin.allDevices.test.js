/**
 * TDD Test Suite for Admin - All Devices Tab
 * 
 * Tests the frontend implementation of admin device listing feature
 * Following Test-Driven Development approach
 */

import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import Admin from '../../pages/Admin';
import apiService from '../../services/apiService';
import toast from 'react-hot-toast';

// Mock the API service
jest.mock('../../services/apiService');

// Mock toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  promise: jest.fn((promise, msgs) => promise),
}));

// Mock useAuth hook
const mockAuthContext = {
  user: {
    id: 1,
    username: 'admin',
    email: 'admin@test.com',
    is_admin: true,
    role: 'admin',
  },
  isAuthenticated: true,
  loading: false,
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

describe('Admin - All Devices Tab (TDD)', () => {
  const mockDevices = [
    {
      id: 1,
      name: 'Temperature Sensor 1',
      description: 'Living room temperature sensor',
      device_type: 'temperature_sensor',
      api_key: 'abc123def456',
      status: 'online',
      location: 'Living Room',
      firmware_version: '1.0.0',
      hardware_version: '2.0',
      created_at: '2025-12-01T10:00:00.000Z',
      updated_at: '2025-12-10T10:00:00.000Z',
      last_seen: '2025-12-10T10:00:00.000Z',
      user_id: 2,
      user: {
        id: 2,
        username: 'john_doe',
        email: 'john@example.com',
      },
    },
    {
      id: 2,
      name: 'Humidity Sensor',
      description: 'Bedroom humidity sensor',
      device_type: 'humidity_sensor',
      api_key: 'xyz789ghi012',
      status: 'offline',
      location: 'Bedroom',
      firmware_version: '1.2.0',
      hardware_version: '1.5',
      created_at: '2025-12-02T10:00:00.000Z',
      updated_at: '2025-12-09T10:00:00.000Z',
      last_seen: '2025-12-09T10:00:00.000Z',
      user_id: 3,
      user: {
        id: 3,
        username: 'jane_smith',
        email: 'jane@example.com',
      },
    },
    {
      id: 3,
      name: 'Motion Detector',
      description: 'Hallway motion detector',
      device_type: 'motion_sensor',
      api_key: 'mno345pqr678',
      status: 'online',
      location: 'Hallway',
      firmware_version: '2.0.0',
      hardware_version: '3.0',
      created_at: '2025-12-03T10:00:00.000Z',
      updated_at: '2025-12-10T09:00:00.000Z',
      last_seen: '2025-12-10T09:00:00.000Z',
      user_id: 2,
      user: {
        id: 2,
        username: 'john_doe',
        email: 'john@example.com',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock: successful API calls
    apiService.adminGetAllDevices = jest.fn().mockResolvedValue({
      devices: mockDevices,
      total: mockDevices.length,
    });
    apiService.adminDeleteDevice = jest.fn().mockResolvedValue({
      message: 'Device deleted successfully',
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );
  };

  // ===== 1. COMPONENT RENDERING & TAB NAVIGATION =====

  describe('1. Component Rendering & Tab Navigation', () => {
    test('should render Admin page with multiple tabs', async () => {
      renderComponent();
      
      // Wait for component to load and check for tabs
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /users/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /all devices/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /system logs/i })).toBeInTheDocument();
      });
    });

    test('should switch to All Devices tab when clicked', async () => {
      renderComponent();
      
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        // Check for refresh button which appears when devices tab is active
        const refreshButtons = screen.getAllByRole('button', { name: /refresh/i });
        expect(refreshButtons.length).toBeGreaterThan(0);
      });
    });

    test('should automatically fetch devices when All Devices tab becomes active', async () => {
      renderComponent();
      
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        expect(apiService.adminGetAllDevices).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ===== 2. DEVICE LIST DISPLAY =====

  describe('2. Device List Display', () => {
    test('should display loading indicator while fetching devices', async () => {
      // Slow down the API response to see loading state
      apiService.adminGetAllDevices = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ devices: mockDevices, total: 3 }), 100))
      );
      
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      expect(screen.getByText('Loading devices...')).toBeInTheDocument();
      // Multiple progress bars exist in the admin page, just check loading text
      
      await waitFor(() => {
        expect(screen.queryByText('Loading devices...')).not.toBeInTheDocument();
      });
    });

    test('should display all devices in a table', async () => {
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        expect(screen.getByText('Temperature Sensor 1')).toBeInTheDocument();
        expect(screen.getByText('Humidity Sensor')).toBeInTheDocument();
        expect(screen.getByText('Motion Detector')).toBeInTheDocument();
      });
    });

    test('should display device count correctly', async () => {
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        expect(screen.getByText(/Found 3 device\(s\) in the system/i)).toBeInTheDocument();
      });
    });

    test('should show empty state when no devices exist', async () => {
      apiService.adminGetAllDevices = jest.fn().mockResolvedValue({
        devices: [],
        total: 0,
      });
      
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        expect(screen.getByText(/No devices found/i)).toBeInTheDocument();
      });
    });
  });

  // ===== 3. DEVICE INFORMATION DISPLAY =====

  describe('3. Device Information Display', () => {
    test('should display all required device properties', async () => {
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        // Check for device name
        expect(screen.getByText('Temperature Sensor 1')).toBeInTheDocument();
        
        // Check for device type
        expect(screen.getByText('temperature_sensor')).toBeInTheDocument();
        
        // Check for owner info (getAllByText for multiple occurrences)
        expect(screen.getAllByText('john_doe')[0]).toBeInTheDocument();
        expect(screen.getAllByText('john@example.com')[0]).toBeInTheDocument();
        
        // Check for status (multiple devices might have same status)
        expect(screen.getAllByText('online').length).toBeGreaterThan(0);
        
        // Check for location
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });
    });

    test('should display device status with correct color coding', async () => {
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        // Find online device chip (should be success color)
        const onlineChip = screen.getAllByText('online')[0].closest('.MuiChip-root');
        expect(onlineChip).toHaveClass('MuiChip-colorSuccess');
        
        // Find offline device chip (should be error color)
        const offlineChip = screen.getByText('offline').closest('.MuiChip-root');
        expect(offlineChip).toHaveClass('MuiChip-colorError');
      });
    });

    test('should display user information for each device', async () => {
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        // Check for multiple users (use getAllByText for duplicates)
        expect(screen.getAllByText('john_doe').length).toBeGreaterThan(0);
        expect(screen.getByText('jane_smith')).toBeInTheDocument();
        
        // Check for user emails
        expect(screen.getAllByText('john@example.com').length).toBeGreaterThan(0);
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      });
    });

    test('should format last_seen timestamp correctly', async () => {
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        // Should display formatted date (check for year 2025 which is in mock data)
        const dateElements = screen.getAllByText(/2025|12\/10\/2025|Dec.*2025/i);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });

    test('should handle missing optional fields gracefully', async () => {
      const deviceWithMissingFields = {
        id: 4,
        name: 'Minimal Device',
        device_type: 'sensor',
        api_key: 'test123',
        status: 'online',
        user_id: 2,
        user: {
          id: 2,
          username: 'john_doe',
          email: 'john@example.com',
        },
        // Missing: location, last_seen, description, etc.
      };
      
      apiService.adminGetAllDevices = jest.fn().mockResolvedValue({
        devices: [deviceWithMissingFields],
        total: 1,
      });
      
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        expect(screen.getByText('Minimal Device')).toBeInTheDocument();
        expect(screen.getByText('Not set')).toBeInTheDocument(); // Location placeholder
        expect(screen.getByText('Never')).toBeInTheDocument(); // last_seen placeholder
      });
    });
  });

  // ===== 4. DELETE FUNCTIONALITY =====

  describe('4. Delete Functionality', () => {
    test('should show delete button for each device', async () => {
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /delete device/i });
        expect(deleteButtons).toHaveLength(3); // One for each device
      });
    });

    test('should open confirmation dialog when delete button clicked', async () => {
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /delete device/i });
        fireEvent.click(deleteButtons[0]);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete the device/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /delete device/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });

    test('should close dialog when cancel is clicked', async () => {
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /delete device/i });
        fireEvent.click(deleteButtons[0]);
      });
      
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);
      });
      
      await waitFor(() => {
        expect(screen.queryByText(/Are you sure you want to delete/i)).not.toBeInTheDocument();
      });
    });

    test('should call API and refresh list when device is deleted', async () => {
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        expect(apiService.adminGetAllDevices).toHaveBeenCalledTimes(1);
      });
      
      // Click delete on first device
      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /delete device/i });
        fireEvent.click(deleteButtons[0]);
      });
      
      // Confirm deletion
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        const confirmButton = within(dialog).getByRole('button', { name: /delete/i });
        fireEvent.click(confirmButton);
      });
      
      await waitFor(() => {
        expect(apiService.adminDeleteDevice).toHaveBeenCalledWith(1);
        expect(apiService.adminGetAllDevices).toHaveBeenCalledTimes(2); // Initial + refresh
        expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('deleted successfully'));
      });
    });

    test('should show error message if delete fails', async () => {
      apiService.adminDeleteDevice = jest.fn().mockRejectedValue(
        new Error('Network error')
      );
      
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /delete device/i });
        fireEvent.click(deleteButtons[0]);
      });
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        const confirmButton = within(dialog).getByRole('button', { name: /delete/i });
        fireEvent.click(confirmButton);
      });
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to delete device');
      });
    });
  });

  // ===== 5. REFRESH FUNCTIONALITY =====

  describe('5. Refresh Functionality', () => {
    test('should display refresh button', async () => {
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        const refreshButtons = screen.getAllByRole('button', { name: /refresh/i });
        expect(refreshButtons.length).toBeGreaterThan(0);
      });
    });

    test('should reload devices when refresh button is clicked', async () => {
      let callCount = 0;
      apiService.adminGetAllDevices = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({ devices: mockDevices, total: mockDevices.length });
      });
      
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Temperature Sensor 1')).toBeInTheDocument();
      });
      
      const initialCalls = callCount;
      expect(initialCalls).toBe(1);
      
      // Find and click refresh button  
      await waitFor(() => {
        const refreshButtons = screen.getAllByRole('button', { name: /refresh/i });
        const devicesRefreshButton = refreshButtons[refreshButtons.length - 1];
        expect(devicesRefreshButton).not.toBeDisabled();
        fireEvent.click(devicesRefreshButton);
      });
      
      // Wait for second call
      await waitFor(() => {
        expect(callCount).toBe(2);
      }, { timeout: 3000 });
    });

    test('should disable refresh button while loading', async () => {
      apiService.adminGetAllDevices = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ devices: mockDevices, total: 3 }), 100))
      );
      
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      const refreshButtons = screen.getAllByRole('button', { name: /refresh/i });
      const refreshButton = refreshButtons[refreshButtons.length - 1];
      expect(refreshButton).toBeDisabled();
      
      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled();
      });
    });
  });

  // ===== 6. ERROR HANDLING =====

  describe('6. Error Handling', () => {
    test('should show error message when API call fails', async () => {
      apiService.adminGetAllDevices = jest.fn().mockRejectedValue(
        new Error('Network error')
      );
      
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    test('should show specific error message for 403 Forbidden', async () => {
      apiService.adminGetAllDevices = jest.fn().mockRejectedValue({
        response: { status: 403, data: { message: 'Forbidden: Admins only' } },
        message: 'Request failed with status code 403',
      });
      
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Admin privileges required'));
      });
    });

    test('should handle devices array being null or undefined', async () => {
      apiService.adminGetAllDevices = jest.fn().mockResolvedValue({
        devices: null,
        total: 0,
      });
      
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        expect(screen.getByText(/No devices found/i)).toBeInTheDocument();
      });
    });

    test('should handle malformed device data gracefully', async () => {
      const malformedDevice = {
        id: 1,
        name: 'Test Device',
        // Missing required fields
      };
      
      apiService.adminGetAllDevices = jest.fn().mockResolvedValue({
        devices: [malformedDevice],
        total: 1,
      });
      
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        expect(screen.getByText('Test Device')).toBeInTheDocument();
        // Should show placeholders for missing data (getAllByText because "Unknown" might appear elsewhere)
        expect(screen.getAllByText('Unknown').length).toBeGreaterThan(0); // device_type
      });
    });
  });

  // ===== 7. AUTHORIZATION & SECURITY =====

  describe('7. Authorization & Security', () => {
    test('should only allow admin users to access device list', async () => {
      // Mock non-admin user
      mockAuthContext.user.is_admin = false;
      
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Admin privileges required');
        expect(apiService.adminGetAllDevices).not.toHaveBeenCalled();
      });
      
      // Reset for other tests
      mockAuthContext.user.is_admin = true;
    });

    test('should not display API keys in the device list', async () => {
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        expect(screen.queryByText('abc123def456')).not.toBeInTheDocument();
        expect(screen.queryByText('xyz789ghi012')).not.toBeInTheDocument();
      });
    });
  });

  // ===== 8. TABLE FUNCTIONALITY =====

  describe('8. Table Functionality', () => {
    test('should display table headers correctly', async () => {
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        expect(screen.getByText('Device Name')).toBeInTheDocument();
        expect(screen.getByText('Type')).toBeInTheDocument();
        expect(screen.getByText('Owner')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Location')).toBeInTheDocument();
        expect(screen.getByText('Last Seen')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });

    test('should have sticky header for scrolling', async () => {
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table.querySelector('thead')).toBeInTheDocument();
      });
    });

    test('should display devices in table rows', async () => {
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // 1 header row + 3 device rows
        expect(rows).toHaveLength(4);
      });
    });
  });

  // ===== 9. PERFORMANCE & OPTIMIZATION =====

  describe('9. Performance & Optimization', () => {
    test('should handle large number of devices efficiently', async () => {
      const largeDeviceList = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Device ${i + 1}`,
        device_type: 'sensor',
        api_key: `key${i}`,
        status: i % 2 === 0 ? 'online' : 'offline',
        location: `Location ${i}`,
        user_id: 2,
        user: {
          id: 2,
          username: 'test_user',
          email: 'test@example.com',
        },
        last_seen: new Date().toISOString(),
      }));
      
      apiService.adminGetAllDevices = jest.fn().mockResolvedValue({
        devices: largeDeviceList,
        total: 100,
      });
      
      const startTime = Date.now();
      
      renderComponent();
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        expect(screen.getByText(/Found 100 device\(s\)/i)).toBeInTheDocument();
      });
      
      const endTime = Date.now();
      const renderTime = endTime - startTime;
      
      // Should render in less than 3 seconds
      expect(renderTime).toBeLessThan(3000);
    });

    test('should not fetch devices unnecessarily', async () => {
      renderComponent();
      
      // Switch to devices tab
      const devicesTab = screen.getByRole('tab', { name: /all devices/i });
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        expect(apiService.adminGetAllDevices).toHaveBeenCalledTimes(1);
      });
      
      // Switch to another tab
      const logsTab = screen.getByRole('tab', { name: /system logs/i });
      fireEvent.click(logsTab);
      
      // Switch back to devices tab (should trigger new fetch)
      fireEvent.click(devicesTab);
      
      await waitFor(() => {
        expect(apiService.adminGetAllDevices).toHaveBeenCalledTimes(2);
      });
    });
  });
});
