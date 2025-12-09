import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Devices from '../../pages/Devices';

// Mock dependencies
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'testuser' },
    isAuthenticated: true,
  }),
}));

jest.mock('../../contexts/WebSocketContext', () => ({
  useWebSocket: () => ({
    socket: null,
    isConnected: false,
    sendMessage: jest.fn(),
  }),
  WebSocketProvider: ({ children }) => children,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

// Mock apiService
jest.mock('../../services/apiService', () => ({
  __esModule: true,
  default: {
    getDevices: jest.fn(),
    getGroups: jest.fn(),
    getDevicesByGroup: jest.fn(),
  },
}));

import apiService from '../../services/apiService';

describe('Devices Page Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should load devices without making excessive API calls', async () => {
    // Mock 10 groups and 20 devices
    const mockGroups = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Group ${i + 1}`,
      device_count: 2,
      color: '#FF5733',
    }));

    const mockDevices = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      device_id: `device-${i + 1}`,
      name: `Device ${i + 1}`,
      type: 'temperature',
      status: 'active',
      location: 'Office',
      createdAt: new Date().toISOString(),
    }));

    apiService.getDevices.mockResolvedValue({
      success: true,
      data: mockDevices,
    });

    apiService.getGroups.mockResolvedValue(mockGroups);
    
    // Mock getDevicesByGroup to return devices
    apiService.getDevicesByGroup.mockResolvedValue({
      devices: [mockDevices[0], mockDevices[1]],
    });

    const startTime = performance.now();

    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    // Wait for page to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    }, { timeout: 5000 });

    const endTime = performance.now();
    const loadTime = endTime - startTime;

    // PERFORMANCE ASSERTION: Should load in under 2 seconds
    expect(loadTime).toBeLessThan(2000);

    // PERFORMANCE ASSERTION: Should NOT call getDevicesByGroup for each group
    // This is the N+1 problem - it should be called 0 times or consolidated
    expect(apiService.getDevicesByGroup).toHaveBeenCalledTimes(0);
  });

  test('should make efficient API calls on initial load', async () => {
    const mockGroups = [
      { id: 1, name: 'Group 1', device_count: 5 },
      { id: 2, name: 'Group 2', device_count: 3 },
    ];

    const mockDevices = [
      { id: 1, name: 'Device 1', type: 'temperature', status: 'active' },
      { id: 2, name: 'Device 2', type: 'humidity', status: 'active' },
    ];

    apiService.getDevices.mockResolvedValue({
      success: true,
      data: mockDevices,
    });

    apiService.getGroups.mockResolvedValue(mockGroups);

    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    // Wait for data to be loaded  
    await waitFor(() => {
      expect(apiService.getDevices).toHaveBeenCalled();
      expect(apiService.getGroups).toHaveBeenCalled();
    }, { timeout: 2000 });

    // Give it a moment to complete any additional renders
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should NOT call getDevicesByGroup during initial load (lazy loading)
    expect(apiService.getDevicesByGroup).not.toHaveBeenCalled();
  });
});
