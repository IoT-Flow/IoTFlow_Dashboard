// Mock axios before importing apiService
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  })),
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

describe('ApiService - Device Group Methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock localStorage
    Storage.prototype.getItem = jest.fn(key => {
      if (key === 'iotflow_token') return 'mock-token';
      if (key === 'iotflow_user') return JSON.stringify({ id: 1, username: 'testuser' });
      return null;
    });
  });

  describe('getGroups', () => {
    test('should fetch all device groups for the current user', async () => {
      const mockGroups = [
        { id: 1, name: 'Living Room', device_count: 5, color: '#FF5733' },
        { id: 2, name: 'Bedroom', device_count: 3, color: '#33FF57' },
      ];

      // Mock the axios get request
      const mockGet = jest.fn().mockResolvedValue({
        data: mockGroups,
        status: 200,
      });

      apiService.api.get = mockGet;

      const result = await apiService.getGroups();

      expect(mockGet).toHaveBeenCalledWith('/groups');
      expect(result).toEqual(mockGroups);
    });

    test('should handle error when fetching groups fails', async () => {
      const mockError = new Error('Network error');

      const mockGet = jest.fn().mockRejectedValue(mockError);
      apiService.api.get = mockGet;

      await expect(apiService.getGroups()).rejects.toThrow('Network error');
      expect(mockGet).toHaveBeenCalledWith('/groups');
    });

    test('should return empty array when no groups exist', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: [],
        status: 200,
      });

      apiService.api.get = mockGet;

      const result = await apiService.getGroups();

      expect(result).toEqual([]);
    });
  });

  describe('createGroup', () => {
    test('should create a new device group', async () => {
      const newGroup = {
        name: 'Office',
        description: 'Office devices',
        color: '#FFA500',
      };

      const createdGroup = {
        id: 3,
        ...newGroup,
        device_count: 0,
        user_id: 1,
      };

      const mockPost = jest.fn().mockResolvedValue({
        data: createdGroup,
        status: 201,
      });

      apiService.api.post = mockPost;

      const result = await apiService.createGroup(newGroup);

      expect(mockPost).toHaveBeenCalledWith('/groups', newGroup);
      expect(result).toEqual(createdGroup);
    });

    test('should handle validation error when creating group without name', async () => {
      const invalidGroup = {
        description: 'No name provided',
      };

      const mockPost = jest.fn().mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Name is required' },
        },
      });

      apiService.api.post = mockPost;

      await expect(apiService.createGroup(invalidGroup)).rejects.toMatchObject({
        response: {
          status: 400,
        },
      });
    });
  });

  describe('updateGroup', () => {
    test('should update an existing device group', async () => {
      const groupId = 1;
      const updates = {
        name: 'Updated Living Room',
        color: '#00FF00',
      };

      const updatedGroup = {
        id: groupId,
        name: 'Updated Living Room',
        color: '#00FF00',
        device_count: 5,
      };

      const mockPut = jest.fn().mockResolvedValue({
        data: updatedGroup,
        status: 200,
      });

      apiService.api.put = mockPut;

      const result = await apiService.updateGroup(groupId, updates);

      expect(mockPut).toHaveBeenCalledWith(`/groups/${groupId}`, updates);
      expect(result).toEqual(updatedGroup);
    });

    test('should handle error when updating non-existent group', async () => {
      const groupId = 999;
      const updates = { name: 'Non-existent' };

      const mockPut = jest.fn().mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Group not found' },
        },
      });

      apiService.api.put = mockPut;

      await expect(apiService.updateGroup(groupId, updates)).rejects.toMatchObject({
        response: {
          status: 404,
        },
      });
    });
  });

  describe('deleteGroup', () => {
    test('should delete a device group', async () => {
      const groupId = 1;

      const mockDelete = jest.fn().mockResolvedValue({
        data: { message: 'Group deleted successfully' },
        status: 200,
      });

      apiService.api.delete = mockDelete;

      const result = await apiService.deleteGroup(groupId);

      expect(mockDelete).toHaveBeenCalledWith(`/groups/${groupId}`);
      expect(result.message).toBe('Group deleted successfully');
    });

    test('should handle error when deleting non-existent group', async () => {
      const groupId = 999;

      const mockDelete = jest.fn().mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Group not found' },
        },
      });

      apiService.api.delete = mockDelete;

      await expect(apiService.deleteGroup(groupId)).rejects.toMatchObject({
        response: {
          status: 404,
        },
      });
    });
  });

  describe('getDevicesByGroup', () => {
    test('should fetch devices for a specific group', async () => {
      const groupId = 1;
      const mockDevices = [
        { id: 1, name: 'Temp Sensor 1', type: 'temperature' },
        { id: 2, name: 'Humidity Sensor 1', type: 'humidity' },
      ];

      const mockGet = jest.fn().mockResolvedValue({
        data: { devices: mockDevices },
        status: 200,
      });

      apiService.api.get = mockGet;

      const result = await apiService.getDevicesByGroup(groupId);

      expect(mockGet).toHaveBeenCalledWith(`/groups/${groupId}`);
      expect(result.devices).toEqual(mockDevices);
    });

    test('should return empty devices array for group with no devices', async () => {
      const groupId = 2;

      const mockGet = jest.fn().mockResolvedValue({
        data: { devices: [] },
        status: 200,
      });

      apiService.api.get = mockGet;

      const result = await apiService.getDevicesByGroup(groupId);

      expect(result.devices).toEqual([]);
    });
  });
});
