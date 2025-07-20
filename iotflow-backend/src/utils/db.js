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
} else if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  // Use PostgreSQL for production
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
  });
} else {
  // Use SQLite file for development
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: console.log,
  });
}

module.exports = { sequelize };