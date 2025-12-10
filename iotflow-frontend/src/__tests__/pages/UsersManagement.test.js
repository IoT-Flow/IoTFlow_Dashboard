import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import UsersManagement from '../../pages/UsersManagement';
import apiService from '../../services/apiService';

// Mock the API service
jest.mock('../../services/apiService');

// Mock toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  promise: jest.fn((promise, msgs) => promise),
}));

// Mock useAuth hook
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      username: 'admin',
      email: 'admin@test.com',
      is_admin: true,
      role: 'admin',
    },
    isAuthenticated: true,
    loading: false,
  }),
}));

describe('UsersManagement - Admin Page', () => {
  const mockUsers = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@test.com',
      is_admin: true,
      is_active: true,
      created_at: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      username: 'user1',
      email: 'user1@test.com',
      is_admin: false,
      is_active: true,
      created_at: '2025-01-02T00:00:00.000Z',
    },
    {
      id: 3,
      username: 'user2',
      email: 'user2@test.com',
      is_admin: false,
      is_active: false,
      created_at: '2025-01-03T00:00:00.000Z',
    },
  ];

  const adminUser = {
    id: 1,
    username: 'admin',
    email: 'admin@test.com',
    is_admin: true,
    role: 'admin',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    apiService.getAllUsers = jest.fn().mockResolvedValue({ users: mockUsers });
    apiService.getUserDevices = jest.fn().mockResolvedValue({ devices: [] });
    apiService.updateUserRole = jest.fn().mockResolvedValue({ user: {} });
    apiService.updateUserStatus = jest.fn().mockResolvedValue({ user: {} });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <UsersManagement />
      </BrowserRouter>
    );
  };

  test('should display list of users on load', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('user1')).toBeInTheDocument();
      expect(screen.getByText('user2')).toBeInTheDocument();
    });

    expect(apiService.getAllUsers).toHaveBeenCalledTimes(1);
  });

  test('should display user roles correctly', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument();
    });

    // Check for admin badge
    const adminRow = screen.getByText('admin').closest('tr');
    expect(within(adminRow).getByText(/Admin/i)).toBeInTheDocument();

    // Check for user badge
    const user1Row = screen.getByText('user1').closest('tr');
    expect(within(user1Row).getByText(/User/i)).toBeInTheDocument();
  });

  test('should display user status correctly', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('user2')).toBeInTheDocument();
    });

    // Check for active status
    const user1Row = screen.getByText('user1').closest('tr');
    expect(within(user1Row).getByText(/Active/i)).toBeInTheDocument();

    // Check for inactive status
    const user2Row = screen.getByText('user2').closest('tr');
    expect(within(user2Row).getByText(/Inactive/i)).toBeInTheDocument();
  });

  test('should have action buttons for users', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    });

    // Check that action buttons exist (3 buttons per row: view, role, status)
    const allButtons = screen.getAllByRole('button');
    // Should have refresh button + 3 filter buttons + 9 action buttons (3 per user row)
    expect(allButtons.length).toBeGreaterThan(10);
  });

  test('should call API to get users on load', async () => {
    renderComponent();

    await waitFor(() => {
      expect(apiService.getAllUsers).toHaveBeenCalled();
    });
  });
});
