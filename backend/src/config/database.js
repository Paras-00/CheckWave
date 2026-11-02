import mongoose from 'mongoose';
import config from './config.js';
import logger from '../utils/logger.js';

let isConnected = false;
let retryCount = 0;
const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

export const connectDatabase = async (uri = config.mongoUri) => {
  if (isConnected || mongoose.connection.readyState === 1) {
    logger.info('MongoDB is already connected.');
    return mongoose.connection;
  }

  // Register connection events once
  if (!mongoose.connection.listenerCount('connected')) {
    mongoose.connection.on('connected', () => {
      isConnected = true;
      retryCount = 0;
      logger.info('MongoDB connection established successfully.');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB disconnected.');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      logger.info('MongoDB reconnected.');
    });

    // Handle process shutdown
    const handleShutdown = async (signal) => {
      logger.info(`Received ${signal}. Closing MongoDB connection...`);
      try {
        await mongoose.connection.close(false);
        logger.info('MongoDB connection closed.');
      } catch (err) {
        logger.error('Error during MongoDB disconnect:', err.message);
      }
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  }

  while (retryCount < MAX_RETRIES) {
    try {
      logger.info(`Connecting to MongoDB (Attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        autoIndex: true
      });
      isConnected = true;
      return mongoose.connection;
    } catch (error) {
      retryCount++;
      logger.error(`MongoDB connection attempt ${retryCount} failed: ${error.message}`);
      if (retryCount >= MAX_RETRIES) {
        logger.error('Max MongoDB connection retries reached.');
        throw error;
      }
      logger.info(`Retrying MongoDB connection in ${RETRY_INTERVAL_MS / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
    }
  }
};

export const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('MongoDB disconnected cleanly.');
  }
};

export default {
  connectDatabase,
  disconnectDatabase
};
