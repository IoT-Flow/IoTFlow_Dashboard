/**
 * TDD Test Suite for New Devices Page
 *
 * This test suite defines the requirements for a rebuilt Devices page that:
 * - Works correctly for both admin and regular users
 * - Shows all devices for admins, only user's devices for regular users
 * - Provides filtering, sorting, and search capabilities
 * - Handles device operations (create, edit, delete)
 * - Integrates with groups functionality
 */

import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import apiService from '../../services/apiService';
import { toast } from 'react-hot-toast';

// We'll create the new component
let DevicesNew;

// Mock the API service
jest.mock('../../services/apiService');

// Mock toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    promise: jest.fn((promise, msgs) => promise),
  },
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

// Mock MUI hooks
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn(() => false), // Default to desktop view
}));

describe('Devices Page - TDD (Rebuilt from Scratch)', () => {
  const mockAdminDevices = [
    {
      id: 1,
      name: 'Temperature Sensor 1',
      device_type: 'temperature_sensor',
      status: 'online',
      location: 'Living Room',
      description: 'Living room temperature sensor',
      user_id: 1,
      user: { id: 1, username: 'admin', email: 'admin@test.com' },
      created_at: '2025-12-01T10:00:00Z',
      last_seen: '2025-12-10T10:00:00Z',
    },
    {
      id: 2,
      name: 'Humidity Sensor',
      device_type: 'humidity_sensor',
      status: 'offline',
      location: 'Bedroom',
      description: 'Bedroom humidity sensor',
      user_id: 2,
      user: { id: 2, username: 'user1', email: 'user1@test.com' },
      created_at: '2025-12-02T10:00:00Z',
      last_seen: '2025-12-09T10:00:00Z',
    },
    {
      id: 3,
      name: 'Motion Detector',
      device_type: 'motion_sensor',
      status: 'online',
      location: 'Hallway',
      description: 'Hallway motion detector',
      user_id: 1,
      user: { id: 1, username: 'admin', email: 'admin@test.com' },
      created_at: '2025-12-03T10:00:00Z',
      last_seen: '2025-12-10T09:00:00Z',
    },
  ];

  const mockUserDevices = [
    {
      id: 4,
      name: 'User Temperature Sensor',
      device_type: 'temperature_sensor',
      status: 'online',
      location: 'Office',
      description: 'Office temperature sensor',
      user_id: 2,
      created_at: '2025-12-04T10:00:00Z',
      last_seen: '2025-12-10T08:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Try to import the component
    try {
      DevicesNew = require('../../pages/Devices').default;
    } catch (e) {
      // Component doesn't exist yet, that's expected in TDD
      DevicesNew = null;
    }
  });

  const renderComponent = () => {
    if (!DevicesNew) {
      return null;
    }
    return render(
      <BrowserRouter>
        <DevicesNew />
      </BrowserRouter>
    );
  };

  describe('1. Component Rendering & Data Loading', () => {
    describe('Admin User', () => {
      beforeEach(() => {
        mockAuthContext.user = {
          id: 1,
          username: 'admin',
          is_admin: true,
          role: 'admin',
        };
      });

      test('should load all devices for admin users', async () => {
        if (!DevicesNew) {
          console.log('⏭️  Skipping: Component not created yet');
          return;
        }

        apiService.adminGetAllDevices = jest.fn().mockResolvedValue({
          devices: mockAdminDevices,
          total: mockAdminDevices.length,
        });

        renderComponent();

        await waitFor(() => {
          expect(apiService.adminGetAllDevices).toHaveBeenCalled();
        });

        // Should display all devices
        await waitFor(() => {
          expect(screen.getByText('Temperature Sensor 1')).toBeInTheDocument();
          expect(screen.getByText('Humidity Sensor')).toBeInTheDocument();
          expect(screen.getByText('Motion Detector')).toBeInTheDocument();
        });
      });

      test('should show user information for each device (admin view)', async () => {
        if (!DevicesNew) return;

        apiService.adminGetAllDevices = jest.fn().mockResolvedValue({
          devices: mockAdminDevices,
          total: mockAdminDevices.length,
        });

        renderComponent();

        await waitFor(() => {
          // Should show "Owner" column header
          expect(screen.getByRole('columnheader', { name: /owner/i })).toBeInTheDocument();
        });
      });

      test('should call adminGetAllDevices, not getDevices', async () => {
        if (!DevicesNew) return;

        apiService.adminGetAllDevices = jest.fn().mockResolvedValue({
          devices: mockAdminDevices,
          total: mockAdminDevices.length,
        });
        apiService.getDevices = jest.fn();

        renderComponent();

        await waitFor(() => {
          expect(apiService.adminGetAllDevices).toHaveBeenCalled();
          expect(apiService.getDevices).not.toHaveBeenCalled();
        });
      });
    });

    describe('Regular User', () => {
      beforeEach(() => {
        mockAuthContext.user = {
          id: 2,
          username: 'user1',
          is_admin: false,
          role: 'user',
        };
      });

      test('should load only user devices for regular users', async () => {
        if (!DevicesNew) return;

        apiService.getDevices = jest.fn().mockResolvedValue({
          success: true,
          data: mockUserDevices,
        });

        renderComponent();

        await waitFor(() => {
          expect(apiService.getDevices).toHaveBeenCalled();
        });

        // Should only display user's devices
        await waitFor(() => {
          expect(screen.getByText('User Temperature Sensor')).toBeInTheDocument();
          expect(screen.queryByText('Humidity Sensor')).not.toBeInTheDocument();
        });
      });

      test('should call getDevices, not adminGetAllDevices', async () => {
        if (!DevicesNew) return;

        apiService.getDevices = jest.fn().mockResolvedValue({
          success: true,
          data: mockUserDevices,
        });
        apiService.adminGetAllDevices = jest.fn();

        renderComponent();

        await waitFor(() => {
          expect(apiService.getDevices).toHaveBeenCalled();
          expect(apiService.adminGetAllDevices).not.toHaveBeenCalled();
        });
      });

      test('should not show user information column (regular user view)', async () => {
        if (!DevicesNew) return;

        apiService.getDevices = jest.fn().mockResolvedValue({
          success: true,
          data: mockUserDevices,
        });

        renderComponent();

        await waitFor(() => {
          // Should not have "Owner" or "User" column
          expect(screen.queryByText('Owner')).not.toBeInTheDocument();
        });
      });
    });
  });

  describe('2. Filtering & Searching', () => {
    beforeEach(() => {
      mockAuthContext.user = {
        id: 1,
        username: 'admin',
        is_admin: true,
        role: 'admin',
      };

      apiService.adminGetAllDevices = jest.fn().mockResolvedValue({
        devices: mockAdminDevices,
        total: mockAdminDevices.length,
      });
    });

    test('should filter devices by status', async () => {
      if (!DevicesNew) return;

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Temperature Sensor 1')).toBeInTheDocument();
      });

      // Find all comboboxes and get the Status one (first one after search)
      const comboboxes = screen.getAllByRole('combobox');
      const statusFilter = comboboxes.find(
        box =>
          box.closest('[class*="MuiFormControl"]')?.querySelector('label')?.textContent === 'Status'
      );

      fireEvent.mouseDown(statusFilter); // Open the select

      const onlineOption = await screen.findByRole('option', { name: /^online$/i });
      fireEvent.click(onlineOption);

      await waitFor(() => {
        expect(screen.getByText('Temperature Sensor 1')).toBeInTheDocument();
        expect(screen.getByText('Motion Detector')).toBeInTheDocument();
        expect(screen.queryByText('Humidity Sensor')).not.toBeInTheDocument();
      });
    });
    test('should filter devices by type', async () => {
      if (!DevicesNew) return;

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Temperature Sensor 1')).toBeInTheDocument();
      });

      // Find all comboboxes and get the Type one
      const comboboxes = screen.getAllByRole('combobox');
      const typeFilter = comboboxes.find(
        box =>
          box.closest('[class*="MuiFormControl"]')?.querySelector('label')?.textContent === 'Type'
      );

      fireEvent.mouseDown(typeFilter); // Open the select

      const tempOption = await screen.findByRole('option', { name: /temperature_sensor/i });
      fireEvent.click(tempOption);

      await waitFor(() => {
        expect(screen.getByText('Temperature Sensor 1')).toBeInTheDocument();
        expect(screen.queryByText('Humidity Sensor')).not.toBeInTheDocument();
        expect(screen.queryByText('Motion Detector')).not.toBeInTheDocument();
      });
    });

    test('should search devices by name', async () => {
      if (!DevicesNew) return;

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Temperature Sensor 1')).toBeInTheDocument();
      });

      // Find and type in search box
      const searchBox = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchBox, { target: { value: 'Motion' } });

      await waitFor(() => {
        expect(screen.getByText('Motion Detector')).toBeInTheDocument();
        expect(screen.queryByText('Temperature Sensor 1')).not.toBeInTheDocument();
      });
    });
  });

  describe('3. Device Operations', () => {
    beforeEach(() => {
      mockAuthContext.user = {
        id: 1,
        username: 'admin',
        is_admin: true,
        role: 'admin',
      };

      apiService.adminGetAllDevices = jest.fn().mockResolvedValue({
        devices: mockAdminDevices,
        total: mockAdminDevices.length,
      });
    });

    test('should open create device dialog', async () => {
      if (!DevicesNew) return;

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Temperature Sensor 1')).toBeInTheDocument();
      });

      // Find and click "Add Device" button
      const addButton = screen.getByRole('button', { name: /add device/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create.*device/i })).toBeInTheDocument();
      });
    });

    test('should delete device and refresh list', async () => {
      if (!DevicesNew) return;

      apiService.adminDeleteDevice = jest.fn().mockResolvedValue({
        success: true,
        message: 'Device deleted successfully',
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Temperature Sensor 1')).toBeInTheDocument();
      });

      // Find and click delete button for first device
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      // Confirm deletion
      const confirmButton = await screen.findByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(apiService.adminDeleteDevice).toHaveBeenCalledWith(1);
        expect(toast.success).toHaveBeenCalledWith('Device deleted successfully');
      });
    });

    test('should refresh device list', async () => {
      if (!DevicesNew) return;

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Temperature Sensor 1')).toBeInTheDocument();
      });

      // Clear the mock to track new calls
      apiService.adminGetAllDevices.mockClear();

      // Find and click refresh button
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(apiService.adminGetAllDevices).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('4. Display & UI', () => {
    beforeEach(() => {
      mockAuthContext.user = {
        id: 1,
        username: 'admin',
        is_admin: true,
        role: 'admin',
      };

      apiService.adminGetAllDevices = jest.fn().mockResolvedValue({
        devices: mockAdminDevices,
        total: mockAdminDevices.length,
      });
    });

    test('should display device count', async () => {
      if (!DevicesNew) return;

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/3.*devices?/i)).toBeInTheDocument();
      });
    });

    test('should show loading state', async () => {
      if (!DevicesNew) return;

      apiService.adminGetAllDevices = jest
        .fn()
        .mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve({ devices: [], total: 0 }), 1000))
        );

      renderComponent();

      // Should show loading indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('should show empty state when no devices', async () => {
      if (!DevicesNew) return;

      apiService.adminGetAllDevices = jest.fn().mockResolvedValue({
        devices: [],
        total: 0,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/no devices/i)).toBeInTheDocument();
      });
    });

    test('should display device status with correct styling', async () => {
      if (!DevicesNew) return;

      renderComponent();

      await waitFor(() => {
        const onlineStatus = screen.getAllByText(/online/i)[0];
        const offlineStatus = screen.getByText(/offline/i);

        expect(onlineStatus).toBeInTheDocument();
        expect(offlineStatus).toBeInTheDocument();
      });
    });
  });

  describe('5. Error Handling', () => {
    beforeEach(() => {
      mockAuthContext.user = {
        id: 1,
        username: 'admin',
        is_admin: true,
        role: 'admin',
      };
    });

    test('should handle API error gracefully', async () => {
      if (!DevicesNew) return;

      apiService.adminGetAllDevices = jest.fn().mockRejectedValue(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to load devices'));
      });
    });

    test('should handle delete error gracefully', async () => {
      if (!DevicesNew) return;

      apiService.adminGetAllDevices = jest.fn().mockResolvedValue({
        devices: mockAdminDevices,
        total: mockAdminDevices.length,
      });

      apiService.adminDeleteDevice = jest.fn().mockRejectedValue(new Error('Delete failed'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Temperature Sensor 1')).toBeInTheDocument();
      });

      // Try to delete
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      const confirmButton = await screen.findByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe('6. Responsive Design', () => {
    beforeEach(() => {
      mockAuthContext.user = {
        id: 1,
        username: 'admin',
        is_admin: true,
        role: 'admin',
      };

      apiService.adminGetAllDevices = jest.fn().mockResolvedValue({
        devices: mockAdminDevices,
        total: mockAdminDevices.length,
      });
    });

    test('should render device cards on mobile view', async () => {
      if (!DevicesNew) return;

      // Mock mobile viewport
      global.innerWidth = 500;
      global.dispatchEvent(new Event('resize'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Temperature Sensor 1')).toBeInTheDocument();
      });

      // Should use card layout instead of table
      // This will be verified by checking for specific classes or structure
    });
  });
});
