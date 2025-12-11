import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeviceGroupAssignment from '../../components/DeviceGroupAssignment';

// Mock apiService
jest.mock('../../services/apiService', () => ({
  __esModule: true,
  default: {
    getGroups: jest.fn(),
    addDeviceToGroup: jest.fn(),
    removeDeviceFromGroup: jest.fn(),
    getDevicesByGroup: jest.fn(),
  },
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

import apiService from '../../services/apiService';
import toast from 'react-hot-toast';

describe('DeviceGroupAssignment Component', () => {
  const mockGroups = [
    { id: 1, name: 'Living Room', color: '#FF5733', device_count: 3 },
    { id: 2, name: 'Bedroom', color: '#33FF57', device_count: 2 },
    { id: 3, name: 'Kitchen', color: '#3357FF', device_count: 4 },
  ];

  const mockDevice = {
    id: 10,
    name: 'Temperature Sensor 1',
    type: 'temperature',
  };

  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    apiService.getGroups.mockResolvedValue(mockGroups);
  });

  describe('Single Device Assignment', () => {
    test('should render dialog with device name', async () => {
      render(
        <DeviceGroupAssignment
          open={true}
          device={mockDevice}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Assign.*Temperature Sensor 1/i)).toBeInTheDocument();
      });
    });

    test('should load and display available groups', async () => {
      render(
        <DeviceGroupAssignment
          open={true}
          device={mockDevice}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
        expect(screen.getByText('Bedroom')).toBeInTheDocument();
        expect(screen.getByText('Kitchen')).toBeInTheDocument();
      });
    });

    test('should show loading state while fetching groups', () => {
      apiService.getGroups.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockGroups), 1000))
      );

      render(
        <DeviceGroupAssignment
          open={true}
          device={mockDevice}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText(/Loading groups/i)).toBeInTheDocument();
    });

    test('should check boxes for groups device is already in', async () => {
      const deviceGroups = [1, 3]; // Device is in Living Room and Kitchen

      render(
        <DeviceGroupAssignment
          open={true}
          device={mockDevice}
          deviceGroups={deviceGroups}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes[0]).toBeChecked(); // Living Room
        expect(checkboxes[1]).not.toBeChecked(); // Bedroom
        expect(checkboxes[2]).toBeChecked(); // Kitchen
      });
    });

    test('should add device to group when checkbox is checked', async () => {
      apiService.addDeviceToGroup.mockResolvedValue({ success: true });

      render(
        <DeviceGroupAssignment
          open={true}
          device={mockDevice}
          deviceGroups={[]}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        fireEvent.click(checkboxes[0]); // Click Living Room checkbox
      });

      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(
        () => {
          expect(apiService.addDeviceToGroup).toHaveBeenCalledWith(1, 10);
          expect(toast.success).toHaveBeenCalled();
          expect(mockOnSave).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });

    test('should remove device from group when checkbox is unchecked', async () => {
      apiService.removeDeviceFromGroup.mockResolvedValue({ success: true });

      render(
        <DeviceGroupAssignment
          open={true}
          device={mockDevice}
          deviceGroups={[1]}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        fireEvent.click(checkboxes[0]); // Uncheck Living Room checkbox
      });

      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(
        () => {
          expect(apiService.removeDeviceFromGroup).toHaveBeenCalledWith(1, 10);
          expect(toast.success).toHaveBeenCalled();
          expect(mockOnSave).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Bulk Device Assignment', () => {
    const mockDevices = [
      { id: 10, name: 'Sensor 1' },
      { id: 11, name: 'Sensor 2' },
      { id: 12, name: 'Sensor 3' },
    ];

    test('should show device count for bulk assignment', async () => {
      render(
        <DeviceGroupAssignment
          open={true}
          devices={mockDevices}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Assign 3 devices to groups/i)).toBeInTheDocument();
      });
    });

    test('should add multiple devices to selected groups', async () => {
      apiService.addDeviceToGroup.mockResolvedValue({ success: true });

      render(
        <DeviceGroupAssignment
          open={true}
          devices={mockDevices}
          deviceGroups={[]}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Wait for checkboxes to be available and click them
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        fireEvent.click(checkboxes[0]); // Living Room
        fireEvent.click(checkboxes[2]); // Kitchen
      });

      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(
        () => {
          // Should call addDeviceToGroup for each device-group combination
          expect(apiService.addDeviceToGroup).toHaveBeenCalledTimes(6); // 3 devices × 2 groups
          expect(toast.success).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });

    test('should show progress during bulk assignment', async () => {
      apiService.addDeviceToGroup.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(
        <DeviceGroupAssignment
          open={true}
          devices={mockDevices}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Wait for groups to load
      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      // Click checkbox to select a group
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      // Should show progress indicator
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });
  });

  describe('Group Display', () => {
    test('should display group colors', async () => {
      render(
        <DeviceGroupAssignment
          open={true}
          device={mockDevice}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        const colorIndicators = screen.getAllByTestId('group-color-indicator');
        expect(colorIndicators[0]).toHaveStyle({ backgroundColor: '#FF5733' });
        expect(colorIndicators[1]).toHaveStyle({ backgroundColor: '#33FF57' });
        expect(colorIndicators[2]).toHaveStyle({ backgroundColor: '#3357FF' });
      });
    });

    test('should display device count per group', async () => {
      render(
        <DeviceGroupAssignment
          open={true}
          device={mockDevice}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/3 devices/i)).toBeInTheDocument();
        expect(screen.getByText(/2 devices/i)).toBeInTheDocument();
        expect(screen.getByText(/4 devices/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle error when loading groups', async () => {
      apiService.getGroups.mockRejectedValue(new Error('Failed to load groups'));

      render(
        <DeviceGroupAssignment
          open={true}
          device={mockDevice}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load groups');
      });
    });

    test('should handle error when adding device to group', async () => {
      apiService.addDeviceToGroup.mockRejectedValue(new Error('Failed to add device'));

      render(
        <DeviceGroupAssignment
          open={true}
          device={mockDevice}
          deviceGroups={[]}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        fireEvent.click(checkboxes[0]);
      });

      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    test('should handle partial failure in bulk assignment', async () => {
      apiService.addDeviceToGroup
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ success: true });

      render(
        <DeviceGroupAssignment
          open={true}
          devices={[mockDevice, { id: 11, name: 'Sensor 2' }, { id: 12, name: 'Sensor 3' }]}
          deviceGroups={[]}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Wait for checkboxes and click one
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        fireEvent.click(checkboxes[0]);
      });

      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(
        () => {
          expect(screen.getByText(/2 of 3 devices assigned successfully/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Dialog Controls', () => {
    test('should close dialog on cancel', () => {
      render(
        <DeviceGroupAssignment
          open={true}
          device={mockDevice}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('should disable save button when no changes made', async () => {
      render(
        <DeviceGroupAssignment
          open={true}
          device={mockDevice}
          deviceGroups={[1]}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /Save/i });
        expect(saveButton).toBeDisabled();
      });
    });

    test('should enable save button when changes are made', async () => {
      render(
        <DeviceGroupAssignment
          open={true}
          device={mockDevice}
          deviceGroups={[1]}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        fireEvent.click(checkboxes[1]); // Check Bedroom
      });

      const saveButton = screen.getByRole('button', { name: /Save/i });
      expect(saveButton).toBeEnabled();
    });
  });

  describe('Search and Filter', () => {
    test('should filter groups by search term', async () => {
      render(
        <DeviceGroupAssignment
          open={true}
          device={mockDevice}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search groups/i);
      fireEvent.change(searchInput, { target: { value: 'Living' } });

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
        expect(screen.queryByText('Bedroom')).not.toBeInTheDocument();
        expect(screen.queryByText('Kitchen')).not.toBeInTheDocument();
      });
    });
  });

  describe('Checkbox State Persistence (TDD)', () => {
    test('should maintain checkbox state showing which groups device is assigned to', async () => {
      // Device is assigned to Living Room (id: 1) and Kitchen (id: 3)
      const deviceGroups = [1, 3];

      render(
        <DeviceGroupAssignment
          open={true}
          device={mockDevice}
          deviceGroups={deviceGroups}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');

        // Living Room (index 0) should be checked
        expect(checkboxes[0]).toBeChecked();

        // Bedroom (index 1) should NOT be checked
        expect(checkboxes[1]).not.toBeChecked();

        // Kitchen (index 2) should be checked
        expect(checkboxes[2]).toBeChecked();
      });
    });

    test('should update checkbox state when user clicks to assign device to new group', async () => {
      // Device initially has no groups
      render(
        <DeviceGroupAssignment
          open={true}
          device={mockDevice}
          deviceGroups={[]}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');

        // All checkboxes should initially be unchecked
        expect(checkboxes[0]).not.toBeChecked();
        expect(checkboxes[1]).not.toBeChecked();
        expect(checkboxes[2]).not.toBeChecked();
      });

      // Click Living Room checkbox to assign device to that group
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      await waitFor(() => {
        // Living Room checkbox should now be checked
        expect(checkboxes[0]).toBeChecked();

        // Others should remain unchecked
        expect(checkboxes[1]).not.toBeChecked();
        expect(checkboxes[2]).not.toBeChecked();
      });
    });

    test('should update checkbox state when user clicks to remove device from group', async () => {
      // Device is initially assigned to Living Room
      render(
        <DeviceGroupAssignment
          open={true}
          device={mockDevice}
          deviceGroups={[1]}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');

        // Living Room should be initially checked
        expect(checkboxes[0]).toBeChecked();
      });

      // Click Living Room checkbox to remove device from that group
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      await waitFor(() => {
        // Living Room checkbox should now be unchecked
        expect(checkboxes[0]).not.toBeChecked();
      });
    });

    test('should toggle checkbox state multiple times when clicking repeatedly', async () => {
      render(
        <DeviceGroupAssignment
          open={true}
          device={mockDevice}
          deviceGroups={[]}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');

      // Initially unchecked
      expect(checkboxes[0]).not.toBeChecked();

      // Click to check
      fireEvent.click(checkboxes[0]);
      await waitFor(() => {
        expect(checkboxes[0]).toBeChecked();
      });

      // Click to uncheck
      fireEvent.click(checkboxes[0]);
      await waitFor(() => {
        expect(checkboxes[0]).not.toBeChecked();
      });

      // Click to check again
      fireEvent.click(checkboxes[0]);
      await waitFor(() => {
        expect(checkboxes[0]).toBeChecked();
      });
    });

    test('should persist checkbox state after save and show correct state on reopen', async () => {
      apiService.addDeviceToGroup.mockResolvedValue({ success: true });

      // First render: no groups assigned
      const { rerender } = render(
        <DeviceGroupAssignment
          open={true}
          device={mockDevice}
          deviceGroups={[]}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Living Room')).toBeInTheDocument();
      });

      // Assign device to Living Room
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(apiService.addDeviceToGroup).toHaveBeenCalledWith(1, 10);
        expect(mockOnSave).toHaveBeenCalled();
      });

      // Simulate dialog being reopened with device now in Living Room
      rerender(
        <DeviceGroupAssignment
          open={true}
          device={mockDevice}
          deviceGroups={[1]} // Device is now in Living Room
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        const checkboxesAfterReopen = screen.getAllByRole('checkbox');
        // Living Room should be checked on reopen
        expect(checkboxesAfterReopen[0]).toBeChecked();
      });
    });
  });
});
