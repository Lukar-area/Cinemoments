import mongoose from 'mongoose';
import { config } from '../config/index.js';

/**
 * Connects to MongoDB Atlas using Mongoose.
 * Configured with connection pooling and error handling for production readiness.
 */
export async function connectDB() {
  try {
    await mongoose.connect(config.mongodbUri, {
      dbName: 'cinemoments',
    });
    console.log('✅ MongoDB Atlas connected successfully.');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected.');
  });
}
