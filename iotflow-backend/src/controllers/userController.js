const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { Op } = require('sequelize');

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

      await User.update(
        { api_key: newApiKey, updated_at: new Date() },
        { where: { id: userId } }
      );

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

      res.status(200).json(userResponse);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update profile', error: error.message });
    }
  }

  async createUser(req, res) {
    try {
      const { username, email, password, role = 'user', tenant_id = 'default' } = req.body;

      const password_hash = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        username,
        email,
        password_hash,
        role,
        tenant_id,
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
      const { username, email, password, is_active, is_admin, role, tenant_id } = req.body;

      const updates = { username, email, is_active, is_admin, role, tenant_id, updated_at: new Date() };
      if (password) {
        updates.password_hash = await bcrypt.hash(password, 10);
      }

      const [updated] = await User.update(updates, { where: { id } });

      if (!updated) {
        return res.status(404).json({ message: 'User not found' });
      }
      const updatedUser = await User.findByPk(id);
      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user', error: error.message });
    }
  }

  async deleteUser(req, res) {
    try {
      const deleted = await User.destroy({ where: { id: req.params.id } });
      if (!deleted) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete user', error: error.message });
    }
  }
}

module.exports = new UserController();