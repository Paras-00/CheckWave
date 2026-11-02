import { Worker } from 'bullmq';
import { redisClient, isRedisAvailable } from '../config/redis.js';
import Monitor from '../models/Monitor.js';
import Metric from '../models/Metric.js';
import { performCheck } from '../services/health-check.service.js';
import { handleCheckResult } from '../services/incident.service.js';
import { calculateRollingUptime } from '../services/analytics.service.js';
import logger from '../utils/logger.js';

let worker = null;

/**
 * Worker processor function for health-checks queue.
 */
export const processHealthCheckJob = async (job) => {
  const { monitorId } = job.data;
  if (!monitorId) {
    logger.warn('Health check job received without monitorId.');
    return;
  }

  try {
    // 1. Fetch monitor from DB
    const monitor = await Monitor.findById(monitorId);

    // Skip if not found, soft-deleted, or paused
    if (!monitor || monitor.isDeleted || monitor.status !== 'active') {
      logger.debug(`Skipping health check for monitor ${monitorId}: inactive, paused, or not found.`);
      return;
    }

    // 2. Perform HTTP health check
    const checkResult = await performCheck(monitor);

    // 3. Save Metric document
    const metric = new Metric({
      monitor: monitor._id,
      user: monitor.user,
      timestamp: new Date(),
      responseTime: checkResult.responseTime,
      statusCode: checkResult.statusCode,
      status: checkResult.status,
      errorMessage: checkResult.errorMessage,
      isUp: checkResult.isUp
    });
    await metric.save();

    // 4. Update monitor fields & 5. Incident management
    await handleCheckResult(monitor, checkResult);

    // 6. Calculate rolling uptime (7d, 30d) and update monitor
    const [uptime7d, uptime30d] = await Promise.all([
      calculateRollingUptime(monitor._id, 7),
      calculateRollingUptime(monitor._id, 30)
    ]);

    monitor.uptime7d = uptime7d;
    monitor.uptime30d = uptime30d;
    await monitor.save();

    logger.info(`Health check completed for ${monitor.name} (${monitor.url}) - Status: ${checkResult.status.toUpperCase()} (${checkResult.responseTime}ms)`);
  } catch (error) {
    logger.error(`Error processing health check for monitor ${monitorId}: ${error.message}`);
    throw error;
  }
};

/**
 * Starts the BullMQ worker if Redis is available.
 */
export const startWorker = () => {
  if (worker) {
    return worker;
  }

  if (!isRedisAvailable()) {
    logger.warn('Redis is not connected yet. Health check worker will start automatically when Redis becomes ready.');
    redisClient.once('ready', () => {
      logger.info('Redis became ready. Starting BullMQ health check worker now...');
      startWorker();
    });
    return null;
  }

  try {
    worker = new Worker('health-checks', processHealthCheckJob, {
      connection: redisClient,
      concurrency: 5
    });

    worker.on('ready', () => {
      logger.info('BullMQ Health Check Worker is running and ready.');
    });

    worker.on('completed', (job) => {
      logger.debug(`Job ${job.id} finished successfully.`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed with error: ${err.message}`);
    });

    worker.on('error', (err) => {
      logger.warn(`BullMQ Worker encountered an error: ${err.message}`);
    });

    return worker;
  } catch (err) {
    logger.error(`Failed to initialize BullMQ worker: ${err.message}`);
    return null;
  }
};

/**
 * Gracefully stops the worker.
 */
export const stopWorker = async () => {
  if (worker) {
    logger.info('Closing BullMQ worker...');
    await worker.close();
    worker = null;
    logger.info('BullMQ worker closed.');
  }
};

export default {
  startWorker,
  stopWorker,
  processHealthCheckJob
};
