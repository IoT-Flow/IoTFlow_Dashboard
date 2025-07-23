const Device = require('../models/device');
const DeviceConfiguration = require('../models/deviceConfiguration');

class DeviceController {
  async createDevice(req, res) {
    try {
      const { name, description, device_type, location, firmware_version, hardware_version } = req.body;

      if (!name || !device_type) {
        return res.status(400).json({ message: 'Name and device_type are required' });
      }

      const newDevice = await Device.create({
        name,
        description,
        device_type,
        status: 'offline',
        location,
        firmware_version,
        hardware_version,
        user_id: req.user.id,
      });

      res.status(201).json(newDevice);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create device', error: error.message });
    }
  }

  async getDevice(req, res) {
    try {
      const { id } = req.params;
      const device = await Device.findOne({
        where: { id, user_id: req.user.id },
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
      const { status, device_type } = req.query;
      const whereClause = { user_id: req.user.id };
      if (status) whereClause.status = status;
      if (device_type) whereClause.device_type = device_type;
      // Fetch all devices for the user, no limit or pagination
      const devices = await Device.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
      });
      res.status(200).json({ devices });
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve devices', error: error.message });
    }
  }

  async updateDevice(req, res) {
    try {
      const { id } = req.params;
      const { name, description, device_type, status, location, firmware_version, hardware_version } = req.body;

      const device = await Device.findOne({
        where: { id, user_id: req.user.id },
      });

      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      const updatedDevice = await device.update({
        name,
        description,
        device_type,
        status,
        location,
        firmware_version,
        hardware_version,
        updated_at: new Date(),
      });

      res.status(200).json(updatedDevice);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update device', error: error.message });
    }
  }

  async deleteDevice(req, res) {
    try {
      const { id } = req.params;
      // Delete related device configuration first
      await DeviceConfiguration.destroy({ where: { device_id: id } });
      // TODO: Delete other related records (e.g., telemetry) if needed
      const deleted = await Device.destroy({
        where: { id, user_id: req.user.id },
      });
      if (!deleted) {
        return res.status(404).json({ message: 'Device not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete device', error: error.message });
    }
  }

  async getDeviceConfiguration(req, res) {
    try {
      const { id } = req.params;
      const config = await DeviceConfiguration.findOne({ where: { device_id: id } });

      if (!config) {
        return res.status(404).json({ message: 'Configuration not found' });
      }

      res.status(200).json(config);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get configuration', error: error.message });
    }
  }

  async updateDeviceConfiguration(req, res) {
    try {
      const { id } = req.params;
      const { configuration } = req.body;

      const [config, created] = await DeviceConfiguration.findOrCreate({
        where: { device_id: id },
        defaults: { configuration },
      });

      if (!created) {
        await config.update({ configuration });
      }

      res.status(200).json(config);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update configuration', error: error.message });
    }
  }
}

module.exports = new DeviceController();