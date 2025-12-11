const Device = require('../models/device');
const DeviceConfiguration = require('../models/deviceConfiguration');
const User = require('../models/user');
const { sequelize } = require('../utils/db');
const notificationService = require('../services/notificationService');

class DeviceController {
  // Admin: get all devices from all users
  async adminGetAllDevices(req, res) {
    try {
      console.log('🔍 [ADMIN] Getting all devices');
      console.log('👤 [ADMIN] Requested by user:', req.user?.username, '(ID:', req.user?.id, ')');
      console.log('🔑 [ADMIN] User is_admin:', req.user?.is_admin);

      const { status, device_type, user_id } = req.query;
      const whereClause = {};

      if (status) whereClause.status = status;
      if (device_type) whereClause.device_type = device_type;
      if (user_id) whereClause.user_id = user_id;

      console.log('📋 [ADMIN] Query filters:', whereClause);

      const devices = await Device.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email'],
          },
        ],
      });

      console.log('✅ [ADMIN] Found devices:', devices.length);
      console.log(
        '📱 [ADMIN] First device:',
        devices[0]
          ? {
              id: devices[0].id,
              name: devices[0].name,
              user_id: devices[0].user_id,
              owner: devices[0].user?.username,
            }
          : 'No devices'
      );

      res.status(200).json({ devices, total: devices.length });
    } catch (error) {
      console.error('❌ [ADMIN] Admin get all devices error:', error);
      res.status(500).json({ message: 'Failed to retrieve devices', error: error.message });
    }
  }

  // Admin: delete any device
  // adminDeleteDevice removed - consolidated into deleteDevice method
  // The standard deleteDevice now checks if user is admin and allows deletion accordingly

  async createDevice(req, res) {
    try {
      const { name, description, device_type, location, firmware_version, hardware_version } =
        req.body;

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

      // Send real-time notification for device creation
      await notificationService.notifyDeviceCreated(req.user.id, newDevice);

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
      const { status, device_type, group_id } = req.query;
      const { Group, DeviceGroupAssociation } = require('../models');

      const whereClause = { user_id: req.user.id };
      if (status) whereClause.status = status;
      if (device_type) whereClause.device_type = device_type;

      let devices;

      // Filter by group_id (many-to-many)
      if (group_id !== undefined) {
        if (group_id === 'null' || group_id === null) {
          // Get devices that don't belong to any group
          const devicesInGroups = await DeviceGroupAssociation.findAll({
            attributes: ['device_id'],
            where: { device_id: { [require('sequelize').Op.ne]: null } },
          });
          const deviceIdsInGroups = devicesInGroups.map(d => d.device_id);

          whereClause.id = {
            [require('sequelize').Op.notIn]: deviceIdsInGroups.length > 0 ? deviceIdsInGroups : [0],
          };

          devices = await Device.findAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
          });
        } else {
          // Get devices in specific group
          const group = await Group.findByPk(parseInt(group_id), {
            include: [
              {
                model: Device,
                as: 'devices',
                where: whereClause,
                through: { attributes: [] },
              },
            ],
          });

          devices = group ? group.devices : [];
        }
      } else {
        // No group filter, get all devices
        devices = await Device.findAll({
          where: whereClause,
          order: [['created_at', 'DESC']],
        });
      }

      res.status(200).json({ devices });
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve devices', error: error.message });
    }
  }

  async updateDevice(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        device_type,
        status,
        location,
        firmware_version,
        hardware_version,
      } = req.body;

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

      // Send real-time notification for device update
      await notificationService.notifyDeviceUpdated(req.user.id, updatedDevice);

      res.status(200).json(updatedDevice);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update device', error: error.message });
    }
  }

  async deleteDevice(req, res) {
    try {
      const { id } = req.params;

      console.log(`Deleting device ${id} and all related records...`);

      // Consolidated logic: Admin can delete any device, regular user only their own
      const whereClause = req.user.is_admin
        ? { id } // Admin: no user_id restriction
        : { id, user_id: req.user.id }; // Regular user: must own the device

      // First, get the device details for notification
      const device = await Device.findOne({ where: whereClause });

      if (!device) {
        console.error(
          `Device not found: id=${id}, user_id=${req.user.id}, is_admin=${req.user.is_admin}`
        );
        return res.status(404).json({ message: 'Device not found' });
      }

      // Delete ALL related records first
      console.log(`Deleting config, chart relationships for device ${id}`);

      // 1. Delete device configuration
      const configDeleted = await DeviceConfiguration.destroy({ where: { device_id: id } });
      console.log(`DeviceConfiguration records deleted: ${configDeleted}`);

      // 2. Delete chart-device relationships (manual table) - handle if table doesn't exist
      try {
        const chartDeleted = await sequelize.query(
          'DELETE FROM chart_devices WHERE device_id = ?',
          {
            replacements: [id],
            type: sequelize.QueryTypes.DELETE,
          }
        );
        console.log(`Chart-device relationships deleted:`, chartDeleted);
      } catch (chartError) {
        // Table might not exist in test environment
        console.log(`Chart-device table not found (ok in tests):`, chartError.message);
      }

      // 3. Finally delete the device (use same where clause for consistency)
      const deleted = await Device.destroy({ where: whereClause });
      console.log(`Device deleted count: ${deleted}`);

      if (!deleted) {
        console.error(`Device destroy returned 0: id=${id}`);
        return res.status(404).json({ message: 'Device not found' });
      }

      // Send real-time notification for device deletion
      await notificationService.notifyDeviceDeleted(req.user.id, device.name, device.id);

      console.log(`Device ${id} and all related records deleted successfully`);
      res.json({ success: true, message: 'Device deleted successfully' });
    } catch (error) {
      console.error('Device deletion error:', error);
      if (error instanceof Error && error.message) {
        res.status(500).json({ message: 'Failed to delete device', error: error.message });
      } else {
        res.status(500).json({ message: 'Failed to delete device', error });
      }
    }
  }

  async getDeviceConfiguration(req, res) {
    try {
      const { id } = req.params;
      const configs = await DeviceConfiguration.findAll({ where: { device_id: id } });

      if (!configs || configs.length === 0) {
        return res.status(404).json({ message: 'Configuration not found' });
      }

      // Convert array of key-value pairs to object
      const configuration = {};
      configs.forEach(config => {
        try {
          configuration[config.config_key] = JSON.parse(config.config_value);
        } catch {
          configuration[config.config_key] = config.config_value;
        }
      });

      res.status(200).json({ configuration });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get configuration', error: error.message });
    }
  }

  async updateDeviceConfiguration(req, res) {
    try {
      const { id } = req.params;
      const { configuration } = req.body;

      // Get device name for notification
      const device = await Device.findOne({
        where: { id, user_id: req.user.id },
      });

      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      // Delete existing configurations for this device
      await DeviceConfiguration.destroy({ where: { device_id: id } });

      // Create new configurations from the object
      const configEntries = [];
      if (configuration && typeof configuration === 'object') {
        for (const [key, value] of Object.entries(configuration)) {
          configEntries.push({
            device_id: id,
            config_key: key,
            config_value: JSON.stringify(value),
            data_type: typeof value,
            is_active: true,
          });
        }
      }

      // Bulk create configurations
      const configs = await DeviceConfiguration.bulkCreate(configEntries);

      // Send notification for configuration update
      await notificationService.createNotification(req.user.id, {
        type: 'info',
        title: 'Device Configuration Updated',
        message: `Configuration for device "${device.name}" has been updated`,
        device_id: device.id,
        source: 'device_configuration',
        metadata: { action: 'config_update', device_type: device.device_type },
      });

      res.status(200).json({ configuration: configs });
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
        updated_at: new Date().toISOString(),
      };

      // Store in a simple in-memory store for demo (in production, use a database)
      if (!global.deviceControls) {
        global.deviceControls = {};
      }
      global.deviceControls[controlId] = controlCommand;

      // Send notification for device control command
      await notificationService.createNotification(req.user.id, {
        type: 'info',
        title: 'Device Command Sent',
        message: `Command "${command}" sent to device "${device.name}"`,
        device_id: device.id,
        source: 'device_control',
        metadata: { command, parameters: parameters || {}, control_id: controlId },
      });

      // Simulate async processing
      setTimeout(
        () => {
          if (global.deviceControls[controlId]) {
            global.deviceControls[controlId].status = 'acknowledged';
            global.deviceControls[controlId].updated_at = new Date().toISOString();

            // Simulate execution after acknowledgment
            setTimeout(
              () => {
                if (global.deviceControls[controlId]) {
                  global.deviceControls[controlId].status =
                    Math.random() > 0.1 ? 'completed' : 'failed';
                  global.deviceControls[controlId].updated_at = new Date().toISOString();
                  global.deviceControls[controlId].completed_at = new Date().toISOString();

                  if (global.deviceControls[controlId].status === 'failed') {
                    global.deviceControls[controlId].error_message = 'Simulated execution failure';
                  }
                }
              },
              2000 + Math.random() * 3000
            ); // 2-5 seconds execution time
          }
        },
        500 + Math.random() * 1500
      ); // 0.5-2 seconds acknowledgment time

      res.status(200).json({
        control_id: controlId,
        device_id: parseInt(id),
        command,
        parameters: parameters || {},
        status: 'pending',
        timestamp: new Date().toISOString(),
        message: `Command '${command}' queued for device ${device.name}`,
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
          : null,
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
        .filter(
          cmd =>
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
          updated_at: cmd.updated_at,
        })),
        total: pendingCommands.length,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get pending controls', error: error.message });
    }
  }
}

const deviceControllerInstance = new DeviceController();
module.exports = deviceControllerInstance;
