const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db');

class Group extends Model {}

Group.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    color: {
      type: DataTypes.STRING(7), // Hex color code #RRGGBB
      defaultValue: '#3B82F6',
    },
    icon: {
      type: DataTypes.STRING(50),
      defaultValue: 'folder',
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Group',
    tableName: 'groups',
    timestamps: false,
  }
);

module.exports = Group;
