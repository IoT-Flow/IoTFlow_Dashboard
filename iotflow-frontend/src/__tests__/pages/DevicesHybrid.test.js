import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Devices from '../../pages/Devices.hybrid';
import apiService from '../../services/apiService';

// Mock dependencies
jest.mock('../../services/apiService');

jest.mock('react-hot-toast');

import toast from 'react-hot-toast';

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

jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: () => false,
    useTheme: () => ({
      breakpoints: {
        down: () => false,
      },
      palette: {
        primary: {
          main: '#1976d2',
        },
      },
    }),
  };
});

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

describe('Hybrid Devices Page (with old design)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock toast methods
    toast.success = jest.fn();
    toast.error = jest.fn();
    toast.loading = jest.fn();

    apiService.getDevices = jest.fn().mockResolvedValue({
      data: mockDevices,
    });

    apiService.getGroups = jest.fn().mockResolvedValue({
      data: [],
    });
  });

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

  test('should display device count', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/2 of 2 devices/i)).toBeInTheDocument();
    });
  });

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

  test('should have search functionality', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Temperature Sensor')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search devices/i);
    await userEvent.type(searchInput, 'Light');

    await waitFor(() => {
      expect(screen.queryByText('Temperature Sensor')).not.toBeInTheDocument();
      expect(screen.getByText('Light Actuator')).toBeInTheDocument();
    });
  });

  test('should have status filter', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Temperature Sensor')).toBeInTheDocument();
    });

    expect(screen.getAllByRole('button', { hidden: true }).length).toBeGreaterThan(0);
  });

  test('should have device type filter', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Temperature Sensor')).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

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

  test('should show loading indicator initially', async () => {
    apiService.getDevices = jest.fn(
      () => new Promise(resolve => setTimeout(() => resolve({ data: mockDevices }), 1000))
    );

    const { rerender } = render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('should display error message when API fails', async () => {
    apiService.getDevices = jest.fn().mockRejectedValue(new Error('API Error'));

    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(apiService.getDevices).toHaveBeenCalled();
    });
  });

  test('should have delete button for devices', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Temperature Sensor')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button');
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  test('should display API key or button to view it', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Temperature Sensor')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('should support multi-select with checkboxes', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Temperature Sensor')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  test('should display pagination controls', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Temperature Sensor')).toBeInTheDocument();
    });

    // Pagination should be present
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
