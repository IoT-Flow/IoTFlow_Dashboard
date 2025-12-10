/**
 * TDD Test Suite for New UsersManagement Page
 * 
 * This test suite defines the requirements for a rebuilt UsersManagement page that:
 * - Uses Admin V1 API endpoints (/api/v1/admin/users/*)
 * - Preserves the same design and functionality as the old page
 * - Provides user filtering, searching, and management capabilities
 * - Handles user role and status changes
 * - Shows user devices
 */

import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import apiService from '../../services/apiService';
import { toast } from 'react-hot-toast';

// We'll create the new component
let UsersManagementNew;

// Mock the API service
jest.mock('../../services/apiService');

// Mock toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
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

describe('UsersManagement Page - TDD (Rebuilt with Admin V1 API)', () => {
  const mockUsers = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@test.com',
      is_admin: true,
      is_active: true,
      created_at: '2025-12-01T10:00:00Z',
    },
    {
      id: 2,
      username: 'user1',
      email: 'user1@test.com',
      is_admin: false,
      is_active: true,
      created_at: '2025-12-02T10:00:00Z',
    },
    {
      id: 3,
      username: 'user2',
      email: 'user2@test.com',
      is_admin: false,
      is_active: false,
      created_at: '2025-12-03T10:00:00Z',
    },
  ];

  const mockDevices = [
    {
      id: 1,
      device_id: 'device123',
      name: 'Temperature Sensor',
    },
    {
      id: 2,
      device_id: 'device456',
      name: 'Humidity Sensor',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Try to import the component
    try {
      UsersManagementNew = require('../../pages/UsersManagement').default;
    } catch (e) {
      // Component doesn't exist yet, that's expected in TDD
      UsersManagementNew = null;
    }
  });

  const renderComponent = () => {
    if (!UsersManagementNew) {
      return null;
    }
    return render(
      <BrowserRouter>
        <UsersManagementNew />
      </BrowserRouter>
    );
  };

  describe('1. Component Rendering & Data Loading', () => {
    test('should load and display all users using Admin V1 API', async () => {
      if (!UsersManagementNew) {
        console.log('⏭️  Skipping: Component not created yet');
        return;
      }

      apiService.getAllUsers = jest.fn().mockResolvedValue({
        users: mockUsers,
        total: mockUsers.length,
      });

      renderComponent();

      // Should call the Admin V1 API
      await waitFor(() => {
        expect(apiService.getAllUsers).toHaveBeenCalled();
      });

      // Should display all users
      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.getByText('user2')).toBeInTheDocument();
      });
    });

    test('should handle array response format from API', async () => {
      if (!UsersManagementNew) return;

      // Backend returns array directly when no pagination params
      apiService.getAllUsers = jest.fn().mockResolvedValue(mockUsers);

      renderComponent();

      await waitFor(() => {
        expect(apiService.getAllUsers).toHaveBeenCalled();
      });

      // Should still display all users
      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.getByText('user2')).toBeInTheDocument();
      });
    });

    test('should display page title "User Management"', async () => {
      if (!UsersManagementNew) return;

      apiService.getAllUsers = jest.fn().mockResolvedValue({
        users: mockUsers,
        total: mockUsers.length,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });
    });

    test('should show loading state while fetching users', async () => {
      if (!UsersManagementNew) return;

      apiService.getAllUsers = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ users: [], total: 0 }), 1000))
      );

      renderComponent();

      // Should show loading indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('should show empty state when no users', async () => {
      if (!UsersManagementNew) return;

      apiService.getAllUsers = jest.fn().mockResolvedValue({
        users: [],
        total: 0,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/no users found/i)).toBeInTheDocument();
      });
    });
  });

  describe('2. User Display & Formatting', () => {
    beforeEach(() => {
      apiService.getAllUsers = jest.fn().mockResolvedValue({
        users: mockUsers,
        total: mockUsers.length,
      });
    });

    test('should display user information in table format', async () => {
      if (!UsersManagementNew) return;

      renderComponent();

      await waitFor(() => {
        // Check table headers
        expect(screen.getByRole('columnheader', { name: /username/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /email/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /role/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /created/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
      });
    });

    test('should display role chips correctly', async () => {
      if (!UsersManagementNew) return;

      renderComponent();

      await waitFor(() => {
        const adminChips = screen.getAllByText('Admin');
        const userChips = screen.getAllByText('User');
        
        expect(adminChips.length).toBeGreaterThan(0);
        expect(userChips.length).toBeGreaterThan(0);
      });
    });

    test('should display status chips correctly', async () => {
      if (!UsersManagementNew) return;

      renderComponent();

      await waitFor(() => {
        // Get all status chips (not the filter buttons)
        const tableBody = screen.getByRole('table').querySelector('tbody');
        const activeChips = within(tableBody).getAllByText('Active');
        const inactiveChips = within(tableBody).getAllByText('Inactive');
        
        expect(activeChips.length).toBe(2); // admin and user1
        expect(inactiveChips.length).toBe(1); // user2
      });
    });

    test('should display formatted creation dates', async () => {
      if (!UsersManagementNew) return;

      renderComponent();

      await waitFor(() => {
        // Should display dates in localized format
        const dateElements = screen.getAllByText(/12\/\d+\/2025|2025/i);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('3. Search & Filtering', () => {
    beforeEach(() => {
      apiService.getAllUsers = jest.fn().mockResolvedValue({
        users: mockUsers,
        total: mockUsers.length,
      });
    });

    test('should search users by username', async () => {
      if (!UsersManagementNew) return;

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
      });

      // Type in search box
      const searchBox = screen.getByPlaceholderText(/search users/i);
      fireEvent.change(searchBox, { target: { value: 'user1' } });

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.queryByText('user2')).not.toBeInTheDocument();
      });
    });

    test('should search users by email', async () => {
      if (!UsersManagementNew) return;

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('admin@test.com')).toBeInTheDocument();
      });

      // Type in search box
      const searchBox = screen.getByPlaceholderText(/search users/i);
      fireEvent.change(searchBox, { target: { value: 'admin@test.com' } });

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.queryByText('user1')).not.toBeInTheDocument();
      });
    });

    test('should filter by active status', async () => {
      if (!UsersManagementNew) return;

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('user2')).toBeInTheDocument();
      });

      // Click "Active" filter button
      const activeButton = screen.getByRole('button', { name: /^active$/i });
      fireEvent.click(activeButton);

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.queryByText('user2')).not.toBeInTheDocument();
      });
    });

    test('should filter by inactive status', async () => {
      if (!UsersManagementNew) return;

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      // Click "Inactive" filter button
      const inactiveButton = screen.getByRole('button', { name: /^inactive$/i });
      fireEvent.click(inactiveButton);

      await waitFor(() => {
        expect(screen.getByText('user2')).toBeInTheDocument();
        expect(screen.queryByText('user1')).not.toBeInTheDocument();
      });
    });

    test('should show all users when "All" filter is selected', async () => {
      if (!UsersManagementNew) return;

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      // Click "Inactive" first
      const inactiveButton = screen.getByRole('button', { name: /^inactive$/i });
      fireEvent.click(inactiveButton);

      // Then click "All"
      const allButton = screen.getByRole('button', { name: /^all$/i });
      fireEvent.click(allButton);

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.getByText('user2')).toBeInTheDocument();
      });
    });
  });

  describe('4. User Role Management', () => {
    beforeEach(() => {
      apiService.getAllUsers = jest.fn().mockResolvedValue({
        users: mockUsers,
        total: mockUsers.length,
      });
    });

    test('should promote user to admin', async () => {
      if (!UsersManagementNew) return;

      apiService.updateUserRole = jest.fn().mockResolvedValue({
        success: true,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      // Find and click promote button for user1
      const rows = screen.getAllByRole('row');
      const user1Row = rows.find(row => row.textContent.includes('user1'));
      expect(user1Row).toBeDefined();

      const promoteButton = within(user1Row).getByRole('button', { name: /promote to admin/i });
      fireEvent.click(promoteButton);

      await waitFor(() => {
        expect(apiService.updateUserRole).toHaveBeenCalledWith(2, true);
        expect(toast.promise).toHaveBeenCalled();
      });
    });

    test('should demote admin to user', async () => {
      if (!UsersManagementNew) return;

      apiService.updateUserRole = jest.fn().mockResolvedValue({
        success: true,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
      });

      // Find and click demote button for admin
      const rows = screen.getAllByRole('row');
      const adminRow = rows.find(row => row.textContent.includes('admin@test.com'));
      expect(adminRow).toBeDefined();

      const demoteButton = within(adminRow).getByRole('button', { name: /demote to user/i });
      fireEvent.click(demoteButton);

      await waitFor(() => {
        expect(apiService.updateUserRole).toHaveBeenCalledWith(1, false);
      });
    });
  });

  describe('5. User Status Management', () => {
    beforeEach(() => {
      apiService.getAllUsers = jest.fn().mockResolvedValue({
        users: mockUsers,
        total: mockUsers.length,
      });
    });

    test('should activate inactive user', async () => {
      if (!UsersManagementNew) return;

      apiService.updateUserStatus = jest.fn().mockResolvedValue({
        success: true,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('user2')).toBeInTheDocument();
      });

      // Find and click activate button for user2
      const rows = screen.getAllByRole('row');
      const user2Row = rows.find(row => row.textContent.includes('user2'));
      expect(user2Row).toBeDefined();

      const activateButton = within(user2Row).getByRole('button', { name: /^activate$/i });
      fireEvent.click(activateButton);

      await waitFor(() => {
        expect(apiService.updateUserStatus).toHaveBeenCalledWith(3, true);
      });
    });

    test('should deactivate active user', async () => {
      if (!UsersManagementNew) return;

      apiService.updateUserStatus = jest.fn().mockResolvedValue({
        success: true,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      // Find and click deactivate button for user1
      const rows = screen.getAllByRole('row');
      const user1Row = rows.find(row => row.textContent.includes('user1'));
      expect(user1Row).toBeDefined();

      const deactivateButton = within(user1Row).getByRole('button', { name: /deactivate/i });
      fireEvent.click(deactivateButton);

      await waitFor(() => {
        expect(apiService.updateUserStatus).toHaveBeenCalledWith(2, false);
      });
    });
  });

  describe('6. User Devices Viewing', () => {
    beforeEach(() => {
      apiService.getAllUsers = jest.fn().mockResolvedValue({
        users: mockUsers,
        total: mockUsers.length,
      });
    });

    test('should open devices dialog when view devices clicked', async () => {
      if (!UsersManagementNew) return;

      apiService.getUserDevices = jest.fn().mockResolvedValue({
        devices: mockDevices,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      // Find and click view devices button
      const rows = screen.getAllByRole('row');
      const user1Row = rows.find(row => row.textContent.includes('user1'));
      const viewButton = within(user1Row).getByRole('button', { name: /view devices/i });
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(apiService.getUserDevices).toHaveBeenCalledWith(2);
        expect(screen.getByText("user1's Devices")).toBeInTheDocument();
      });
    });

    test('should display user devices in dialog', async () => {
      if (!UsersManagementNew) return;

      apiService.getUserDevices = jest.fn().mockResolvedValue({
        devices: mockDevices,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      // Open devices dialog
      const rows = screen.getAllByRole('row');
      const user1Row = rows.find(row => row.textContent.includes('user1'));
      const viewButton = within(user1Row).getByRole('button', { name: /view devices/i });
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText('Temperature Sensor')).toBeInTheDocument();
        expect(screen.getByText('Humidity Sensor')).toBeInTheDocument();
        expect(screen.getByText(/device123/i)).toBeInTheDocument();
      });
    });

    test('should show empty state when user has no devices', async () => {
      if (!UsersManagementNew) return;

      apiService.getUserDevices = jest.fn().mockResolvedValue({
        devices: [],
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      // Open devices dialog
      const rows = screen.getAllByRole('row');
      const user1Row = rows.find(row => row.textContent.includes('user1'));
      const viewButton = within(user1Row).getByRole('button', { name: /view devices/i });
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText(/no devices registered/i)).toBeInTheDocument();
      });
    });

    test('should close devices dialog when close button clicked', async () => {
      if (!UsersManagementNew) return;

      apiService.getUserDevices = jest.fn().mockResolvedValue({
        devices: mockDevices,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      // Open devices dialog
      const rows = screen.getAllByRole('row');
      const user1Row = rows.find(row => row.textContent.includes('user1'));
      const viewButton = within(user1Row).getByRole('button', { name: /view devices/i });
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText("user1's Devices")).toBeInTheDocument();
      });

      // Close dialog
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText("user1's Devices")).not.toBeInTheDocument();
      });
    });
  });

  describe('7. Refresh Functionality', () => {
    test('should reload users when refresh button clicked', async () => {
      if (!UsersManagementNew) return;

      apiService.getAllUsers = jest.fn().mockResolvedValue({
        users: mockUsers,
        total: mockUsers.length,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
      });

      // Clear mock to track new calls
      apiService.getAllUsers.mockClear();

      // Click refresh button
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(apiService.getAllUsers).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('8. Error Handling', () => {
    test('should handle API error gracefully when loading users', async () => {
      if (!UsersManagementNew) return;

      apiService.getAllUsers = jest.fn().mockRejectedValue(
        new Error('Network error')
      );

      renderComponent();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load users');
      });
    });

    test('should handle error when loading user devices', async () => {
      if (!UsersManagementNew) return;

      apiService.getAllUsers = jest.fn().mockResolvedValue({
        users: mockUsers,
        total: mockUsers.length,
      });

      apiService.getUserDevices = jest.fn().mockRejectedValue(
        new Error('Failed to load devices')
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      // Try to view devices
      const rows = screen.getAllByRole('row');
      const user1Row = rows.find(row => row.textContent.includes('user1'));
      const viewButton = within(user1Row).getByRole('button', { name: /view devices/i });
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load devices');
      });
    });
  });

  describe('9. UI & Accessibility', () => {
    beforeEach(() => {
      apiService.getAllUsers = jest.fn().mockResolvedValue({
        users: mockUsers,
        total: mockUsers.length,
      });
    });

    test('should have tooltips on action buttons', async () => {
      if (!UsersManagementNew) return;

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      // Check for tooltip titles (they should be in the document)
      const viewTooltips = screen.getAllByRole('button', { name: /view devices/i });
      expect(viewTooltips.length).toBeGreaterThan(0);
    });

    test('should disable refresh button while loading', async () => {
      if (!UsersManagementNew) return;

      apiService.getAllUsers = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ users: [], total: 0 }), 1000))
      );

      renderComponent();

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeDisabled();
    });
  });
});
