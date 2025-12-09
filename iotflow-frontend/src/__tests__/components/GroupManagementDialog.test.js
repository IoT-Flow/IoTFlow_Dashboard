import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GroupManagementDialog from '../../components/GroupManagementDialog';

// Mock apiService
jest.mock('../../services/apiService', () => ({
  __esModule: true,
  default: {
    createGroup: jest.fn(),
    updateGroup: jest.fn(),
    deleteGroup: jest.fn(),
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

describe('GroupManagementDialog Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Group Mode', () => {
    test('should render create group dialog with empty form', () => {
      render(
        <GroupManagementDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          mode="create"
        />
      );

      expect(screen.getByText(/Create Group/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Group Name/i)).toHaveValue('');
      expect(screen.getByLabelText(/Description/i)).toHaveValue('');
    });

    test('should validate required fields on create', async () => {
      render(
        <GroupManagementDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          mode="create"
        />
      );

      const saveButton = screen.getByRole('button', { name: /Create/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Group name is required/i)).toBeInTheDocument();
      });

      expect(apiService.createGroup).not.toHaveBeenCalled();
    });

    test('should create group with valid data', async () => {
      const newGroup = {
        id: 1,
        name: 'Test Group',
        description: 'Test Description',
        color: '#FF5733',
      };

      apiService.createGroup.mockResolvedValue(newGroup);

      render(
        <GroupManagementDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          mode="create"
        />
      );

      // Fill in the form
      fireEvent.change(screen.getByLabelText(/Group Name/i), {
        target: { value: 'Test Group' },
      });
      fireEvent.change(screen.getByLabelText(/Description/i), {
        target: { value: 'Test Description' },
      });

      // Click create button
      const saveButton = screen.getByRole('button', { name: /Create/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(apiService.createGroup).toHaveBeenCalledWith({
          name: 'Test Group',
          description: 'Test Description',
          color: expect.any(String),
        });
        expect(toast.success).toHaveBeenCalledWith('Group created successfully');
        expect(mockOnSave).toHaveBeenCalledWith(newGroup);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('should handle create group error', async () => {
      apiService.createGroup.mockRejectedValue(new Error('Failed to create group'));

      render(
        <GroupManagementDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          mode="create"
        />
      );

      fireEvent.change(screen.getByLabelText(/Group Name/i), {
        target: { value: 'Test Group' },
      });

      const saveButton = screen.getByRole('button', { name: /Create/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to create group');
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Edit Group Mode', () => {
    const existingGroup = {
      id: 1,
      name: 'Existing Group',
      description: 'Existing Description',
      color: '#FF5733',
    };

    test('should render edit group dialog with existing data', () => {
      render(
        <GroupManagementDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          mode="edit"
          group={existingGroup}
        />
      );

      expect(screen.getByText(/Edit Group/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Group Name/i)).toHaveValue('Existing Group');
      expect(screen.getByLabelText(/Description/i)).toHaveValue('Existing Description');
    });

    test('should update group with modified data', async () => {
      const updatedGroup = {
        ...existingGroup,
        name: 'Updated Group',
      };

      apiService.updateGroup.mockResolvedValue(updatedGroup);

      render(
        <GroupManagementDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          mode="edit"
          group={existingGroup}
        />
      );

      fireEvent.change(screen.getByLabelText(/Group Name/i), {
        target: { value: 'Updated Group' },
      });

      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(apiService.updateGroup).toHaveBeenCalledWith(1, {
          name: 'Updated Group',
          description: 'Existing Description',
          color: '#FF5733',
        });
        expect(toast.success).toHaveBeenCalledWith('Group updated successfully');
        expect(mockOnSave).toHaveBeenCalledWith(updatedGroup);
      });
    });

    test('should show delete confirmation on delete button click', async () => {
      render(
        <GroupManagementDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          mode="edit"
          group={existingGroup}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
      });
    });

    test('should delete group after confirmation', async () => {
      apiService.deleteGroup.mockResolvedValue({ success: true });

      render(
        <GroupManagementDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          mode="edit"
          group={existingGroup}
        />
      );

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /Confirm/i });
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(apiService.deleteGroup).toHaveBeenCalledWith(1);
      });

      expect(toast.success).toHaveBeenCalledWith('Group deleted successfully');
      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Color Picker', () => {
    test('should allow selecting a color', async () => {
      render(
        <GroupManagementDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          mode="create"
        />
      );

      // Find and click color picker button
      const colorButton = screen.getByLabelText(/Choose color/i);
      fireEvent.click(colorButton);

      // Color picker should be visible
      await waitFor(() => {
        expect(screen.getByTestId('color-picker')).toBeInTheDocument();
      });
    });

    test('should display selected color', () => {
      render(
        <GroupManagementDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          mode="edit"
          group={{
            id: 1,
            name: 'Test',
            color: '#FF5733',
          }}
        />
      );

      const colorIndicator = screen.getByTestId('color-indicator');
      expect(colorIndicator).toHaveStyle({ backgroundColor: '#FF5733' });
    });
  });

  describe('Dialog Controls', () => {
    test('should close dialog on cancel', () => {
      render(
        <GroupManagementDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          mode="create"
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('should not render when open is false', () => {
      const { container } = render(
        <GroupManagementDialog
          open={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
          mode="create"
        />
      );

      expect(container.querySelector('.MuiDialog-root')).not.toBeInTheDocument();
    });

    test('should disable save button while submitting', async () => {
      apiService.createGroup.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(
        <GroupManagementDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          mode="create"
        />
      );

      fireEvent.change(screen.getByLabelText(/Group Name/i), {
        target: { value: 'Test' },
      });

      const saveButton = screen.getByRole('button', { name: /Create/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });
    });
  });
});
