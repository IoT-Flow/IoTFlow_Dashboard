import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    addDeviceToGroup: jest.fn(),
    removeDeviceFromGroup: jest.fn(),
  },
}));

import apiService from '../../services/apiService';

describe('Device Group Assignment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should open assignment dialog with available groups', async () => {
    const mockGroups = [
      { id: 1, name: 'Group 1', device_count: 5 },
      { id: 2, name: 'Group 2', device_count: 3 },
    ];

    const mockDevices = [
      { 
        id: 1, 
        name: 'Device 1', 
        type: 'temperature', 
        status: 'active',
        location: 'Office',
        createdAt: new Date().toISOString() 
      },
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

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Device 1')).toBeInTheDocument();
    });

    // Click on device menu
    const menuButtons = screen.getAllByLabelText(/actions/i);
    fireEvent.click(menuButtons[0]);

    // Click "Assign to Group" option
    await waitFor(() => {
      const assignOption = screen.getByText('Assign to Group');
      fireEvent.click(assignOption);
    });

    // Wait for dialog to open and show groups
    await waitFor(() => {
      expect(screen.getByText(/Assign.*to groups/i)).toBeInTheDocument();
      expect(screen.getByText('Group 1')).toBeInTheDocument();
      expect(screen.getByText('Group 2')).toBeInTheDocument();
    });

    // Should NOT make excessive API calls for device-group mappings
    // Backend handles duplicate additions gracefully
    expect(apiService.getDevicesByGroup).not.toHaveBeenCalled();
  });
});
