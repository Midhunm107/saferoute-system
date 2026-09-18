// MongoDB connection via Mongoose — see README section 6 (Phase 1: Database & Models).

const mongoose = require('mongoose');
const logger = require('../utils/logger');

mongoose.set('strictQuery', true);

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);
  logger.info('MongoDB connected');

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  return mongoose.connection;
}

async function pingDB() {
  if (mongoose.connection.readyState !== 1) return false;
  try {
    await mongoose.connection.db.admin().ping();
    return true;
  } catch {
    return false;
  }
}

module.exports = { connectDB, pingDB, mongoose };
