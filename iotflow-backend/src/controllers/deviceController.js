const Device = require('../models/device');
const DeviceConfiguration = require('../models/deviceConfiguration');
const DeviceAuth = require('../models/deviceAuth');
const TelemetryData = require('../models/telemetryData');
const { sequelize } = require('../utils/db');

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

      console.log(`Deleting device ${id} and all related records...`);

      // Temporarily disable foreign key constraints for this operation
      await sequelize.query('PRAGMA foreign_keys = OFF');

      try {
        // Delete ALL related records first

        // 1. Delete telemetry data
        await TelemetryData.destroy({ where: { device_id: id } });

        // 2. Delete device authentication records
        await DeviceAuth.destroy({ where: { device_id: id } });

        // 3. Delete device configuration
        await DeviceConfiguration.destroy({ where: { device_id: id } });

        // 4. Delete chart-device relationships (manual table)
        await sequelize.query('DELETE FROM chart_devices WHERE device_id = ?', {
          replacements: [id],
          type: sequelize.QueryTypes.DELETE
        });

        // 5. Finally delete the device
        const deleted = await Device.destroy({
          where: { id, user_id: req.user.id },
        });

        if (!deleted) {
          return res.status(404).json({ message: 'Device not found' });
        }

        console.log(`Device ${id} and all related records deleted successfully`);
        res.json({ success: true, message: 'Device deleted successfully' });

      } finally {
        // Re-enable foreign key constraints
        await sequelize.query('PRAGMA foreign_keys = ON');
      }

    } catch (error) {
      console.error('Device deletion error:', error);
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

  // ==================== DEVICE CONTROL METHODS ====================

  async sendDeviceControl(req, res) {
    try {
      const { id } = req.params;
      const { command, parameters } = req.body;

      // Verify device belongs to user
      const device = await Device.findOne({
        where: { id, user_id: req.user.id },
      });

      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      if (!command) {
        return res.status(400).json({ message: 'Command is required' });
      }

      // Generate a control ID for tracking
      const controlId = `ctrl_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

      // In a real system, you would:
      // 1. Store the command in a commands table
      // 2. Queue it for the device (via MQTT, WebSocket, etc.)
      // 3. Track the status

      // For demo, simulate the command being queued
      const controlCommand = {
        control_id: controlId,
        device_id: parseInt(id),
        user_id: req.user.id,
        command,
        parameters: parameters || {},
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store in a simple in-memory store for demo (in production, use a database)
      if (!global.deviceControls) {
        global.deviceControls = {};
      }
      global.deviceControls[controlId] = controlCommand;

      // Simulate async processing
      setTimeout(() => {
        if (global.deviceControls[controlId]) {
          global.deviceControls[controlId].status = 'acknowledged';
          global.deviceControls[controlId].updated_at = new Date().toISOString();

          // Simulate execution after acknowledgment
          setTimeout(() => {
            if (global.deviceControls[controlId]) {
              global.deviceControls[controlId].status = Math.random() > 0.1 ? 'completed' : 'failed';
              global.deviceControls[controlId].updated_at = new Date().toISOString();
              global.deviceControls[controlId].completed_at = new Date().toISOString();

              if (global.deviceControls[controlId].status === 'failed') {
                global.deviceControls[controlId].error_message = 'Simulated execution failure';
              }
            }
          }, 2000 + Math.random() * 3000); // 2-5 seconds execution time
        }
      }, 500 + Math.random() * 1500); // 0.5-2 seconds acknowledgment time

      res.status(200).json({
        control_id: controlId,
        device_id: parseInt(id),
        command,
        parameters: parameters || {},
        status: 'pending',
        timestamp: new Date().toISOString(),
        message: `Command '${command}' queued for device ${device.name}`
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to send control command', error: error.message });
    }
  }

  async getControlStatus(req, res) {
    try {
      const { id, controlId } = req.params;

      // Verify device belongs to user
      const device = await Device.findOne({
        where: { id, user_id: req.user.id },
      });

      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      // Get control command from store
      const controlCommand = global.deviceControls?.[controlId];

      if (!controlCommand) {
        return res.status(404).json({ message: 'Control command not found' });
      }

      // Verify the control belongs to this device and user
      if (controlCommand.device_id !== parseInt(id) || controlCommand.user_id !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.status(200).json({
        control_id: controlId,
        device_id: parseInt(id),
        command: controlCommand.command,
        parameters: controlCommand.parameters,
        status: controlCommand.status,
        created_at: controlCommand.created_at,
        updated_at: controlCommand.updated_at,
        completed_at: controlCommand.completed_at,
        error_message: controlCommand.error_message,
        execution_time: controlCommand.completed_at
          ? new Date(controlCommand.completed_at) - new Date(controlCommand.created_at)
          : null
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get control status', error: error.message });
    }
  }

  async getPendingControls(req, res) {
    try {
      const { id } = req.params;

      // Verify device belongs to user
      const device = await Device.findOne({
        where: { id, user_id: req.user.id },
      });

      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      // Get pending controls for this device and user
      const allControls = global.deviceControls || {};
      const pendingCommands = Object.values(allControls)
        .filter(cmd =>
          cmd.device_id === parseInt(id) &&
          cmd.user_id === req.user.id &&
          ['pending', 'acknowledged', 'executing'].includes(cmd.status)
        )
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      res.status(200).json({
        device_id: parseInt(id),
        pending_commands: pendingCommands.map(cmd => ({
          control_id: cmd.control_id,
          command: cmd.command,
          parameters: cmd.parameters,
          status: cmd.status,
          created_at: cmd.created_at,
          updated_at: cmd.updated_at
        })),
        total: pendingCommands.length
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get pending controls', error: error.message });
    }
  }
}

module.exports = new DeviceController();