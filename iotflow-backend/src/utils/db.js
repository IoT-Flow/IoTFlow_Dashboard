const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

let sequelize;

// Define the path to the SQLite database
const dbPath = process.env.DB_PATH;

if (process.env.NODE_ENV === 'test') {
  // Use in-memory SQLite for testing
  sequelize = new Sequelize('sqlite::memory:', {
    logging: false,
  });
} else if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
  // Use PostgreSQL (VM or production)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: false, // Disable SSL for internal VM connection
    },
    logging: console.log, // Enable logging for debugging
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Use SQLite file for development
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
  });
}

module.exports = { sequelize };