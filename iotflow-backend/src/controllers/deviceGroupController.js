const { Group, Device, DeviceGroupAssociation } = require('../models');
const { sequelize } = require('../utils/db');

class DeviceGroupController {
  // Create a new group
  async createGroup(req, res) {
    try {
      const { name, description, color, icon } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }

      const newGroup = await Group.create({
        name,
        description,
        color,
        icon,
        user_id: req.user.id,
      });

      res.status(201).json(newGroup);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create group', error: error.message });
    }
  }

  // Get all groups for the authenticated user
  async getAllGroups(req, res) {
    try {
      const groups = await Group.findAll({
        where: { user_id: req.user.id },
        include: [
          {
            model: Device,
            as: 'devices',
            attributes: ['id'],
            through: { attributes: [] }, // Exclude junction table attributes
          },
        ],
        order: [['created_at', 'DESC']],
      });

      // Add device count to each group
      const groupsWithCount = groups.map(group => {
        const groupData = group.toJSON();
        groupData.device_count = groupData.devices ? groupData.devices.length : 0;
        delete groupData.devices; // Remove devices array, just keep count
        return groupData;
      });

      res.status(200).json(groupsWithCount);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve groups', error: error.message });
    }
  }

  // Get a single group by ID
  async getGroup(req, res) {
    try {
      const { id } = req.params;

      const group = await Group.findOne({
        where: { id, user_id: req.user.id },
        include: [
          {
            model: Device,
            as: 'devices',
            attributes: ['id', 'name', 'device_type', 'status', 'location'],
            through: { attributes: [] }, // Exclude junction table attributes
          },
        ],
      });

      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }

      res.status(200).json(group);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve group', error: error.message });
    }
  }

  // Update a group
  async updateGroup(req, res) {
    try {
      const { id } = req.params;
      const { name, description, color, icon } = req.body;

      const group = await Group.findOne({
        where: { id, user_id: req.user.id },
      });

      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }

      const updatedGroup = await group.update({
        name,
        description,
        color,
        icon,
        updated_at: new Date(),
      });

      res.status(200).json(updatedGroup);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update group', error: error.message });
    }
  }

  // Delete a group
  async deleteGroup(req, res) {
    try {
      const { id } = req.params;

      const group = await Group.findOne({
        where: { id, user_id: req.user.id },
      });

      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }

      // Delete all associations (Sequelize will handle this with cascade)
      await group.destroy();

      res.status(200).json({ message: 'Group deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete group', error: error.message });
    }
  }

  // Add device(s) to group
  async addDeviceToGroup(req, res) {
    try {
      const { id } = req.params;
      // Support both snake_case (device_id, device_ids) and camelCase (deviceId, deviceIds)
      const { device_id, device_ids, deviceId, deviceIds } = req.body;

      const group = await Group.findOne({
        where: { id, user_id: req.user.id },
      });

      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }

      // Handle single device or multiple devices (support both naming conventions)
      const deviceIdsToAdd = device_ids || deviceIds || [device_id || deviceId];

      // Verify all devices belong to the user
      const devices = await Device.findAll({
        where: {
          id: deviceIdsToAdd,
          user_id: req.user.id,
        },
      });

      if (devices.length !== deviceIdsToAdd.length) {
        return res.status(404).json({ message: 'One or more devices not found' });
      }

      // Add devices to group
      await group.addDevices(devices);

      res.status(200).json({ message: 'Device(s) added to group successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to add device to group', error: error.message });
    }
  }

  // Remove device from group
  async removeDeviceFromGroup(req, res) {
    try {
      const { id, deviceId } = req.params;

      const group = await Group.findOne({
        where: { id, user_id: req.user.id },
      });

      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }

      const device = await Device.findOne({
        where: { id: deviceId, user_id: req.user.id },
      });

      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      await group.removeDevice(device);

      res.status(200).json({ message: 'Device removed from group successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to remove device from group', error: error.message });
    }
  }

  // Get all groups for a device
  async getDeviceGroups(req, res) {
    try {
      const { id } = req.params;

      const device = await Device.findOne({
        where: { id, user_id: req.user.id },
        include: [
          {
            model: Group,
            as: 'groups',
            through: { attributes: [] },
          },
        ],
      });

      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      res.status(200).json(device.groups);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve device groups', error: error.message });
    }
  }
}

module.exports = new DeviceGroupController();
