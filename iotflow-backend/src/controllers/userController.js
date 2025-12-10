const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

class UserController {
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        where: { [Op.or]: [{ email }, { username }] },
      });

      if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        username,
        email,
        password_hash,
      });

      const { password_hash: _, ...userResponse } = newUser.toJSON();

      // Generate JWT token for the new user
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // Send welcome notification for new user registration
      await notificationService.createNotification(newUser.id, {
        type: 'success',
        title: 'Welcome to IoTFlow!',
        message: 'Your account has been created successfully. Welcome to the IoT platform!',
        device_id: null,
        source: 'account_management',
        metadata: { action: 'registration', username: newUser.username },
      });

      res.status(201).json({ user: userResponse, token });
    } catch (error) {
      res.status(500).json({ message: 'Failed to register user', error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, username, password } = req.body;

      const loginIdentifier = email || username;
      if (!loginIdentifier || !password) {
        return res.status(400).json({ message: 'Email/username and password are required' });
      }

      // Find user by email or username
      const user = await User.findOne({
        where: {
          [Op.or]: [{ email: loginIdentifier }, { username: loginIdentifier }],
        },
      });

      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Update last login
      await user.update({ last_login: new Date() });

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      const { password_hash: _, ...userResponse } = user.toJSON();

      // Send notification for successful login
      await notificationService.notifySuccessfulLogin(user.id, {
        login_method: email ? 'email' : 'username',
        timestamp: new Date().toISOString(),
      });

      res.status(200).json({
        user: userResponse,
        token,
      });
    } catch (error) {
      res.status(500).json({ message: 'Login failed', error: error.message });
    }
  }

  async refreshApiKey(req, res) {
    try {
      const userId = req.user.id;
      const newApiKey = crypto.randomBytes(32).toString('hex');

      await User.update({ api_key: newApiKey, updated_at: new Date() }, { where: { id: userId } });

      // Send notification for API key refresh
      await notificationService.createNotification(req.user.id, {
        type: 'warning',
        title: 'API Key Refreshed',
        message: 'Your API key has been refreshed. Update any applications using the old key.',
        device_id: null,
        source: 'security',
        metadata: { action: 'api_key_refresh' },
      });

      res.status(200).json({ api_key: newApiKey });
    } catch (error) {
      res.status(500).json({ message: 'Failed to refresh API key', error: error.message });
    }
  }

  async getProfile(req, res) {
    try {
      const { password_hash: _, ...userProfile } = req.user.toJSON();
      res.status(200).json(userProfile);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get profile', error: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const { id } = req.user;
      const { username, email, password } = req.body;

      const updates = {};
      if (username) updates.username = username;
      if (email) updates.email = email;
      if (password) {
        updates.password_hash = await bcrypt.hash(password, 10);
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No updates provided' });
      }

      updates.updated_at = new Date();

      const [updated] = await User.update(updates, { where: { id } });

      if (!updated) {
        return res.status(404).json({ message: 'User not found' });
      }

      const updatedUser = await User.findByPk(id);
      const { password_hash: _, ...userResponse } = updatedUser.toJSON();

      // Send notification for profile update
      await notificationService.createNotification(req.user.id, {
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully',
        device_id: null,
        source: 'profile_management',
        metadata: { updated_fields: Object.keys(updates) },
      });

      res.status(200).json(userResponse);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update profile', error: error.message });
    }
  }

  async createUser(req, res) {
    try {
      const { username, email, password, role = 'user' } = req.body;

      const password_hash = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        username,
        email,
        password_hash,
        role,
      });

      // Send notification to admin who created the user
      await notificationService.createNotification(req.user.id, {
        type: 'success',
        title: 'User Created',
        message: `User "${username}" has been created successfully`,
        device_id: null,
        source: 'user_management',
        metadata: { action: 'create_user', target_user: username, role },
      });

      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create user', error: error.message });
    }
  }

  async getUser(req, res) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve user', error: error.message });
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, email, password, is_active, is_admin, role } = req.body;

      // Consolidated safeguards from specific endpoints
      // Prevent admin from modifying their own role or status via sensitive fields
      if (parseInt(id) === req.user.id) {
        if (is_admin !== undefined || is_active !== undefined) {
          return res.status(400).json({ 
            message: 'Cannot modify your own admin privileges or account status' 
          });
        }
      }

      const updates = { username, email, is_active, is_admin, role, updated_at: new Date() };
      if (password) {
        updates.password_hash = await bcrypt.hash(password, 10);
      }

      const [updated] = await User.update(updates, { where: { id } });

      if (!updated) {
        return res.status(404).json({ message: 'User not found' });
      }
      const updatedUser = await User.findByPk(id);

      // Send specific notifications for role/status changes
      if (is_admin !== undefined) {
        await notificationService.createNotification(parseInt(id), {
          type: 'info',
          title: 'Role Updated',
          message: `Your role has been updated to ${is_admin ? 'Admin' : 'User'}`,
          device_id: null,
          source: 'user_management',
          metadata: { action: 'role_update', is_admin },
        });
      }

      if (is_active !== undefined) {
        await notificationService.createNotification(parseInt(id), {
          type: is_active ? 'success' : 'warning',
          title: `Account ${is_active ? 'Activated' : 'Deactivated'}`,
          message: `Your account has been ${is_active ? 'activated' : 'deactivated'} by an administrator`,
          device_id: null,
          source: 'user_management',
          metadata: { action: 'status_update', is_active },
        });
      }

      // Send notification to admin who updated the user
      await notificationService.createNotification(req.user.id, {
        type: 'info',
        title: 'User Updated',
        message: `User "${updatedUser.username}" has been updated`,
        device_id: null,
        source: 'user_management',
        metadata: {
          action: 'update_user',
          target_user: updatedUser.username,
          updated_fields: Object.keys(updates),
        },
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user', error: error.message });
    }
  }

  async deleteUser(req, res) {
    try {
      // Get user details before deletion for notification
      const userToDelete = await User.findByPk(req.params.id);
      if (!userToDelete) {
        return res.status(404).json({ message: 'User not found' });
      }

      const deleted = await User.destroy({ where: { id: req.params.id } });
      if (!deleted) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Send notification to admin who deleted the user
      await notificationService.createNotification(req.user.id, {
        type: 'warning',
        title: 'User Deleted',
        message: `User "${userToDelete.username}" has been deleted`,
        device_id: null,
        source: 'user_management',
        metadata: { action: 'delete_user', target_user: userToDelete.username },
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete user', error: error.message });
    }
  }

  // Admin-only: Get all users
  async getAllUsers(req, res) {
    try {
      // Check if user is admin
      if (!req.user.is_admin) {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      }

      const users = await User.findAll({
        attributes: { exclude: ['password_hash'] },
        order: [['created_at', 'DESC']],
      });

      res.status(200).json({ users });
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve users', error: error.message });
    }
  }

  // Admin-only: Get user's devices
  async getUserDevices(req, res) {
    try {
      // Check if user is admin
      if (!req.user.is_admin) {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      }

      const { id } = req.params;
      const { Device } = require('../models');

      const user = await User.findByPk(id, {
        include: [{ model: Device, as: 'devices' }],
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({
        user_id: user.id,
        username: user.username,
        devices: user.devices,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve user devices', error: error.message });
    }
  }

  // Admin-only: Update user role
  // DEPRECATED: Use updateUser instead - kept for backward compatibility
  async updateUserRole(req, res) {
    // Delegate to consolidated updateUser method
    req.body = { is_admin: req.body.is_admin };
    return this.updateUser(req, res);
  }

  // Admin-only: Update user status (active/inactive)
  // DEPRECATED: Use updateUser instead - kept for backward compatibility
  async updateUserStatus(req, res) {
    // Delegate to consolidated updateUser method
    req.body = { is_active: req.body.is_active };
    return this.updateUser(req, res);
  }
}

module.exports = new UserController();
