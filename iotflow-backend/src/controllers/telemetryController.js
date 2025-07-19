const TelemetryData = require('../models/telemetryData');
const Device = require('../models/device');
const { Op } = require('sequelize');

class TelemetryController {
  async submitTelemetry(req, res) {
    try {
      const { device_id, data_type, value, unit, metadata } = req.body;

      // Verify device belongs to user
      const device = await Device.findOne({
        where: { id: device_id, user_id: req.user.id }
      });

      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      // Update device last_seen
      await device.update({ last_seen: new Date() });

      // Create telemetry record
      const telemetryData = await TelemetryData.create({
        device_id,
        data_type,
        value,
        unit,
        metadata,
        timestamp: new Date()
      });

      res.status(201).json(telemetryData);
    } catch (error) {
      res.status(500).json({ message: 'Failed to submit telemetry', error: error.message });
    }
  }

  async getTelemetryData(req, res) {
    try {
      const { device_id } = req.params;
      const {
        data_type,
        start_date,
        end_date,
        limit = 100,
        page = 1
      } = req.query;

      // Verify device belongs to user
      const device = await Device.findOne({
        where: { id: device_id, user_id: req.user.id }
      });

      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      const whereClause = { device_id };

      if (data_type) {
        whereClause.data_type = data_type;
      }

      if (start_date || end_date) {
        whereClause.timestamp = {};
        if (start_date) whereClause.timestamp[Op.gte] = new Date(start_date);
        if (end_date) whereClause.timestamp[Op.lte] = new Date(end_date);
      }

      const offset = (page - 1) * limit;

      const telemetryData = await TelemetryData.findAndCountAll({
        where: whereClause,
        order: [['timestamp', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.status(200).json({
        data: telemetryData.rows,
        total: telemetryData.count,
        page: parseInt(page),
        totalPages: Math.ceil(telemetryData.count / limit)
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get telemetry data', error: error.message });
    }
  }

  async getAggregatedData(req, res) {
    try {
      const { device_id } = req.params;
      const {
        data_type,
        start_date,
        end_date,
        aggregation = 'hour' // hour, day, week, month
      } = req.query;

      // Verify device belongs to user
      const device = await Device.findOne({
        where: { id: device_id, user_id: req.user.id }
      });

      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      const whereClause = { device_id };

      if (data_type) {
        whereClause.data_type = data_type;
      }

      if (start_date || end_date) {
        whereClause.timestamp = {};
        if (start_date) whereClause.timestamp[Op.gte] = new Date(start_date);
        if (end_date) whereClause.timestamp[Op.lte] = new Date(end_date);
      }

      // Define aggregation format based on requested period
      let dateFormat;
      switch (aggregation) {
        case 'hour':
          dateFormat = '%Y-%m-%d %H:00:00';
          break;
        case 'day':
          dateFormat = '%Y-%m-%d';
          break;
        case 'week':
          dateFormat = '%Y-%u';
          break;
        case 'month':
          dateFormat = '%Y-%m';
          break;
        default:
          dateFormat = '%Y-%m-%d %H:00:00';
      }

      const aggregatedData = await TelemetryData.findAll({
        where: whereClause,
        attributes: [
          [TelemetryData.sequelize.fn('DATE_FORMAT', TelemetryData.sequelize.col('timestamp'), dateFormat), 'period'],
          'data_type',
          [TelemetryData.sequelize.fn('AVG', TelemetryData.sequelize.col('value')), 'avg_value'],
          [TelemetryData.sequelize.fn('MIN', TelemetryData.sequelize.col('value')), 'min_value'],
          [TelemetryData.sequelize.fn('MAX', TelemetryData.sequelize.col('value')), 'max_value'],
          [TelemetryData.sequelize.fn('COUNT', TelemetryData.sequelize.col('value')), 'count']
        ],
        group: [
          TelemetryData.sequelize.fn('DATE_FORMAT', TelemetryData.sequelize.col('timestamp'), dateFormat),
          'data_type'
        ],
        order: [
          [TelemetryData.sequelize.fn('DATE_FORMAT', TelemetryData.sequelize.col('timestamp'), dateFormat), 'ASC']
        ],
        raw: true
      });

      res.status(200).json(aggregatedData);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get aggregated data', error: error.message });
    }
  }

  async getLatestValues(req, res) {
    try {
      const { device_id } = req.params;

      // Verify device belongs to user
      const device = await Device.findOne({
        where: { id: device_id, user_id: req.user.id }
      });

      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      // Get latest value for each data type
      const latestData = await TelemetryData.findAll({
        where: { device_id },
        attributes: [
          'data_type',
          'value',
          'unit',
          'timestamp',
          [TelemetryData.sequelize.fn('MAX', TelemetryData.sequelize.col('timestamp')), 'max_timestamp']
        ],
        group: ['data_type'],
        order: [['timestamp', 'DESC']],
        raw: true
      });

      res.status(200).json(latestData);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get latest values', error: error.message });
    }
  }
}

module.exports = new TelemetryController();
