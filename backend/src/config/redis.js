import Redis from 'ioredis';
import { Queue } from 'bullmq';
import config from './config.js';
import logger from '../utils/logger.js';

export let redisAvailable = false;

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    // Retry connection every 3 seconds, up to a point, logging warnings
    if (times > 10) {
      logger.warn('Redis retry limit reached. Redis will remain unavailable until reconnected.');
      return 10000;
    }
    return Math.min(times * 1000, 5000);
  },
  lazyConnect: false
};

export const redisClient = new Redis(config.redisUrl, redisOptions);

redisClient.on('connect', () => {
  redisAvailable = true;
  logger.info('Redis connected successfully.');
});

redisClient.on('ready', () => {
  redisAvailable = true;
  logger.info('Redis client is ready.');
});

redisClient.on('error', (err) => {
  redisAvailable = false;
  logger.warn(`Redis connection error (${err.code || err.message}). Operating in degraded/no-redis mode.`);
});

redisClient.on('close', () => {
  redisAvailable = false;
  logger.warn('Redis connection closed.');
});

redisClient.on('reconnecting', () => {
  logger.info('Reconnecting to Redis...');
});

export const isRedisAvailable = () => redisAvailable;

// Export BullMQ Queue for 'health-checks'
export const healthCheckQueue = new Queue('health-checks', {
  connection: redisClient,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 200,
    attempts: 1
  }
});

healthCheckQueue.on('error', (err) => {
  logger.warn(`BullMQ health-checks queue warning: ${err.message}`);
});

export default {
  redisClient,
  redisAvailable,
  isRedisAvailable,
  healthCheckQueue
};
