const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { Op } = require('sequelize');

class UserController {
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      console.log('Registration attempt:', { username, email });

      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email }, { username }]
        }
      });

      console.log('Existing user check result:', existingUser);

      if (existingUser) {
        console.log('User already exists:', existingUser.email);
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        username,
        email,
        password_hash,
        is_active: true,
        is_admin: false,
        role: 'user',
        tenant_id: 'default',
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Remove password from response
      const { password_hash: _, ...userResponse } = newUser.toJSON();

      res.status(201).json(userResponse);
    } catch (error) {
      res.status(500).json({ message: 'Failed to register user', error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
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
        message: 'Login successful'
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
      const userId = req.user.id;
      const { username, email, password } = req.body;

      const updates = { updated_at: new Date() };
      if (username) updates.username = username;
      if (email) updates.email = email;
      if (password) {
        updates.password_hash = await bcrypt.hash(password, 10);
      }

      const [updated] = await User.update(updates, { where: { id: userId } });

      if (!updated) {
        return res.status(404).json({ message: 'User not found' });
      }

      const updatedUser = await User.findByPk(userId);
      const { password_hash: _, ...userResponse } = updatedUser.toJSON();

      res.status(200).json(userResponse);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update profile', error: error.message });
    }
  }

  async createUser(req, res) {
    try {
      const { username, email, password_hash, role = 'user', tenant_id = 'default' } = req.body;
      const newUser = await User.create({
        username,
        email,
        password_hash,
        is_active: true,
        is_admin: false,
        role,
        tenant_id,
        created_at: new Date(),
        updated_at: new Date(),
      });
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create user', error });
    }
  }

  async getUser(req, res) {
    try {
      const userId = req.params.id;
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve user', error });
    }
  }

  async updateUser(req, res) {
    try {
      const userId = req.params.id;
      const { username, email, password_hash, is_active, is_admin, role, tenant_id } = req.body;
      const [updated] = await User.update(
        { username, email, password_hash, is_active, is_admin, role, tenant_id, updated_at: new Date() },
        { where: { id: userId } }
      );
      if (!updated) {
        return res.status(404).json({ message: 'User not found' });
      }
      const updatedUser = await User.findByPk(userId);
      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user', error });
    }
  }

  async deleteUser(req, res) {
    try {
      const userId = req.params.id;
      const deleted = await User.destroy({ where: { id: userId } });
      if (!deleted) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete user', error });
    }
  }
}

module.exports = new UserController();