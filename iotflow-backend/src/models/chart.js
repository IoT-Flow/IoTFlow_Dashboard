const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db');

class Chart extends Model {
  static async findByUser(userId) {
    try {
      const charts = await sequelize.query(
        `
        SELECT c.*, 
               STRING_AGG(DISTINCT cd.device_id::text, ',') as device_ids,
               STRING_AGG(DISTINCT cm.measurement_name, ',') as measurement_names
        FROM charts c
        LEFT JOIN chart_devices cd ON c.id = cd.chart_id
        LEFT JOIN chart_measurements cm ON c.id = cm.chart_id
        WHERE c.user_id = $1 AND c.is_active = true
        GROUP BY c.id
        ORDER BY c.updated_at DESC
      `,
        {
          bind: [userId],
          type: sequelize.QueryTypes.SELECT,
        }
      );

      return charts.map(chart => ({
        ...chart,
        devices: chart.device_ids ? chart.device_ids.split(',') : [],
        measurements: chart.measurement_names ? chart.measurement_names.split(',') : [],
        appearance_config:
          typeof chart.appearance_config === 'string'
            ? JSON.parse(chart.appearance_config)
            : chart.appearance_config,
      }));
    } catch (error) {
      console.error('Error fetching charts:', error);
      throw error;
    }
  }

