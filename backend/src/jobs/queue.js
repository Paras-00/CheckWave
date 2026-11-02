import { healthCheckQueue, isRedisAvailable } from '../config/redis.js';
import logger from '../utils/logger.js';

export { healthCheckQueue };

/**
 * Schedules a recurring health check job for a monitor.
 *
 * @param {Object} monitor
 */
export const scheduleMonitor = async (monitor) => {
  if (!isRedisAvailable()) {
    logger.warn(`Redis unavailable. Skipping scheduling job for monitor ${monitor._id}`);
    return null;
  }

  try {
    const monitorId = monitor._id.toString();
    const intervalMs = Math.max(1, monitor.interval || 5) * 60 * 1000;

    // Unschedule previous repeatable jobs for this monitor if any
    await unscheduleMonitor(monitorId);

    // Add repeating job
    const job = await healthCheckQueue.add(
      'health-check',
      { monitorId },
      {
        repeat: {
          every: intervalMs
        },
        jobId: `monitor:${monitorId}`,
        removeOnComplete: true,
        removeOnFail: 50
      }
    );

    logger.info(`Scheduled health check for monitor ${monitor.name} (${monitorId}) every ${monitor.interval} min(s).`);
    return job;
  } catch (err) {
    logger.warn(`Failed to schedule monitor ${monitor?._id}: ${err.message}`);
    return null;
  }
};

/**
 * Removes recurring health check jobs for a monitor.
 *
 * @param {string} monitorId
 */
export const unscheduleMonitor = async (monitorId) => {
  if (!isRedisAvailable()) {
    logger.warn(`Redis unavailable. Skipping unscheduling job for monitor ${monitorId}`);
    return false;
  }

  try {
    const idStr = monitorId.toString();
    const repeatableJobs = await healthCheckQueue.getRepeatableJobs();

    for (const job of repeatableJobs) {
      if (
        job.id === `monitor:${idStr}` ||
        job.key.includes(`monitor:${idStr}`) ||
        job.key.includes(idStr)
      ) {
        await healthCheckQueue.removeRepeatableByKey(job.key);
        logger.info(`Unscheduled repeatable job ${job.key} for monitor ${idStr}`);
      }
    }

    // Also attempt removing standard delayed/waiting job if exists
    try {
      const standardJob = await healthCheckQueue.getJob(`monitor:${idStr}`);
      if (standardJob) {
        await standardJob.remove();
      }
    } catch {
      // Ignore if job does not exist
    }

    return true;
  } catch (err) {
    logger.warn(`Error unscheduling monitor ${monitorId}: ${err.message}`);
    return false;
  }
};

/**
 * Adds an immediate one-time health check job to the queue.
 *
 * @param {Object} monitor
 */
export const addImmediateCheck = async (monitor) => {
  if (!isRedisAvailable()) {
    logger.warn(`Redis unavailable. Cannot queue immediate check for monitor ${monitor._id}`);
    return null;
  }

  try {
    const monitorId = monitor._id.toString();
    const job = await healthCheckQueue.add(
      'immediate-check',
      { monitorId },
      {
        removeOnComplete: true,
        removeOnFail: true
      }
    );
    logger.info(`Added immediate health check job for monitor ${monitor.name} (${monitorId})`);
    return job;
  } catch (err) {
    logger.warn(`Failed to queue immediate check for monitor ${monitor?._id}: ${err.message}`);
    return null;
  }
};

export default {
  healthCheckQueue,
  scheduleMonitor,
  unscheduleMonitor,
  addImmediateCheck
};
