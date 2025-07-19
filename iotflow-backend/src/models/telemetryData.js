const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db');

class TelemetryData extends Model { }

TelemetryData.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  device_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'devices',
      key: 'id',
    },
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  data_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  value: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  unit: {
    type: DataTypes.STRING(20),
  },
  metadata: {
    type: DataTypes.JSON,
  },
}, {
  sequelize,
  modelName: 'TelemetryData',
  tableName: 'telemetry_data',
  timestamps: false,
  indexes: [
    {
      fields: ['device_id', 'timestamp']
    },
    {
      fields: ['data_type']
    }
  ]
});

module.exports = TelemetryData;
