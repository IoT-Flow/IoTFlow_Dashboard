const TelemetryData = require('../models/telemetryData');
const Device = require('../models/device');
const { Op, Sequelize } = require('sequelize');
const iotdbClient = require('../utils/iotdbClient.js'); // You need to implement this IoTDB client wrapper

class TelemetryController {
  async submitTelemetry(req, res) {
    try {
      const { device_id, data_type, value, unit, metadata } = req.body;

      // Find the device to get the user_id
      const device = await Device.findByPk(device_id);
      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      // Compose IoTDB path with the new structure
      // const devicePath = `root.iotflow.devices.users.user_${device.user_id}.device_${device_id}`;
      const devicePath = `root.iotflow.users.user_${device.user_id}.devices.device_${device_id}`;
      const timestamp = Date.now();

      // Insert telemetry data into IoTDB
      await iotdbClient.insertRecord(devicePath, {
        [data_type]: value,
        unit,
        metadata: JSON.stringify(metadata || {}),
      }, timestamp);

      // Optionally update device status in your SQL DB if needed

      res.status(201).json({
        device_id,
        data_type,
        value,
        unit,
        metadata,
        timestamp,
        iotdb_path: devicePath
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to submit telemetry', error: error.message });
    }
  }

  async getTelemetryData(req, res) {
    try {
      const { device_id } = req.params;
      const { data_type, start_date, end_date, limit = 100, page = 1 } = req.query;

      // Find the device to get the user_id
      const device = await Device.findByPk(device_id);
      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      // const devicePath = `root.iotflow.devices.users.user_${device.user_id}.device_${device_id}`;
      const devicePath = `root.iotflow.users.user_${device.user_id}.devices.device_${device_id}`;
      const measurements = data_type ? [data_type] : ['*'];
      const startTs = start_date ? new Date(start_date).getTime() : undefined;
      const endTs = end_date ? new Date(end_date).getTime() : undefined;

      // Query IoTDB for telemetry data
      const rows = await iotdbClient.queryRecords(devicePath, measurements, startTs, endTs, limit, page);

      res.status(200).json({
        telemetry: rows,
        total: rows.length,
        currentPage: parseInt(page),
        totalPages: 1 // IoTDB may not support pagination natively
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

      // Find the device to get the user_id
      const device = await Device.findByPk(device_id);
      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      // const devicePath = `root.iotflow.devices.users.user_${device.user_id}.device_${device_id}`;
      const devicePath = `root.iotflow.users.user_${device.user_id}.devices.device_${device_id}`;
      const startTs = start_date ? new Date(start_date).getTime() : undefined;
      const endTs = end_date ? new Date(end_date).getTime() : undefined;

      // Query IoTDB for aggregated telemetry data
      const result = await iotdbClient.aggregate(devicePath, data_type, aggregation, startTs, endTs);

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get aggregated data', error: error.message });
    }
  }

  async healthCheck(req, res) {
    try {
      // Test IoTDB connection
      await iotdbClient.testConnection();

      res.status(200).json({
        status: 'healthy',
        message: 'IoTDB connection successful',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('IoTDB health check failed:', error.message);
      res.status(503).json({
        status: 'unhealthy',
        message: 'IoTDB connection failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new TelemetryController();