  static async findByIdAndUser(id, userId) {
    try {
      const charts = await sequelize.query(
        `
        SELECT c.*, 
               STRING_AGG(DISTINCT cd.device_id::text, ',') as device_ids,
               STRING_AGG(DISTINCT cm.measurement_name, ',') as measurement_names
        FROM charts c
        LEFT JOIN chart_devices cd ON c.id = cd.chart_id
        LEFT JOIN chart_measurements cm ON c.id = cm.chart_id
        WHERE c.id = $1 AND c.user_id = $2 AND c.is_active = true
        GROUP BY c.id
      `,
        {
          bind: [id, userId],
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (charts.length === 0) return null;

      const chart = charts[0];
      return {
        ...chart,
        devices: chart.device_ids ? chart.device_ids.split(',') : [],
        measurements: chart.measurement_names ? chart.measurement_names.split(',') : [],
        appearance_config:
          typeof chart.appearance_config === 'string'
            ? JSON.parse(chart.appearance_config)
            : chart.appearance_config,
      };
    } catch (error) {
      console.error('Error fetching chart:', error);
      throw error;
    }
  }

  static async createChart(chartData) {
    const transaction = await sequelize.transaction();
    try {
      const chartId = `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create appearance config JSON
      const appearanceConfig = JSON.stringify({
        showLegend: chartData.showLegend,
        showGrid: chartData.showGrid,
        animations: chartData.animations,
        fillArea: chartData.fillArea,
        lineWidth: chartData.lineWidth,
        aspectRatio: chartData.aspectRatio,
        yAxisMin: chartData.yAxisMin,
        yAxisMax: chartData.yAxisMax,
        customColors: chartData.customColors || [],
        backgroundColor: chartData.backgroundColor,
        borderColor: chartData.borderColor,
        pointStyle: chartData.pointStyle,
      });

      // Insert main chart record
      await sequelize.query(
        `
        INSERT INTO charts (
          id, name, title, description, type, user_id,
          time_range, refresh_interval, aggregation, group_by,
          appearance_config, created_at, updated_at, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), true)
      `,
        {
          replacements: [
            chartId,
            chartData.name,
            chartData.title,
            chartData.description,
            chartData.type,
            chartData.userId,
            chartData.timeRange,
            chartData.refreshInterval,
            chartData.aggregation,
            chartData.groupBy,
            appearanceConfig,
          ],
          transaction,
        }
      );

      // Insert device associations
      if (chartData.devices && chartData.devices.length > 0) {
        const deviceInserts = chartData.devices
          .map(deviceId => `('${chartId}', '${deviceId}', datetime('now'))`)
          .join(', ');

        await sequelize.query(
          `
          INSERT INTO chart_devices (chart_id, device_id, created_at) VALUES ${deviceInserts}
        `,
          { transaction }
        );
      }

      // Insert measurement associations
      if (chartData.measurements && chartData.measurements.length > 0) {
        const measurementInserts = chartData.measurements
          .map(measurement => `('${chartId}', '${measurement}', '${measurement}', datetime('now'))`)
          .join(', ');

        await sequelize.query(
          `
          INSERT INTO chart_measurements (chart_id, measurement_name, display_name, created_at) VALUES ${measurementInserts}
        `,
          { transaction }
        );
      }

      await transaction.commit();
      return await Chart.findByIdAndUser(chartId, chartData.userId);
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating chart:', error);
      throw error;
    }
  }

  static async updateChart(id, chartData, userId) {
    const transaction = await sequelize.transaction();
    try {
      // Create appearance config JSON
      const appearanceConfig = JSON.stringify({
        showLegend: chartData.showLegend,
        showGrid: chartData.showGrid,
        animations: chartData.animations,
        fillArea: chartData.fillArea,
        lineWidth: chartData.lineWidth,
        aspectRatio: chartData.aspectRatio,
        yAxisMin: chartData.yAxisMin,
        yAxisMax: chartData.yAxisMax,
        customColors: chartData.customColors || [],
        backgroundColor: chartData.backgroundColor,
        borderColor: chartData.borderColor,
        pointStyle: chartData.pointStyle,
      });

      // Update main chart record
      await sequelize.query(
        `
        UPDATE charts SET 
          name = ?, title = ?, description = ?, type = ?,
          time_range = ?, refresh_interval = ?, aggregation = ?, group_by = ?,
          appearance_config = ?, updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
      `,
        {
          replacements: [
            chartData.name,
            chartData.title,
            chartData.description,
            chartData.type,
            chartData.timeRange,
            chartData.refreshInterval,
            chartData.aggregation,
            chartData.groupBy,
            appearanceConfig,
            id,
            userId,
          ],
          transaction,
        }
      );

      // Delete existing associations
      await sequelize.query('DELETE FROM chart_devices WHERE chart_id = ?', {
        replacements: [id],
        transaction,
      });

      await sequelize.query('DELETE FROM chart_measurements WHERE chart_id = ?', {
        replacements: [id],
        transaction,
      });

      // Insert new device associations
      if (chartData.devices && chartData.devices.length > 0) {
        const deviceInserts = chartData.devices
          .map(deviceId => `('${id}', '${deviceId}', datetime('now'))`)
          .join(', ');

        await sequelize.query(
          `
          INSERT INTO chart_devices (chart_id, device_id, created_at) VALUES ${deviceInserts}
        `,
          { transaction }
        );
      }

      // Insert new measurement associations
      if (chartData.measurements && chartData.measurements.length > 0) {
        const measurementInserts = chartData.measurements
          .map(measurement => `('${id}', '${measurement}', '${measurement}', datetime('now'))`)
          .join(', ');

        await sequelize.query(
          `
          INSERT INTO chart_measurements (chart_id, measurement_name, display_name, created_at) VALUES ${measurementInserts}
        `,
          { transaction }
        );
      }

      await transaction.commit();
      return await Chart.findByIdAndUser(id, userId);
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating chart:', error);
      throw error;
    }
  }

  static async deleteChart(id, userId) {
    try {
      await sequelize.query(
        `
        UPDATE charts SET is_active = false, updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
      `,
        {
          replacements: [id, userId],
        }
      );
      return true;
    } catch (error) {
      console.error('Error deleting chart:', error);
      throw error;
    }
  }
}

Chart.init(
  {
    id: {
      type: DataTypes.STRING(255),
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
    },
    description: {
      type: DataTypes.TEXT,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    time_range: {
      type: DataTypes.STRING(20),
      defaultValue: '1h',
    },
    refresh_interval: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
    },
    aggregation: {
      type: DataTypes.STRING(20),
      defaultValue: 'none',
    },
    group_by: {
      type: DataTypes.STRING(50),
      defaultValue: 'device',
    },
    appearance_config: {
      type: DataTypes.JSON,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Chart',
    tableName: 'charts',
    timestamps: false,
  }
);

module.exports = Chart;
