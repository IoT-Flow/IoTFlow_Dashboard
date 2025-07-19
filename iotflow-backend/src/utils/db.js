const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use SQLite for development and testing, PostgreSQL for production
let sequelize;
if (process.env.NODE_ENV === 'test') {
  // Use in-memory SQLite for testing
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  });
} else if (process.env.NODE_ENV === 'production' && process.env.DB_HOST) {
  // Use PostgreSQL for production
  const { Pool } = require('pg');
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  const query = (text, params) => pool.query(text, params);
  const getClient = async () => pool.connect();

  sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    logging: false,
  });

  module.exports = { sequelize, query, getClient };
} else {
  // Use SQLite file for development
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false,
  });
}

module.exports = { sequelize };