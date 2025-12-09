const UserController = require('../src/controllers/userController');
const { User, Device } = require('../src/models');

// Mock the models
jest.mock('../src/models');
jest.mock('../src/services/notificationService');

describe('UserController - Admin User Management', () => {
  let mockReq;
  let mockRes;
  let adminUser;
  let regularUser;

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
      user: { id: 1, is_admin: true },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    adminUser = {
      id: 1,
      username: 'admin',
      email: 'admin@test.com',
      is_admin: true,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      toJSON: function() {
        return { ...this };
      },
    };

    regularUser = {
      id: 2,
      username: 'user',
      email: 'user@test.com',
      is_admin: false,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      toJSON: function() {
        return { ...this };
      },
    };

    jest.clearAllMocks();
  });

  describe('GET /api/users - List all users (admin only)', () => {
    test('should return all users for admin', async () => {
      const users = [
        { ...adminUser, password_hash: 'hash1' },
        { ...regularUser, password_hash: 'hash2' },
      ];
      User.findAll = jest.fn().mockResolvedValue(users);

      await UserController.getAllUsers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        users: expect.arrayContaining([
          expect.objectContaining({ username: 'admin' }),
          expect.objectContaining({ username: 'user' }),
        ])
      });
    });

    test('should return 403 if user is not admin', async () => {
      mockReq.user.is_admin = false;

      await UserController.getAllUsers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: 'Access denied. Admin privileges required.' 
      });
    });

    test('should handle errors gracefully', async () => {
      User.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      await UserController.getAllUsers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to retrieve users',
          error: expect.any(String),
        })
      );
    });
  });

  describe('GET /api/users/:id/devices - Get user devices (admin only)', () => {
    test('should return devices for specified user', async () => {
      mockReq.params.id = 2;
      const mockDevices = [
        { id: 1, name: 'Device 1', user_id: 2 },
        { id: 2, name: 'Device 2', user_id: 2 },
      ];

      const mockUser = {
        ...regularUser,
        devices: mockDevices,
        toJSON: function() {
          return { ...this };
        },
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      await UserController.getUserDevices(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 2,
          username: 'user',
          devices: expect.any(Array),
        })
      );
    });

    test('should return 403 if user is not admin', async () => {
      mockReq.user.is_admin = false;
      mockReq.params.id = 2;

      await UserController.getUserDevices(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Access denied. Admin privileges required.',
      });
    });

    test('should return 404 if user not found', async () => {
      mockReq.params.id = '999';
      User.findByPk = jest.fn().mockResolvedValue(null);

      await UserController.getUserDevices(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'User not found' })
      );
    });
  });

  describe('PUT /api/users/:id/role - Update user role (admin only)', () => {
    test('should update user role to admin', async () => {
      mockReq.params.id = '2';
      mockReq.body.is_admin = true;

      const updatedUser = { ...regularUser, is_admin: true };
      const mockUser = {
        ...regularUser,
        update: jest.fn().mockResolvedValue(updatedUser),
        toJSON: function() {
          return updatedUser;
        },
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      await UserController.updateUserRole(mockReq, mockRes);

      expect(mockUser.update).toHaveBeenCalledWith({ is_admin: true });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User role updated successfully',
          user: expect.objectContaining({ is_admin: true }),
        })
      );
    });

    test('should update user role to regular user', async () => {
      mockReq.params.id = '2';
      mockReq.body.is_admin = false;

      const updatedUser = { ...regularUser, is_admin: false };
      const mockUser = {
        ...regularUser,
        update: jest.fn().mockResolvedValue(updatedUser),
        toJSON: function() {
          return updatedUser;
        },
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      await UserController.updateUserRole(mockReq, mockRes);

      expect(mockUser.update).toHaveBeenCalledWith({ is_admin: false });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 403 if user is not admin', async () => {
      mockReq.user.is_admin = false;
      mockReq.params.id = 2;

      await UserController.updateUserRole(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Access denied. Admin privileges required.',
      });
    });

    test('should return 404 if user not found', async () => {
      mockReq.params.id = '999';
      User.findByPk = jest.fn().mockResolvedValue(null);

      await UserController.updateUserRole(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'User not found' })
      );
    });

    test('should prevent user from demoting themselves', async () => {
      mockReq.params.id = '1'; // Same as admin user ID
      mockReq.body.is_admin = false;

      await UserController.updateUserRole(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Cannot modify your own admin privileges',
        })
      );
    });
  });

  describe('PUT /api/users/:id/status - Update user status (admin only)', () => {
    test('should activate/deactivate user', async () => {
      mockReq.params.id = '2';
      mockReq.body.is_active = false;

      const updatedUser = { ...regularUser, is_active: false };
      const mockUser = {
        ...regularUser,
        update: jest.fn().mockResolvedValue(updatedUser),
        toJSON: function() {
          return updatedUser;
        },
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      await UserController.updateUserStatus(mockReq, mockRes);

      expect(mockUser.update).toHaveBeenCalledWith({ is_active: false });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User status updated successfully',
          user: expect.objectContaining({ is_active: false }),
        })
      );
    });

    test('should return 403 if user is not admin', async () => {
      mockReq.user.is_admin = false;
      mockReq.params.id = 2;

      await UserController.updateUserStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should prevent user from deactivating themselves', async () => {
      mockReq.params.id = '1';
      mockReq.body.is_active = false;

      await UserController.updateUserStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Cannot modify your own account status',
        })
      );
    });
  });
});
