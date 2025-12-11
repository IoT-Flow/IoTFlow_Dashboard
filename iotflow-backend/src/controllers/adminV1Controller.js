const { User, Device, sequelize } = require('../models');
const { Op } = require('sequelize');

class AdminV1Controller {
  // GET /api/v1/admin/users - Get all users with pagination and filtering
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 50, is_active, is_admin, search } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (is_active !== undefined) {
        whereClause.is_active = is_active === 'true';
      }
      if (is_admin !== undefined) {
        whereClause.is_admin = is_admin === 'true';
      }
      if (search) {
        whereClause[Op.or] = [
          { username: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['password_hash'] },
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      // Simple array response when no explicit pagination params
      const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

      if (!isPaginated) {
        return res.status(200).json(users);
      }

      // Paginated response
      res.status(200).json({
        users,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve users', error: error.message });
    }
  }

  // GET /api/v1/admin/users/:id - Get specific user
  async getUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password_hash'] },
        include: [
          {
            model: Device,
            as: 'devices',
            attributes: ['id', 'name', 'device_type', 'status', 'created_at'],
          },
        ],
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve user', error: error.message });
    }
  }

  // POST /api/v1/admin/users - Create new user
  async createUser(req, res) {
    try {
      const { username, email, password, is_admin = false, is_active = true } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required' });
      }

      const bcrypt = require('bcrypt');
      const password_hash = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        user_id: `user_${Date.now()}`,
        username,
        email,
        password_hash,
        is_admin,
        is_active,
      });

      const { password_hash: _, ...userResponse } = newUser.toJSON();
      res.status(201).json(userResponse);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: 'Username or email already exists' });
      }
      res.status(500).json({ message: 'Failed to create user', error: error.message });
    }
  }

  // PUT /api/v1/admin/users/:id - Update user
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, email, password, is_active, is_admin } = req.body;

      // Prevent admin from modifying their own role or status
      if (parseInt(id) === req.user.id) {
        if (is_admin !== undefined || is_active !== undefined) {
          return res.status(400).json({
            message: 'Cannot modify your own admin privileges or account status',
          });
        }
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const updates = { username, email, is_active, is_admin };
      if (password) {
        const bcrypt = require('bcrypt');
        updates.password_hash = await bcrypt.hash(password, 10);
      }

      await user.update(updates);

      const { password_hash: _, ...userResponse } = user.toJSON();
      res.status(200).json(userResponse);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user', error: error.message });
    }
  }

  // DELETE /api/v1/admin/users/:id - Delete user
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Prevent admin from deleting themselves
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({ message: 'Cannot delete yourself' });
      }

      const deleted = await User.destroy({ where: { id } });
      if (!deleted) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete user', error: error.message });
    }
  }

  // GET /api/v1/admin/devices - Get all devices
  async getAllDevices(req, res) {
    try {
      const { page = 1, limit = 50, status, device_type, user_id } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (status) whereClause.status = status;
      if (device_type) whereClause.device_type = device_type;
      if (user_id) whereClause.user_id = user_id;

      const { count, rows: devices } = await Device.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email'],
          },
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.status(200).json({
        devices,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve devices', error: error.message });
    }
  }

  // GET /api/v1/admin/devices/:id - Get specific device
  async getDevice(req, res) {
    try {
      const { id } = req.params;
      const device = await Device.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email'],
          },
        ],
      });

      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      res.status(200).json(device);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve device', error: error.message });
    }
  }

  // DELETE /api/v1/admin/devices/:id - Delete any device
  async deleteDevice(req, res) {
    try {
      const { id } = req.params;
      const { DeviceConfiguration } = require('../models');

      const device = await Device.findByPk(id);
      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      // Delete related configurations
      await DeviceConfiguration.destroy({ where: { device_id: id } });

      // Delete chart relationships if table exists
      try {
        await sequelize.query('DELETE FROM chart_devices WHERE device_id = ?', {
          replacements: [id],
          type: sequelize.QueryTypes.DELETE,
        });
      } catch (chartError) {
        // Table might not exist
        console.log('Chart-device table not found (ok in tests)');
      }

      await device.destroy();

      res.status(200).json({ message: 'Device deleted successfully', success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete device', error: error.message });
    }
  }

  // GET /api/v1/admin/stats - System statistics
  async getStats(req, res) {
    try {
      const [totalUsers, activeUsers, adminUsers, totalDevices, activeDevices] = await Promise.all([
        User.count(),
        User.count({ where: { is_active: true } }),
        User.count({ where: { is_admin: true } }),
        Device.count(),
        Device.count({ where: { status: 'active' } }),
      ]);

      res.status(200).json({
        totalUsers,
        activeUsers,
        adminUsers,
        totalDevices,
        activeDevices,
        inactiveUsers: totalUsers - activeUsers,
        offlineDevices: totalDevices - activeDevices,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve statistics', error: error.message });
    }
  }

  // GET /api/v1/admin/users/:id/devices - Get user's devices
  async getUserDevices(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const devices = await Device.findAll({
        where: { user_id: id },
        order: [['created_at', 'DESC']],
      });

      res.status(200).json(devices);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve user devices', error: error.message });
    }
  }
}

module.exports = new AdminV1Controller();
