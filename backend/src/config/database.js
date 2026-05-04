const { Sequelize } = require('sequelize');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialect: 'postgres',
  logging: isProduction ? false : console.log,

  // ⚡ Optimized pool settings for Supabase free tier
  pool: {
    max: 5,          // Kurangi dari 10 (free tier connection limit)
    min: 1,          // Minimal 1 koneksi selalu hidup
    acquire: 60000,  // 60s timeout acquire (cold start bisa lama)
    idle: 300000,    // 5 menit idle sebelum release
    evict: 60000,    // Check idle connections setiap 60 detik
  },

  // ⚡ Keepalive & SSL untuk production
  dialectOptions: {
    ...(isProduction ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    } : {}),
    // TCP keepalive untuk mencegah idle disconnect
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    // Statement timeout 30 detik
    statement_timeout: 30000,
    // Idle transaction timeout
    idle_in_transaction_session_timeout: 60000,
  },

  // ⚡ Retry logic untuk cold start recovery
  retry: {
    max: 3,
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/,
      /ECONNREFUSED/,
      /ETIMEDOUT/,
      /ENOTFOUND/,
    ],
  },
});

module.exports = sequelize;