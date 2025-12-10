import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';

// Mock axios
jest.mock('axios');

// Mock toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
}));

// Mock the API service
jest.mock('../services/apiService', () => ({
  __esModule: true,
  default: {
    login: jest.fn(),
    setAuthToken: jest.fn(),
    logout: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: key => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: key => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AuthContext - User Role Mapping', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  test('should map is_admin=true to role="admin"', async () => {
    const adminUser = {
      id: 1,
      username: 'admin',
      email: 'admin@test.com',
      is_admin: true,
    };

    apiService.login.mockResolvedValue({
      success: true,
      data: {
        token: 'test-token',
        user: adminUser,
      },
    });

    apiService.setAuthToken = jest.fn();

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.login('admin@test.com', 'password');

    await waitFor(() => {
      expect(result.current.user).toBeDefined();
      expect(result.current.user.role).toBe('admin');
      expect(result.current.user.is_admin).toBe(true);
    });
  });

  test('should map is_admin=false to role="user"', async () => {
    const regularUser = {
      id: 2,
      username: 'testuser',
      email: 'user@test.com',
      is_admin: false,
    };

    apiService.login.mockResolvedValue({
      success: true,
      data: {
        token: 'test-token',
        user: regularUser,
      },
    });

    apiService.setAuthToken = jest.fn();

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.login('user@test.com', 'password');

    await waitFor(() => {
      expect(result.current.user).toBeDefined();
      expect(result.current.user.role).toBe('user');
      expect(result.current.user.is_admin).toBe(false);
    });
  });

  test('should default to role="user" when is_admin is not specified', async () => {
    const regularUser = {
      id: 3,
      username: 'defaultuser',
      email: 'default@test.com',
    };

    apiService.login.mockResolvedValue({
      success: true,
      data: {
        token: 'test-token',
        user: regularUser,
      },
    });

    apiService.setAuthToken = jest.fn();

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.login('default@test.com', 'password');

    await waitFor(() => {
      expect(result.current.user).toBeDefined();
      expect(result.current.user.role).toBe('user');
    });
  });
});
