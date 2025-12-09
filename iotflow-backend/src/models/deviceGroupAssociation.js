const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db');

class DeviceGroupAssociation extends Model {}

DeviceGroupAssociation.init(
  {
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
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'groups',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'DeviceGroupAssociation',
    tableName: 'device_groups',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['device_id', 'group_id'],
      },
    ],
  }
);

module.exports = DeviceGroupAssociation;
