import mongoose from 'mongoose';
import Metric from '../models/Metric.js';
import Monitor from '../models/Monitor.js';
import logger from '../utils/logger.js';

/**
 * Calculates date range based on shorthand ('1h', '24h', '7d', '30d') or explicit dates.
 */
export const resolveDateRange = (range, startDate, endDate) => {
  let end = endDate ? new Date(endDate) : new Date();
  let start;

  if (startDate) {
    start = new Date(startDate);
  } else {
    switch (range) {
      case '1h':
        start = new Date(end.getTime() - 1 * 60 * 60 * 1000);
        break;
      case '24h':
      case '1d':
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
      default:
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }
  }

  return { start, end };
};

/**
 * Get aggregated analytics for a user and optional monitorId.
 * Executes MongoDB aggregation pipeline directly.
 *
 * @param {string} userId
 * @param {string|null} monitorId
 * @param {Date} startDate
 * @param {Date} endDate
 */
export const getAnalytics = async (userId, monitorId, startDate, endDate) => {
  try {
    const matchStage = {
      user: new mongoose.Types.ObjectId(userId),
      timestamp: { $gte: startDate, $lte: endDate }
    };

    if (monitorId) {
      matchStage.monitor = new mongoose.Types.ObjectId(monitorId);
    }

    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    // If range is within 48 hours, group by hour; otherwise by day
    const groupFormat = durationHours <= 48 ? '%Y-%m-%d %H:00' : '%Y-%m-%d';

    const pipeline = [
      { $match: matchStage },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalChecks: { $sum: 1 },
                upChecks: { $sum: { $cond: ['$isUp', 1, 0] } },
                downChecks: { $sum: { $cond: ['$isUp', 0, 1] } },
                avgResponseTime: { $avg: '$responseTime' },
                minResponseTime: { $min: '$responseTime' },
                maxResponseTime: { $max: '$responseTime' }
              }
            }
          ],
          percentileValues: [
            { $project: { _id: 0, responseTime: 1 } },
            { $sort: { responseTime: 1 } }
          ],
          buckets: [
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: groupFormat,
                    date: '$timestamp'
                  }
                },
                totalChecks: { $sum: 1 },
                upChecks: { $sum: { $cond: ['$isUp', 1, 0] } },
                downChecks: { $sum: { $cond: ['$isUp', 0, 1] } },
                avgResponseTime: { $avg: '$responseTime' }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ];

    const [aggregateResult] = await Metric.aggregate(pipeline);

    const summary = aggregateResult.summary[0] || {
      totalChecks: 0,
      upChecks: 0,
      downChecks: 0,
      avgResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0
    };

    const totalChecks = summary.totalChecks;
    const upChecks = summary.upChecks;
    const downChecks = summary.downChecks;
    const uptimePercentage = totalChecks > 0
      ? Math.round((upChecks / totalChecks) * 10000) / 100
      : 100;
    const errorRate = totalChecks > 0
      ? Math.round((downChecks / totalChecks) * 10000) / 100
      : 0;
    const avgResponseTime = Math.round(summary.avgResponseTime || 0);

    // Calculate p95 response time from sorted values
    const percentiles = aggregateResult.percentileValues || [];
    let p95ResponseTime = 0;
    if (percentiles.length > 0) {
      const p95Idx = Math.min(Math.floor(percentiles.length * 0.95), percentiles.length - 1);
      p95ResponseTime = Math.round(percentiles[p95Idx].responseTime || 0);
    }

    // Format chart buckets
    const timeSeries = (aggregateResult.buckets || []).map((b) => ({
      timestamp: b._id,
      totalChecks: b.totalChecks,
      upChecks: b.upChecks,
      downChecks: b.downChecks,
      uptimePercentage: b.totalChecks > 0
        ? Math.round((b.upChecks / b.totalChecks) * 10000) / 100
        : 100,
      avgResponseTime: Math.round(b.avgResponseTime || 0)
    }));

    // Fetch slowest endpoints across monitors
    const slowestEndpoints = await getSlowestEndpoints(userId, 5);

    return {
      timeframe: {
        startDate,
        endDate,
        interval: durationHours <= 48 ? 'hourly' : 'daily'
      },
      summary: {
        totalChecks,
        upChecks,
        downChecks,
        uptimePercentage,
        avgResponseTime,
        p95ResponseTime,
        minResponseTime: Math.round(summary.minResponseTime || 0),
        maxResponseTime: Math.round(summary.maxResponseTime || 0),
        errorRate
      },
      timeSeries,
      slowestEndpoints
    };
  } catch (error) {
    logger.error(`Error computing analytics: ${error.message}`);
    throw error;
  }
};

/**
 * Calculates slowest endpoints for a user in the last 24 hours.
 */
export const getSlowestEndpoints = async (userId, limit = 5) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const slowest = await Metric.aggregate([
      {
        $match: {
          user: userObjectId,
          timestamp: { $gte: oneDayAgo }
        }
      },
      {
        $group: {
          _id: '$monitor',
          avgResponseTime: { $avg: '$responseTime' },
          totalChecks: { $sum: 1 },
          downChecks: { $sum: { $cond: ['$isUp', 0, 1] } }
        }
      },
      {
        $sort: { avgResponseTime: -1 }
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: 'monitors',
          localField: '_id',
          foreignField: '_id',
          as: 'monitor'
        }
      },
      {
        $unwind: '$monitor'
      },
      {
        $match: {
          'monitor.isDeleted': false
        }
      },
      {
        $project: {
          _id: 1,
          monitorId: '$_id',
          name: '$monitor.name',
          url: '$monitor.url',
          method: '$monitor.method',
          avgResponseTime: { $round: ['$avgResponseTime', 2] },
          totalChecks: 1,
          downChecks: 1
        }
      }
    ]);

    return slowest;
  } catch (error) {
    logger.warn(`Could not compute slowest endpoints: ${error.message}`);
    return [];
  }
};

/**
 * Computes rolling uptime percentage for a given monitor over X days.
 */
export const calculateRollingUptime = async (monitorId, days = 7) => {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await Metric.aggregate([
      {
        $match: {
          monitor: new mongoose.Types.ObjectId(monitorId),
          timestamp: { $gte: since }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          up: { $sum: { $cond: ['$isUp', 1, 0] } }
        }
      }
    ]);

    if (!result.length || result[0].total === 0) {
      return 100;
    }

    const percentage = (result[0].up / result[0].total) * 100;
    return Math.round(percentage * 100) / 100;
  } catch (error) {
    logger.warn(`Failed to calculate rolling uptime for ${monitorId}: ${error.message}`);
    return 100;
  }
};

export default {
  resolveDateRange,
  getAnalytics,
  getSlowestEndpoints,
  calculateRollingUptime
};
