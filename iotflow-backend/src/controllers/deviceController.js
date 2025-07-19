const Device = require('../models/device');
const DeviceAuth = require('../models/deviceAuth');
const DeviceConfiguration = require('../models/deviceConfiguration');
const crypto = require('crypto');

class DeviceController {
  async createDevice(req, res) {
    try {
      console.log('📝 Creating device with request body:', req.body);
      console.log('🔐 User from auth middleware:', req.user ? { id: req.user.id, email: req.user.email } : 'No user');

      const {
        name,
        description,
        device_type,
        status,
        location,
        firmware_version,
        hardware_version
      } = req.body;

      // Validate required fields
      if (!name || !device_type) {
        return res.status(400).json({
          message: 'Missing required fields',
          required: ['name', 'device_type'],
          received: { name, device_type }
        });
      }

      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'User authentication required' });
      }

      console.log('📦 Creating device with data:', {
        name,
        description,
        device_type,
        status: status || 'offline',
        location,
        firmware_version,
        hardware_version,
        user_id: req.user.id,
      });

      const newDevice = await Device.create({
        name,
        description,
        device_type,
        status: status || 'offline',
        location,
        firmware_version,
        hardware_version,
        user_id: req.user.id,
      });

      console.log('✅ Device created successfully:', newDevice.toJSON());
      res.status(201).json(newDevice);
    } catch (error) {
      console.error('❌ Device creation failed:', error);
      res.status(500).json({ message: 'Failed to create device', error: error.message });
    }
  }

  async getDevice(req, res) {
    try {
      const { id } = req.params;
      const device = await Device.findOne({
        where: { id, user_id: req.user.id }
      });

      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      res.status(200).json(device);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve device', error: error.message });
    }
  }

  async getAllDevices(req, res) {
    try {
      const { page = 1, limit = 10, status, device_type } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = { user_id: req.user.id };
      if (status) whereClause.status = status;
      if (device_type) whereClause.device_type = device_type;

      const devices = await Device.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      res.status(200).json({
        devices: devices.rows,
        total: devices.count,
        page: parseInt(page),
        totalPages: Math.ceil(devices.count / limit),
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve devices', error: error.message });
    }
  }

  async updateDevice(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      updates.updated_at = new Date();

      const [updated] = await Device.update(updates, {
        where: { id, user_id: req.user.id }
      });

      if (!updated) {
        return res.status(404).json({ message: 'Device not found' });
      }

      const updatedDevice = await Device.findByPk(id);
      res.status(200).json(updatedDevice);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update device', error: error.message });
    }
  }

  async deleteDevice(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Device.destroy({
        where: { id, user_id: req.user.id }
      });

      if (!deleted) {
        return res.status(404).json({ message: 'Device not found' });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete device', error: error.message });
    }
  }

  async updateDeviceStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const [updated] = await Device.update(
        { status, last_seen: new Date() },
        { where: { id, user_id: req.user.id } }
      );

      if (!updated) {
        return res.status(404).json({ message: 'Device not found' });
      }

      res.status(200).json({ message: 'Device status updated', status });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update device status', error: error.message });
    }
  }

  async getDeviceConfigurations(req, res) {
    try {
      const { id } = req.params;
      const device = await Device.findOne({ where: { id, user_id: req.user.id } });

      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      const configurations = await DeviceConfiguration.findAll({
        where: { device_id: id, is_active: true }
      });

      res.status(200).json(configurations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve configurations', error: error.message });
    }
  }

  async updateDeviceConfiguration(req, res) {
    try {
      const { id } = req.params;
      const { config_key, config_value, data_type } = req.body;

      const device = await Device.findOne({ where: { id, user_id: req.user.id } });
      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      const [configuration, created] = await DeviceConfiguration.findOrCreate({
        where: { device_id: id, config_key },
        defaults: {
          device_id: id,
          config_key,
          config_value,
          data_type: data_type || 'string',
          is_active: true,
        }
      });

      if (!created) {
        await configuration.update({
          config_value,
          data_type: data_type || configuration.data_type,
          updated_at: new Date()
        });
      }

      res.status(200).json(configuration);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update configuration', error: error.message });
    }
  }
}

module.exports = new DeviceController();