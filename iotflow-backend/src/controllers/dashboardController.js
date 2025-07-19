const Device = require('../models/device');
const User = require('../models/user');
const DeviceConfiguration = require('../models/deviceConfiguration');
const { Op } = require('sequelize');

class DashboardController {
  async getOverview(req, res) {
    try {
      const userId = req.user.id;

      // Get device counts by status
      const deviceStats = await Device.findAll({
        where: { user_id: userId },
        attributes: [
          'status',
          [Device.sequelize.fn('COUNT', Device.sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      // Get total devices
      const totalDevices = await Device.count({ where: { user_id: userId } });

      // Get devices by type
      const deviceTypes = await Device.findAll({
        where: { user_id: userId },
        attributes: [
          'device_type',
          [Device.sequelize.fn('COUNT', Device.sequelize.col('id')), 'count']
        ],
        group: ['device_type'],
        raw: true
      });

      // Get recent devices (last 7 days)
      const recentDevices = await Device.findAll({
        where: {
          user_id: userId,
          created_at: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        order: [['created_at', 'DESC']],
        limit: 10
      });

      res.status(200).json({
        totalDevices,
        deviceStats,
        deviceTypes,
        recentDevices
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get overview', error: error.message });
    }
  }

  async getDeviceActivity(req, res) {
    try {
      const userId = req.user.id;
      const { days = 30 } = req.query;

      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const activity = await Device.findAll({
        where: {
          user_id: userId,
          last_seen: {
            [Op.gte]: startDate
          }
        },
        attributes: [
          [Device.sequelize.fn('DATE', Device.sequelize.col('last_seen')), 'date'],
          [Device.sequelize.fn('COUNT', Device.sequelize.col('id')), 'active_devices']
        ],
        group: [Device.sequelize.fn('DATE', Device.sequelize.col('last_seen'))],
        order: [[Device.sequelize.fn('DATE', Device.sequelize.col('last_seen')), 'ASC']],
        raw: true
      });

      res.status(200).json(activity);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get device activity', error: error.message });
    }
  }

  async getAlerts(req, res) {
    try {
      const userId = req.user.id;

      // Get offline devices (haven't been seen in last 24 hours)
      const offlineDevices = await Device.findAll({
        where: {
          user_id: userId,
          [Op.or]: [
            { last_seen: { [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
            { last_seen: null }
          ]
        }
      });

      // Get devices with critical status
      const criticalDevices = await Device.findAll({
        where: {
          user_id: userId,
          status: 'critical'
        }
      });

      const alerts = [
        ...offlineDevices.map(device => ({
          type: 'offline',
          severity: 'warning',
          device_id: device.id,
          device_name: device.name,
          message: `Device ${device.name} has been offline for more than 24 hours`
        })),
        ...criticalDevices.map(device => ({
          type: 'critical',
          severity: 'error',
          device_id: device.id,
          device_name: device.name,
          message: `Device ${device.name} is in critical status`
        }))
      ];

      res.status(200).json(alerts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get alerts', error: error.message });
    }
  }

  async getSystemHealth(req, res) {
    try {
      const userId = req.user.id;

      const totalDevices = await Device.count({ where: { user_id: userId } });
      const onlineDevices = await Device.count({
        where: {
          user_id: userId,
          status: 'online'
        }
      });

      const healthPercentage = totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 0;

      res.status(200).json({
        totalDevices,
        onlineDevices,
        offlineDevices: totalDevices - onlineDevices,
        healthPercentage: Math.round(healthPercentage)
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get system health', error: error.message });
    }
  }
}

module.exports = new DashboardController();
