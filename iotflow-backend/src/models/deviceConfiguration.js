const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db');

class DeviceConfiguration extends Model { }

DeviceConfiguration.init({
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
  config_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  config_value: {
    type: DataTypes.TEXT,
  },
  data_type: {
    type: DataTypes.STRING(20),
    defaultValue: 'string',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'DeviceConfiguration',
  tableName: 'device_configurations',
  timestamps: false,
});

module.exports = DeviceConfiguration;
