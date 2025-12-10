const Device = require('../models/device');
const { Op, Sequelize } = require('sequelize');
const iotdbClient = require('../utils/iotdbClient.js'); // You need to implement this IoTDB client wrapper
const notificationService = require('../services/notificationService');

class TelemetryController {
  async submitTelemetry(req, res) {
    try {
      const { device_id, data_type, value, unit, metadata } = req.body;

      // Find the device to get the user_id
      const device = await Device.findByPk(device_id);
      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      const devicePath = `root.iotflow.users.user_${device.user_id}.devices.device_${device_id}`;
      const timestamp = Date.now();

      // Prepare data for IoTDB insertion
      const telemetryData = {
        [data_type]: value,
      };

      // Add unit and metadata if provided
      if (unit) {
        telemetryData[`${data_type}_unit`] = unit;
      }
      if (metadata && Object.keys(metadata).length > 0) {
        telemetryData[`${data_type}_metadata`] = JSON.stringify(metadata);
      }

      console.log(`📊 Storing telemetry in IoTDB for device ${device_id}, user ${device.user_id}`);
      console.log(`📍 Device path: ${devicePath}`);
      console.log(`📈 Data:`, telemetryData);

      // Store in IoTDB
      await iotdbClient.insertRecord(devicePath, telemetryData, timestamp);

      console.log(`✅ Telemetry stored successfully in IoTDB for device ${device_id}`);

      // Send real-time notifications for significant data or anomalies
      await this.checkDataForNotifications(device, data_type, value, telemetryData);

      res.status(201).json({
        success: true,
        device_id,
        data_type,
        value,
        unit,
        metadata,
        timestamp: new Date(timestamp).toISOString(),
        stored_in_iotdb: true,
        device_path: devicePath,
      });
    } catch (error) {
      console.error('❌ Telemetry submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit telemetry',
        error: error.message,
      });
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
      const rows = await iotdbClient.queryRecords(
        devicePath,
        measurements,
        startTs,
        endTs,
        limit,
        page
      );

      res.status(200).json({
        telemetry: rows,
        total: rows.length,
        currentPage: parseInt(page),
        totalPages: 1, // IoTDB may not support pagination natively
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
      const result = await iotdbClient.aggregate(
        devicePath,
        data_type,
        aggregation,
        startTs,
        endTs
      );

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
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('IoTDB health check failed:', error.message);
      res.status(503).json({
        status: 'unhealthy',
        message: 'IoTDB connection failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getTodayMessageCount(req, res) {
    try {
      const userId = req.user.id;
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Convert to milliseconds for IoTDB timestamp
      const startTimestamp = startOfDay.getTime();
      const endTimestamp = endOfDay.getTime();

      console.log(`📊 Getting today's message count from IoTDB for user ${userId}`);
      console.log(`⏰ Time range: ${startTimestamp} to ${endTimestamp}`);

      try {
        // Use a direct COUNT query for all devices under this user
        const userPath = `root.iotflow.users.user_${userId}.devices.**`;
        const countSQL = `SELECT COUNT(temperature) FROM ${userPath} WHERE time >= ${startTimestamp}`;

        console.log('🔢 Counting messages with SQL:', countSQL);
        const countResult = await iotdbClient.executeSQL(countSQL);
        console.log('📈 Count result:', countResult);

        let messageCount = 0;

        if (countResult && countResult.values && countResult.values.length > 0) {
          // Sum all the counts from different device paths
          for (const countRow of countResult.values) {
            const count = countRow[0] || 0;
            messageCount += parseInt(count);
          }
        }

        console.log(`🎯 Total messages found: ${messageCount} for user ${userId} today`);

        res.status(200).json({
          success: true,
          data: {
            user_id: userId,
            date: today.toISOString().split('T')[0],
            message_count: messageCount,
            period: 'today',
            source: 'iotdb',
            timestamp: new Date().toISOString(),
          },
        });
      } catch (iotdbError) {
        console.error('❌ IoTDB query failed:', iotdbError.message);
        console.warn('⚠️  Returning zero count due to IoTDB unavailability');

        // Return success with zero count instead of error when IoTDB is unavailable
        res.status(200).json({
          success: true,
          message: 'IoTDB unavailable - returning zero count',
          data: {
            user_id: userId,
            date: today.toISOString().split('T')[0],
            message_count: 0,
            period: 'today',
            source: 'iotdb_unavailable',
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error('❌ Error getting today message count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get today message count',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async generateTestNotification(req, res) {
    try {
      const userId = req.user.id;
      const { type, message, device_id } = req.body;

      // This is a test endpoint to generate sample notifications
      const notification = {
        id: Date.now(),
        type: type || 'info',
        message: message || 'Test notification from backend',
        device_id: device_id || 'test_device',
        timestamp: new Date().toISOString(),
        user_id: userId,
      };

      console.log('🔔 Generated test notification:', notification);

      res.status(200).json({
        success: true,
        message: 'Test notification generated',
        notification,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Error generating test notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate test notification',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Check telemetry data for notification-worthy events
  async checkDataForNotifications(device, data_type, value, telemetryData) {
    try {
      // Check for data anomalies
      const anomalyThresholds = {
        temperature: { min: -10, max: 50, warning: { min: 0, max: 40 } },
        humidity: { min: 0, max: 100, warning: { min: 20, max: 80 } },
        pressure: { min: 800, max: 1200, warning: { min: 950, max: 1050 } },
        battery_level: { min: 0, max: 100, warning: { min: 20, max: 100 } },
      };

      const threshold = anomalyThresholds[data_type];
      if (threshold && typeof value === 'number') {
        // Critical anomaly
        if (value <= threshold.min || value >= threshold.max) {
          notificationService.notifyDataAnomaly(
            device.user_id,
            device,
            data_type,
            value,
            `${threshold.min}-${threshold.max}`
          );
        }
        // Warning level
        else if (
          threshold.warning &&
          (value <= threshold.warning.min || value >= threshold.warning.max)
        ) {
          await notificationService.createNotification(device.user_id, {
            type: 'warning',
            title: 'Data Warning',
            message: `${data_type} reading (${value}) approaching limits on "${device.name}"`,
            device_id: device.id,
            source: 'data_monitoring',
            metadata: { data_type, value, threshold: threshold.warning },
          });
        }
      }

      // Low battery alerts
      if (data_type === 'battery_level' && value <= 15) {
        await notificationService.createNotification(device.user_id, {
          type: 'warning',
          title: 'Low Battery Alert',
          message: `Low battery alert: ${value}% remaining on "${device.name}"`,
          device_id: device.id,
          source: 'battery_monitoring',
          metadata: { battery_level: value },
        });
      }

      // Device connectivity notifications
      if (device.status === 'offline') {
        // Update device status to online when data is received
        device.update({
          status: 'active',
          last_seen: new Date(),
          updated_at: new Date(),
        });

        notificationService.notifyDeviceConnected(device.user_id, device);
      } else {
        // Update last seen timestamp
        device.update({
          last_seen: new Date(),
          updated_at: new Date(),
        });
      }
    } catch (error) {
      console.error('Error checking data for notifications:', error);
    }
  }
}

module.exports = new TelemetryController();
