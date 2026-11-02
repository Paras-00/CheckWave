import Monitor from '../models/Monitor.js';
import {
  getAnalytics,
  resolveDateRange,
  getSlowestEndpoints
} from '../services/analytics.service.js';

/**
 * Get aggregated performance analytics.
 */
export const getMetricsAnalytics = async (req, res, next) => {
  try {
    const { monitorId, startDate, endDate, range } = req.query;

    if (monitorId) {
      const monitorExists = await Monitor.findOne({
        _id: monitorId,
        user: req.user.id,
        isDeleted: false
      });

      if (!monitorExists) {
        return res.status(404).json({
          success: false,
          error: 'Monitor not found or unauthorized'
        });
      }
    }

    const { start, end } = resolveDateRange(range || '24h', startDate, endDate);

    const analytics = await getAnalytics(req.user.id, monitorId || null, start, end);

    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get top slowest endpoints for user.
 */
export const getSlowest = async (req, res, next) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 5));
    const slowest = await getSlowestEndpoints(req.user.id, limit);

    return res.status(200).json({
      success: true,
      data: {
        slowest
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getMetricsAnalytics,
  getSlowest
};
