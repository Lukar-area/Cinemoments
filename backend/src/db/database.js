import mongoose from 'mongoose';
import { config } from '../config/index.js';

// Disable query buffering so disconnected queries fail fast or leverage fallback stores
mongoose.set('bufferCommands', false);

/**
 * Connects to MongoDB Atlas using Mongoose.
 * Configured with connection pooling and error handling for production readiness.
 */
export async function connectDB() {
  try {
    await mongoose.connect(config.mongodbUri, {
      dbName: 'cinemoments',
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB Atlas connected successfully.');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.warn('⚠️ Server will continue running with built-in fallbacks. Verify Atlas Network Access whitelist (IP access) or run local mongod.');
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected.');
  });
}

export function isDBConnected() {
  return mongoose.connection?.readyState === 1;
}

/**
 * Backward compatibility helper for legacy code / test suites.
 */
export function getDb() {
  return mongoose.connection?.db || null;
}
