/**
 * TDD Test Suite for Devices Page with AddDeviceForm Integration
 * 
 * Requirements:
 * - Display Add Device button
 * - Open dialog when Add Device button is clicked
 * - Show AddDeviceForm inside dialog
 * - Close dialog after successful device creation
 * - Reload devices list after successful creation
 * - Display new device in list
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import Devices from '../../pages/Devices';
import apiService from '../../services/apiService';
import { toast } from 'react-hot-toast';

// Mock dependencies
jest.mock('../../services/apiService');
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
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

// Mock useMediaQuery to avoid theme issues in tests
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: () => false, // Simulate desktop view
}));

const mockDevices = [
  {
    id: 1,
    name: 'Temperature Sensor',
    device_type: 'sensor',
    location: 'Living Room',
    description: 'Monitors temperature',
    status: 'online',
    user: { id: 1, username: 'testuser' },
  },
];

describe('Devices Page with AddDeviceForm Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiService.getDevices.mockResolvedValue({
      data: mockDevices,
    });
    apiService.createDevice.mockResolvedValue({
      id: 2,
      name: 'New Humidity Sensor',
      device_type: 'sensor',
      location: 'Kitchen',
      status: 'online',
    });
  });

  // TEST 1: Should render Add Device button
  test('should render Add Device button', async () => {
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

  // TEST 2: Should open dialog when Add Device button is clicked
  test('should open create device dialog when Add Device button is clicked', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Temperature Sensor')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: /add device/i });
    await userEvent.click(addButtons[0]);

    // Form fields should appear after dialog opens
    await waitFor(() => {
      expect(screen.getByLabelText(/device name/i)).toBeInTheDocument();
    });
  });

  // TEST 3: Should display AddDeviceForm in dialog
  test('should display AddDeviceForm fields in dialog', async () => {
    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Temperature Sensor')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: /add device/i });
    await userEvent.click(addButtons[0]);

    // Form fields should appear in dialog
    await waitFor(() => {
      expect(screen.getByLabelText(/device name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/device type/i)).toBeInTheDocument();
    });
  });

  // TEST 4: Should close dialog after successful device creation
  test('should close dialog after successful device creation', async () => {
    apiService.getDevices.mockResolvedValueOnce({ data: mockDevices });
    apiService.getDevices.mockResolvedValueOnce({
      data: [
        ...mockDevices,
        {
          id: 2,
          name: 'New Device',
          device_type: 'sensor',
          status: 'online',
        },
      ],
    });

    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Temperature Sensor')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: /add device/i });
    await userEvent.click(addButtons[0]);

    const nameInput = screen.getByLabelText(/device name/i);
    await userEvent.type(nameInput, 'New Device');

    const typeSelect = screen.getByLabelText(/device type/i);
    await userEvent.click(typeSelect);
    await userEvent.click(screen.getByText('Sensor'));

    const submitButton = screen.getByRole('button', { name: /create device/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('Create Device')).not.toBeInTheDocument();
    });
  });

  // TEST 5: Should reload devices after successful creation
  test('should reload devices after successful creation', async () => {
    apiService.getDevices.mockResolvedValueOnce({ data: mockDevices });
    apiService.getDevices.mockResolvedValueOnce({
      data: [
        ...mockDevices,
        {
          id: 2,
          name: 'New Device',
          device_type: 'sensor',
          status: 'online',
        },
      ],
    });

    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Temperature Sensor')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: /add device/i });
    await userEvent.click(addButtons[0]);

    const nameInput = screen.getByLabelText(/device name/i);
    await userEvent.type(nameInput, 'New Device');

    const typeSelect = screen.getByLabelText(/device type/i);
    await userEvent.click(typeSelect);
    await userEvent.click(screen.getByText('Sensor'));

    const submitButton = screen.getByRole('button', { name: /create device/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(apiService.getDevices).toHaveBeenCalledTimes(2);
    });
  });

  // TEST 6: Should display new device in list
  test('should display new device in list after creation', async () => {
    apiService.getDevices.mockResolvedValueOnce({ data: mockDevices });
    apiService.getDevices.mockResolvedValueOnce({
      data: [
        ...mockDevices,
        {
          id: 2,
          name: 'New Device',
          device_type: 'sensor',
          status: 'online',
        },
      ],
    });

    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Temperature Sensor')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: /add device/i });
    await userEvent.click(addButtons[0]);

    const nameInput = screen.getByLabelText(/device name/i);
    await userEvent.type(nameInput, 'New Device');

    const typeSelect = screen.getByLabelText(/device type/i);
    await userEvent.click(typeSelect);
    await userEvent.click(screen.getByText('Sensor'));

    const submitButton = screen.getByRole('button', { name: /create device/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('New Device')).toBeInTheDocument();
    });
  });

  // TEST 7: Should show success toast after creation
  test('should show success toast after creation', async () => {
    apiService.getDevices.mockResolvedValueOnce({ data: mockDevices });
    apiService.getDevices.mockResolvedValueOnce({ data: mockDevices });

    render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Temperature Sensor')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: /add device/i });
    await userEvent.click(addButtons[0]);

    const nameInput = screen.getByLabelText(/device name/i);
    await userEvent.type(nameInput, 'New Device');

    const typeSelect = screen.getByLabelText(/device type/i);
    await userEvent.click(typeSelect);
    await userEvent.click(screen.getByText('Sensor'));

    const submitButton = screen.getByRole('button', { name: /create device/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  // TEST 8: Device count should update after creation
  test('should update device count after creation', async () => {
    apiService.getDevices.mockResolvedValueOnce({ data: mockDevices });
    apiService.getDevices.mockResolvedValueOnce({
      data: [
        ...mockDevices,
        {
          id: 2,
          name: 'New Device',
          device_type: 'sensor',
          status: 'online',
        },
      ],
    });

    const { rerender } = render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('1 device')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: /add device/i });
    await userEvent.click(addButtons[0]);

    const nameInput = screen.getByLabelText(/device name/i);
    await userEvent.type(nameInput, 'New Device');

    const typeSelect = screen.getByLabelText(/device type/i);
    await userEvent.click(typeSelect);
    await userEvent.click(screen.getByText('Sensor'));

    const submitButton = screen.getByRole('button', { name: /create device/i });
    await userEvent.click(submitButton);

    // After creation, we should have 2 devices
    await waitFor(() => {
      expect(screen.getByText('2 devices')).toBeInTheDocument();
    });
  });
});
