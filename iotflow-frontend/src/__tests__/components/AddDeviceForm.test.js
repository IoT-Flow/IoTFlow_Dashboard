/**
 * TDD Test Suite for AddDeviceForm Component
 *
 * Requirements:
 * - Display form with device name, type, location, and description fields
 * - Validate required fields (name and type)
 * - Submit form to create new device
 * - Show loading state during submission
 * - Display success/error toasts
 * - Clear form after successful submission
 * - Handle API errors gracefully
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import AddDeviceForm from '../../components/AddDeviceForm';
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
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'testuser' },
    isAuthenticated: true,
  }),
}));

describe('AddDeviceForm Component', () => {
  let mockOnSuccess;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSuccess = jest.fn();
    apiService.createDevice.mockResolvedValue({
      id: 1,
      name: 'Test Device',
      device_type: 'sensor',
      location: 'Living Room',
      description: 'Test description',
    });
  });

  // TEST 1 (RED): Form should render with all required fields
  test('should render form with all required fields', () => {
    render(<AddDeviceForm onSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/device name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/device type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create device|add device/i })).toBeInTheDocument();
  });

  // TEST 2 (RED): Form should not submit when name is empty
  test('should not submit form when name is empty', async () => {
    render(<AddDeviceForm onSuccess={mockOnSuccess} />);

    const typeSelect = screen.getByLabelText(/device type/i);
    await userEvent.click(typeSelect);
    await userEvent.click(screen.getByText('Sensor'));

    const submitButton = screen.getByRole('button', { name: /create device|add device/i });
    await userEvent.click(submitButton);

    expect(apiService.createDevice).not.toHaveBeenCalled();
  });

  // TEST 3 (RED): Form should not submit when type is not selected
  test('should not submit form when type is not selected', async () => {
    render(<AddDeviceForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/device name/i);
    await userEvent.type(nameInput, 'Test Device');

    const submitButton = screen.getByRole('button', { name: /create device|add device/i });
    await userEvent.click(submitButton);

    expect(apiService.createDevice).not.toHaveBeenCalled();
  });

  // TEST 4 (RED): Form should submit with valid data
  test('should submit form with valid data', async () => {
    render(<AddDeviceForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/device name/i);
    const locationInput = screen.getByLabelText(/location/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    await userEvent.type(nameInput, 'Test Device');
    await userEvent.type(locationInput, 'Living Room');
    await userEvent.type(descriptionInput, 'A test device');

    const typeSelect = screen.getByLabelText(/device type/i);
    await userEvent.click(typeSelect);
    await userEvent.click(screen.getByText('Sensor'));

    const submitButton = screen.getByRole('button', { name: /create device|add device/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(apiService.createDevice).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Device',
          device_type: 'sensor',
          location: 'Living Room',
          description: 'A test device',
        })
      );
    });
  });

  // TEST 5 (RED): Form should show success toast after successful submission
  test('should show success toast after successful submission', async () => {
    render(<AddDeviceForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/device name/i);
    await userEvent.type(nameInput, 'Test Device');

    const typeSelect = screen.getByLabelText(/device type/i);
    await userEvent.click(typeSelect);
    await userEvent.click(screen.getByText('Sensor'));

    const submitButton = screen.getByRole('button', { name: /create device|add device/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Device created'));
    });
  });

  // TEST 6 (RED): Form should call onSuccess callback after submission
  test('should call onSuccess callback after successful submission', async () => {
    render(<AddDeviceForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/device name/i);
    await userEvent.type(nameInput, 'Test Device');

    const typeSelect = screen.getByLabelText(/device type/i);
    await userEvent.click(typeSelect);
    await userEvent.click(screen.getByText('Sensor'));

    const submitButton = screen.getByRole('button', { name: /create device|add device/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  // TEST 7 (RED): Form should clear inputs after successful submission
  test('should clear form inputs after successful submission', async () => {
    render(<AddDeviceForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/device name/i);
    const locationInput = screen.getByLabelText(/location/i);

    await userEvent.type(nameInput, 'Test Device');
    await userEvent.type(locationInput, 'Living Room');

    const typeSelect = screen.getByLabelText(/device type/i);
    await userEvent.click(typeSelect);
    await userEvent.click(screen.getByText('Sensor'));

    const submitButton = screen.getByRole('button', { name: /create device|add device/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(nameInput).toHaveValue('');
      expect(locationInput).toHaveValue('');
    });
  });

  // TEST 8 (RED): Form should show error toast on API failure
  test('should show error toast on API failure', async () => {
    const errorMessage = 'Failed to create device';
    apiService.createDevice.mockRejectedValueOnce(new Error(errorMessage));

    render(<AddDeviceForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/device name/i);
    await userEvent.type(nameInput, 'Test Device');

    const typeSelect = screen.getByLabelText(/device type/i);
    await userEvent.click(typeSelect);
    await userEvent.click(screen.getByText('Sensor'));

    const submitButton = screen.getByRole('button', { name: /create device|add device/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed'));
    });
  });

  // TEST 9 (RED): Form should show loading state during submission
  test('should show loading state during submission', async () => {
    let resolveSubmit;
    apiService.createDevice.mockReturnValueOnce(
      new Promise(resolve => {
        resolveSubmit = resolve;
      })
    );

    render(<AddDeviceForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/device name/i);
    await userEvent.type(nameInput, 'Test Device');

    const typeSelect = screen.getByLabelText(/device type/i);
    await userEvent.click(typeSelect);
    await userEvent.click(screen.getByText('Sensor'));

    const submitButton = screen.getByRole('button', { name: /create device|add device/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    resolveSubmit({
      id: 1,
      name: 'Test Device',
      device_type: 'sensor',
    });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  // TEST 10 (RED): Form should not call onSuccess on API failure
  test('should not call onSuccess on API failure', async () => {
    apiService.createDevice.mockRejectedValueOnce(new Error('Failed'));

    render(<AddDeviceForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/device name/i);
    await userEvent.type(nameInput, 'Test Device');

    const typeSelect = screen.getByLabelText(/device type/i);
    await userEvent.click(typeSelect);
    await userEvent.click(screen.getByText('Sensor'));

    const submitButton = screen.getByRole('button', { name: /create device|add device/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  // TEST 11 (RED): Form should have device type options
  test('should have predefined device type options', async () => {
    render(<AddDeviceForm onSuccess={mockOnSuccess} />);

    const typeSelect = screen.getByLabelText(/device type/i);
    await userEvent.click(typeSelect);

    expect(screen.getByText('Sensor')).toBeInTheDocument();
    expect(screen.getByText('Actuator')).toBeInTheDocument();
    expect(screen.getByText('Gateway')).toBeInTheDocument();
  });

  // TEST 12 (RED): Should show API key after successful creation
  test('should show API key after successful device creation', async () => {
    apiService.createDevice.mockResolvedValueOnce({
      success: true,
      data: {
        id: 1,
        name: 'Test Device',
        device_type: 'sensor',
        apiKey: 'test-api-key-12345',
      },
    });

    render(<AddDeviceForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/device name/i);
    await userEvent.type(nameInput, 'Test Device');

    const typeSelect = screen.getByLabelText(/device type/i);
    await userEvent.click(typeSelect);
    await userEvent.click(screen.getByText('Sensor'));

    const submitButton = screen.getByRole('button', { name: /create device/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      // Check for the API key display with the exact text
      expect(screen.getByText('test-api-key-12345')).toBeInTheDocument();
      // Check for success message
      expect(screen.getByText(/Device created successfully/i)).toBeInTheDocument();
    });
  });

  // TEST 13 (RED): Should have copy button for API key
  test('should have copy button for API key', async () => {
    apiService.createDevice.mockResolvedValueOnce({
      success: true,
      data: {
        id: 1,
        name: 'Test Device',
        device_type: 'sensor',
        apiKey: 'test-api-key-12345',
      },
    });

    render(<AddDeviceForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/device name/i);
    await userEvent.type(nameInput, 'Test Device');

    const typeSelect = screen.getByLabelText(/device type/i);
    await userEvent.click(typeSelect);
    await userEvent.click(screen.getByText('Sensor'));

    const submitButton = screen.getByRole('button', { name: /create device/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });
  });
});
