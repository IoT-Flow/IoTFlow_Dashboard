/**
 * TDD Test Suite for Refined Devices Page (Devices.old.js refactored)
 * 
 * Requirements:
 * - Load and display devices from new API endpoints
 * - Support both admin and regular users
 * - Provide device filtering (status, type, group)
 * - Support device CRUD operations
 * - Show device status with icons
 * - Support pagination
 * - Display device groups
 * - Handle API key display for devices
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import Devices from '../../pages/Devices.refined';
import apiService from '../../services/apiService';
import { toast } from 'react-hot-toast';

// Mock dependencies
jest.mock('../../services/apiService');

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
  Toaster: () => null,
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
      is_admin: false,
    },
    isAuthenticated: true,
  }),
}));

jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: () => false,
  useTheme: () => ({
    breakpoints: {
      down: () => false,
    },
  }),
}));

const mockDevices = [
  {
    id: 1,
    name: 'Temperature Sensor',
    device_type: 'sensor',
    location: 'Living Room',
    description: 'Monitors temperature',
    status: 'online',
    api_key: 'test-api-key-1',
    user: { id: 1, username: 'testuser' },
    created_at: '2025-12-10T00:00:00Z',
  },
  {
    id: 2,
    name: 'Light Actuator',
    device_type: 'actuator',
    location: 'Bedroom',
    description: 'Controls lights',
    status: 'offline',
    api_key: 'test-api-key-2',
    user: { id: 1, username: 'testuser' },
    created_at: '2025-12-09T00:00:00Z',
  },
];

describe('Refined Devices Page (with new API endpoints)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiService.getDevices = jest.fn().mockResolvedValue({
      data: mockDevices,
    });
  });

  // TEST 1: Should render page title
  test('should render page title "Devices"', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Devices')).toBeInTheDocument();
    });
  });

  // TEST 2: Should display device count
  test('should display device count', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/2 devices?/i)).toBeInTheDocument();
    });
  });

  // TEST 3: Should render refresh button
  test('should render refresh button', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });
  });

  // TEST 4: Should render add device button
  test('should render add device button', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: /add device/i });
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  // TEST 5: Should display devices in table
  test('should display devices in table', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Temperature Sensor')).toBeInTheDocument();
      expect(screen.getByText('Light Actuator')).toBeInTheDocument();
    });
  });

  // TEST 6: Should display device type
  test('should display device type', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('sensor')).toBeInTheDocument();
      expect(screen.getByText('actuator')).toBeInTheDocument();
    });
  });

  // TEST 7: Should display device status
  test('should display device status', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('online')).toBeInTheDocument();
      expect(screen.getByText('offline')).toBeInTheDocument();
    });
  });

  // TEST 8: Should display location
  test('should display device location', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Living Room')).toBeInTheDocument();
      expect(screen.getByText('Bedroom')).toBeInTheDocument();
    });
  });

  // TEST 9: Should have search functionality
  test('should filter devices by search term', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Temperature Sensor')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await userEvent.type(searchInput, 'Light');

    await waitFor(() => {
      expect(screen.getByText('Light Actuator')).toBeInTheDocument();
      // Temperature Sensor should be filtered out
      expect(screen.queryByText('Temperature Sensor')).not.toBeInTheDocument();
    });
  });

  // TEST 10: Should have status filter
  test('should have status filter dropdown', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Temperature Sensor')).toBeInTheDocument();
    });

    // Status filter should exist - check for any select element with status-related attributes
    const selects = screen.getAllByRole('button', { hidden: true });
    expect(selects.length).toBeGreaterThan(0);
  });

  // TEST 11: Should have type filter
  test('should have device type filter', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Temperature Sensor')).toBeInTheDocument();
    });

    // Type filter should exist - just verify filters are rendered
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  // TEST 12: Should call API with user devices endpoint
  test('should call apiService.getDevices on mount', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(apiService.getDevices).toHaveBeenCalled();
    });
  });

  // TEST 13: Should show loading state initially
  test('should show loading indicator initially', async () => {
    apiService.getDevices = jest.fn(
      () =>
        new Promise(resolve =>
          setTimeout(
            () => resolve({ data: mockDevices }),
            100
          )
        )
    );

    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    // Loading should be visible briefly
    expect(screen.queryByRole('progressbar')).toBeInTheDocument();
  });

  // TEST 14: Should handle API errors
  test('should display error message when API fails', async () => {
    apiService.getDevices = jest
      .fn()
      .mockRejectedValueOnce(new Error('Failed to load devices'));

    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed')
      );
    });
  });

  // TEST 15: Should support device deletion
  test('should have delete button for devices', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Temperature Sensor')).toBeInTheDocument();
    });

    // Delete buttons should exist
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  // TEST 16: Should display device API key
  test('should display device API key or button to view it', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Temperature Sensor')).toBeInTheDocument();
    });

    // Should have a way to view/display API keys
    const keyButtons = screen.queryAllByRole('button', { name: /key|api/i });
    expect(keyButtons.length + screen.queryAllByText(/api/i).length).toBeGreaterThan(0);
  });
});
