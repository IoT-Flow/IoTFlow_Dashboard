/**
 * TDD Tests for Admin V1 API Service Migration
 * 
 * These tests ensure that the frontend service layer correctly uses the new
 * /api/v1/admin/* endpoints instead of the old scattered admin endpoints.
 * 
 * Migration mapping:
 * - GET /users → GET /api/v1/admin/users
 * - PUT /users/:id/role → PUT /api/v1/admin/users/:id (with role field)
 * - PUT /users/:id/status → PUT /api/v1/admin/users/:id (with is_active field)
 * - DELETE /devices/admin/devices/:id → DELETE /api/v1/admin/devices/:id
 * - GET /devices/admin/devices → GET /api/v1/admin/devices
 * - GET /users/:id/devices → GET /api/v1/admin/users/:id/devices
 */

import axios from 'axios';

jest.mock('axios');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('Admin V1 API Service Migration', () => {
  let mockAxiosInstance;
  let ApiService;
  let apiService;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);

    // Mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };

    axios.create.mockReturnValue(mockAxiosInstance);

    // Import ApiService after mocking
    jest.isolateModules(() => {
      ApiService = require('../../services/apiService').default;
      apiService = ApiService;
    });
  });

  describe('User Management Endpoints', () => {
    describe('getAllUsers', () => {
      it('should call the new admin v1 users endpoint', async () => {
        const mockUsers = [
          { id: 1, username: 'user1', is_admin: false, is_active: true },
          { id: 2, username: 'admin1', is_admin: true, is_active: true },
        ];

        mockAxiosInstance.get.mockResolvedValue({
          data: { users: mockUsers, total: 2 },
        });

        const result = await apiService.getAllUsers();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/admin/users', undefined);
        expect(result).toEqual({ users: mockUsers, total: 2 });
      });

      it('should support pagination parameters', async () => {
        mockAxiosInstance.get.mockResolvedValue({
          data: { users: [], total: 0, page: 1, pages: 0 },
        });

        await apiService.getAllUsers({ page: 2, limit: 10 });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/admin/users', {
          params: { page: 2, limit: 10 },
        });
      });

      it('should support filtering parameters', async () => {
        mockAxiosInstance.get.mockResolvedValue({
          data: { users: [], total: 0 },
        });

        await apiService.getAllUsers({ 
          status: 'active',
          search: 'john' 
        });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/admin/users', {
          params: { status: 'active', search: 'john' },
        });
      });
    });

    describe('getUser', () => {
      it('should call the new admin v1 get user endpoint', async () => {
        const mockUser = { 
          id: 1, 
          username: 'user1', 
          email: 'user1@example.com' 
        };

        mockAxiosInstance.get.mockResolvedValue({
          data: { user: mockUser },
        });

        const result = await apiService.getUser(1);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/admin/users/1');
        expect(result).toEqual({ user: mockUser });
      });
    });

    describe('createUser', () => {
      it('should call the new admin v1 create user endpoint', async () => {
        const userData = {
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
          is_admin: false,
        };

        const mockCreatedUser = { id: 3, ...userData };

        mockAxiosInstance.post.mockResolvedValue({
          data: { user: mockCreatedUser },
        });

        const result = await apiService.createUser(userData);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v1/admin/users', userData);
        expect(result).toEqual({ user: mockCreatedUser });
      });
    });

    describe('updateUserRole', () => {
      it('should call the new admin v1 update user endpoint with role', async () => {
        const mockUpdatedUser = { 
          id: 1, 
          username: 'user1', 
          is_admin: true 
        };

        mockAxiosInstance.put.mockResolvedValue({
          data: { user: mockUpdatedUser },
        });

        const result = await apiService.updateUserRole(1, true);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/v1/admin/users/1', {
          is_admin: true,
        });
        expect(result).toEqual({ user: mockUpdatedUser });
      });

      it('should handle making user non-admin', async () => {
        mockAxiosInstance.put.mockResolvedValue({
          data: { user: { id: 1, is_admin: false } },
        });

        await apiService.updateUserRole(1, false);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/v1/admin/users/1', {
          is_admin: false,
        });
      });
    });

    describe('updateUserStatus', () => {
      it('should call the new admin v1 update user endpoint with status', async () => {
        const mockUpdatedUser = { 
          id: 1, 
          username: 'user1', 
          is_active: false 
        };

        mockAxiosInstance.put.mockResolvedValue({
          data: { user: mockUpdatedUser },
        });

        const result = await apiService.updateUserStatus(1, false);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/v1/admin/users/1', {
          is_active: false,
        });
        expect(result).toEqual({ user: mockUpdatedUser });
      });

      it('should handle activating user', async () => {
        mockAxiosInstance.put.mockResolvedValue({
          data: { user: { id: 1, is_active: true } },
        });

        await apiService.updateUserStatus(1, true);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/v1/admin/users/1', {
          is_active: true,
        });
      });
    });

    describe('updateUser', () => {
      it('should call the new admin v1 update user endpoint', async () => {
        const updateData = {
          username: 'updatedname',
          email: 'updated@example.com',
        };

        mockAxiosInstance.put.mockResolvedValue({
          data: { user: { id: 1, ...updateData } },
        });

        const result = await apiService.updateUser(1, updateData);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/v1/admin/users/1', updateData);
        expect(result).toEqual({ user: { id: 1, ...updateData } });
      });

      it('should support updating multiple fields at once', async () => {
        const updateData = {
          username: 'newname',
          is_admin: true,
          is_active: false,
        };

        mockAxiosInstance.put.mockResolvedValue({
          data: { user: { id: 1, ...updateData } },
        });

        await apiService.updateUser(1, updateData);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/v1/admin/users/1', updateData);
      });
    });

    describe('deleteUser', () => {
      it('should call the new admin v1 delete user endpoint', async () => {
        mockAxiosInstance.delete.mockResolvedValue({
          data: { message: 'User deleted successfully' },
        });

        const result = await apiService.deleteUser(1);

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/v1/admin/users/1');
        expect(result).toEqual({ message: 'User deleted successfully' });
      });
    });

    describe('getUserDevices', () => {
      it('should call the new admin v1 user devices endpoint', async () => {
        const mockDevices = [
          { id: 1, name: 'Device 1', device_type: 'sensor' },
          { id: 2, name: 'Device 2', device_type: 'actuator' },
        ];

        mockAxiosInstance.get.mockResolvedValue({
          data: { 
            user: { id: 1, username: 'user1' },
            devices: mockDevices,
            total: 2 
          },
        });

        const result = await apiService.getUserDevices(1);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/admin/users/1/devices');
        expect(result).toEqual({
          user: { id: 1, username: 'user1' },
          devices: mockDevices,
          total: 2,
        });
      });
    });
  });

  describe('Device Management Endpoints', () => {
    describe('adminGetAllDevices', () => {
      it('should call the new admin v1 devices endpoint', async () => {
        const mockDevices = [
          { id: 1, name: 'Device 1', user_id: 1, device_type: 'sensor' },
          { id: 2, name: 'Device 2', user_id: 2, device_type: 'actuator' },
        ];

        mockAxiosInstance.get.mockResolvedValue({
          data: { devices: mockDevices, total: 2 },
        });

        const result = await apiService.adminGetAllDevices();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/admin/devices', {
          params: {},
        });
        expect(result).toEqual({ devices: mockDevices, total: 2 });
      });

      it('should support pagination parameters', async () => {
        mockAxiosInstance.get.mockResolvedValue({
          data: { devices: [], total: 0 },
        });

        await apiService.adminGetAllDevices({ page: 2, limit: 20 });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/admin/devices', {
          params: { page: 2, limit: 20 },
        });
      });

      it('should support filtering by device_type', async () => {
        mockAxiosInstance.get.mockResolvedValue({
          data: { devices: [], total: 0 },
        });

        await apiService.adminGetAllDevices({ device_type: 'sensor' });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/admin/devices', {
          params: { device_type: 'sensor' },
        });
      });

      it('should support filtering by status', async () => {
        mockAxiosInstance.get.mockResolvedValue({
          data: { devices: [], total: 0 },
        });

        await apiService.adminGetAllDevices({ status: 'online' });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/admin/devices', {
          params: { status: 'online' },
        });
      });

      it('should support filtering by user_id', async () => {
        mockAxiosInstance.get.mockResolvedValue({
          data: { devices: [], total: 0 },
        });

        await apiService.adminGetAllDevices({ user_id: 5 });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/admin/devices', {
          params: { user_id: 5 },
        });
      });

      it('should support search parameter', async () => {
        mockAxiosInstance.get.mockResolvedValue({
          data: { devices: [], total: 0 },
        });

        await apiService.adminGetAllDevices({ search: 'temperature' });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/admin/devices', {
          params: { search: 'temperature' },
        });
      });
    });

    describe('getDevice', () => {
      it('should call the new admin v1 get device endpoint', async () => {
        const mockDevice = {
          id: 1,
          name: 'Device 1',
          device_type: 'sensor',
          user: { id: 1, username: 'user1' },
        };

        mockAxiosInstance.get.mockResolvedValue({
          data: { device: mockDevice },
        });

        const result = await apiService.getDevice(1);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/admin/devices/1');
        expect(result).toEqual({ device: mockDevice });
      });
    });

    describe('adminDeleteDevice', () => {
      it('should call the new admin v1 delete device endpoint', async () => {
        mockAxiosInstance.delete.mockResolvedValue({
          data: { message: 'Device deleted successfully' },
        });

        const result = await apiService.adminDeleteDevice(1);

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/v1/admin/devices/1');
        expect(result).toEqual({ 
          success: true, 
          data: { message: 'Device deleted successfully' } 
        });
      });

      it('should handle deletion errors', async () => {
        mockAxiosInstance.delete.mockRejectedValue(
          new Error('Device not found')
        );

        await expect(apiService.adminDeleteDevice(999)).rejects.toThrow('Device not found');
        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/v1/admin/devices/999');
      });
    });
  });

  describe('Statistics Endpoint', () => {
    describe('getAdminStats', () => {
      it('should call the new admin v1 stats endpoint', async () => {
        const mockStats = {
          totalUsers: 10,
          totalDevices: 50,
          activeUsers: 8,
          onlineDevices: 35,
        };

        mockAxiosInstance.get.mockResolvedValue({
          data: mockStats,
        });

        const result = await apiService.getAdminStats();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v1/admin/stats');
        expect(result).toEqual(mockStats);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 Unauthorized errors', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        response: { status: 401, data: { message: 'Unauthorized' } },
      });

      await expect(apiService.getAllUsers()).rejects.toMatchObject({
        response: { status: 401 },
      });
    });

    it('should handle 403 Forbidden errors (non-admin user)', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        response: { status: 403, data: { message: 'Admin access required' } },
      });

      await expect(apiService.getAllUsers()).rejects.toMatchObject({
        response: { status: 403 },
      });
    });

    it('should handle 404 Not Found errors', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        response: { status: 404, data: { message: 'User not found' } },
      });

      await expect(apiService.getUser(999)).rejects.toMatchObject({
        response: { status: 404 },
      });
    });

    it('should handle 400 Bad Request errors (self-modification)', async () => {
      mockAxiosInstance.delete.mockRejectedValue({
        response: { 
          status: 400, 
          data: { message: 'Cannot delete your own account' } 
        },
      });

      await expect(apiService.deleteUser(1)).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    it('should handle network errors', async () => {
      mockAxiosInstance.get.mockRejectedValue(
        new Error('Network Error')
      );

      await expect(apiService.getAllUsers()).rejects.toThrow('Network Error');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain same method signatures for getAllUsers', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { users: [], total: 0 },
      });

      // Should work with no parameters (backward compatible)
      await apiService.getAllUsers();
      
      // Should work with parameters (new feature)
      await apiService.getAllUsers({ page: 1, limit: 10 });
      
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should maintain same method signatures for updateUserRole', async () => {
      mockAxiosInstance.put.mockResolvedValue({
        data: { user: { id: 1, is_admin: true } },
      });

      // Old signature: (userId, isAdmin)
      await apiService.updateUserRole(1, true);
      
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/v1/admin/users/1', {
        is_admin: true,
      });
    });

    it('should maintain same method signatures for updateUserStatus', async () => {
      mockAxiosInstance.put.mockResolvedValue({
        data: { user: { id: 1, is_active: false } },
      });

      // Old signature: (userId, isActive)
      await apiService.updateUserStatus(1, false);
      
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/v1/admin/users/1', {
        is_active: false,
      });
    });

    it('should maintain same response format for adminDeleteDevice', async () => {
      mockAxiosInstance.delete.mockResolvedValue({
        data: { message: 'Device deleted' },
      });

      const result = await apiService.adminDeleteDevice(1);
      
      // Should return { success: true, data: {...} } for backward compatibility
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
    });
  });
});
