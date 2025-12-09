const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    user_id: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv4().replace(/-/g, ''),
    },

    username: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    /*
  api_key: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
    defaultValue: () => crypto.randomBytes(32).toString('hex'),
  },
  */
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    /*
  role: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'user',
  },
  tenant_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'default',
  },
  */
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    last_login: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: false,
  }
);

module.exports = User;
