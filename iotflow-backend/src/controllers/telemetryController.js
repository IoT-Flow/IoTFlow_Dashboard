const TelemetryData = require('../models/telemetryData');
const Device = require('../models/device');
const { Op, Sequelize } = require('sequelize');

class TelemetryController {
  async submitTelemetry(req, res) {
    try {
      const { device_id, data_type, value, unit, metadata } = req.body;

      const device = await Device.findByPk(device_id);
      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      // Update device last_seen and status
      await device.update({ last_seen: new Date(), status: 'online' });

      const telemetryData = await TelemetryData.create({
        device_id,
        data_type,
        value,
        unit,
        metadata,
      });

      res.status(201).json(telemetryData);
    } catch (error) {
      res.status(500).json({ message: 'Failed to submit telemetry', error: error.message });
    }
  }

  async getTelemetryData(req, res) {
    try {
      const { device_id } = req.params;
      const { data_type, start_date, end_date, limit = 100, page = 1 } = req.query;

      const whereClause = { device_id };
      if (data_type) {
        whereClause.data_type = data_type;
      }
      if (start_date && end_date) {
        whereClause.timestamp = { [Op.between]: [new Date(start_date), new Date(end_date)] };
      }

      const { count, rows } = await TelemetryData.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        order: [['timestamp', 'DESC']],
      });

      res.status(200).json({
        telemetry: rows,
        total: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get telemetry data', error: error.message });
    }
  }

  async getAggregatedData(req, res) {
    try {
      const { device_id } = req.params;
      const { data_type, aggregation, start_date, end_date } = req.query;

      if (!aggregation || !data_type) {
        return res.status(400).json({ message: 'Aggregation type and data_type are required' });
      }

      const whereClause = { device_id, data_type };
      if (start_date && end_date) {
        whereClause.timestamp = { [Op.between]: [new Date(start_date), new Date(end_date)] };
      }

      const result = await TelemetryData.findOne({
        attributes: [
          [Sequelize.fn(aggregation, Sequelize.col('value')), 'result'],
        ],
        where: whereClause,
      });

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get aggregated data', error: error.message });
    }
  }
}

module.exports = new TelemetryController();
