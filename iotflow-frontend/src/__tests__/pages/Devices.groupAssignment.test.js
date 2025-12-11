import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Devices from '../../pages/Devices.hybrid';

const theme = createTheme();

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

jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: () => false,
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
    addDeviceToGroup: jest.fn(),
    removeDeviceFromGroup: jest.fn(),
  },
}));

import apiService from '../../services/apiService';

describe('Device Group Assignment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test that Devices.hybrid.js has group assignment functionality
  test('should load groups and enable group filtering', async () => {
    const mockGroups = [
      { id: 1, name: 'Kitchen Devices', device_count: 5, color: '#FF0000' },
      { id: 2, name: 'Living Room', device_count: 3, color: '#00FF00' },
    ];

    const mockDevices = [
      {
        id: 1,
        name: 'Device 1',
        device_type: 'temperature',
        status: 'online',
        location: 'Office',
        created_at: new Date().toISOString(),
      },
    ];

    apiService.getDevices.mockResolvedValue({
      success: true,
      data: mockDevices,
    });

    apiService.getGroups.mockResolvedValue(mockGroups);

    render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Devices />
        </BrowserRouter>
      </ThemeProvider>
    );

    // Wait for devices to load
    await waitFor(() => {
      expect(screen.getByText('Device 1')).toBeInTheDocument();
    });

    // Verify that getGroups API is called (group functionality is present in hybrid version)
    expect(apiService.getGroups).toHaveBeenCalled();

    // Verify group features are loaded by checking for "Add Group" button
    await waitFor(() => {
      const addGroupButton = screen.getByRole('button', { name: /add group/i });
      expect(addGroupButton).toBeInTheDocument();
    });
  });
});
