import mongoose from 'mongoose';
import Monitor from '../models/Monitor.js';
import Metric from '../models/Metric.js';
import Incident from '../models/Incident.js';
import { getSlowestEndpoints } from '../services/analytics.service.js';

/**
 * Get comprehensive dashboard summary statistics.
 */
export const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Monitor Counts & Overall Uptime
    const [monitorCounts, overallUptimeAgg, last24hMetrics, recentIncidents, slowEndpoints, responseTimeSeries, uptimeSeries] = await Promise.all([
      // Monitor counts
      Monitor.aggregate([
        { $match: { user: userObjectId, isDeleted: false } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Overall uptime average
      Monitor.aggregate([
        { $match: { user: userObjectId, isDeleted: false } },
        {
          $group: {
            _id: null,
            avgUptime: { $avg: '$uptime30d' },
            total: { $sum: 1 }
          }
        }
      ]),

      // Last 24h stats (avg response time & error rate)
      Metric.aggregate([
        {
          $match: {
            user: userObjectId,
            timestamp: { $gte: last24h }
          }
        },
        {
          $group: {
            _id: null,
            totalChecks: { $sum: 1 },
            downChecks: { $sum: { $cond: ['$isUp', 0, 1] } },
            avgResponseTime: { $avg: '$responseTime' }
          }
        }
      ]),

      // Recent 5 incidents
      Incident.find({ user: userObjectId })
        .populate('monitor', 'name url method')
        .sort({ startedAt: -1 })
        .limit(5),

      // Slowest 5 endpoints
      getSlowestEndpoints(userId, 5),

      // Hourly response time series (last 24h)
      Metric.aggregate([
        {
          $match: {
            user: userObjectId,
            timestamp: { $gte: last24h }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d %H:00',
                date: '$timestamp'
              }
            },
            avgResponseTime: { $avg: '$responseTime' },
            totalChecks: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Daily uptime series (last 7d)
      Metric.aggregate([
        {
          $match: {
            user: userObjectId,
            timestamp: { $gte: last7d }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$timestamp'
              }
            },
            totalChecks: { $sum: 1 },
            upChecks: { $sum: { $cond: ['$isUp', 1, 0] } }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Parse monitor counts
    let totalMonitors = 0;
    let activeMonitors = 0;
    let pausedMonitors = 0;
    let errorMonitors = 0;

    for (const item of monitorCounts) {
      totalMonitors += item.count;
      if (item._id === 'active') activeMonitors = item.count;
      if (item._id === 'paused') pausedMonitors = item.count;
      if (item._id === 'error') errorMonitors = item.count;
    }

    // Parse overall uptime
    const overallUptime = overallUptimeAgg[0]?.avgUptime !== undefined
      ? Math.round(overallUptimeAgg[0].avgUptime * 100) / 100
      : 100;

    // Parse 24h metrics
    const stats24h = last24hMetrics[0] || { totalChecks: 0, downChecks: 0, avgResponseTime: 0 };
    const avgResponseTime = Math.round(stats24h.avgResponseTime || 0);
    const errorRate = stats24h.totalChecks > 0
      ? Math.round((stats24h.downChecks / stats24h.totalChecks) * 10000) / 100
      : 0;

    // Format response time series
    const formattedResponseTimeSeries = responseTimeSeries.map((item) => ({
      timestamp: item._id,
      avgResponseTime: Math.round(item.avgResponseTime || 0),
      totalChecks: item.totalChecks
    }));

    // Format daily uptime series
    const formattedUptimeSeries = uptimeSeries.map((item) => ({
      date: item._id,
      uptimePercentage: item.totalChecks > 0
        ? Math.round((item.upChecks / item.totalChecks) * 10000) / 100
        : 100,
      totalChecks: item.totalChecks
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalMonitors,
        activeMonitors,
        pausedMonitors,
        errorMonitors,
        overallUptime,
        avgResponseTime,
        errorRate,
        recentIncidents,
        slowEndpoints,
        responseTimeSeries: formattedResponseTimeSeries,
        uptimeSeries: formattedUptimeSeries
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getDashboardSummary
};
