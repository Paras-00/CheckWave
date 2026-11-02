import Monitor from '../models/Monitor.js';
import Metric from '../models/Metric.js';
import { performCheck } from '../services/health-check.service.js';
import { handleCheckResult } from '../services/incident.service.js';
import { calculateRollingUptime } from '../services/analytics.service.js';
import queueService from '../jobs/queue.js';

/**
 * List all active/non-deleted monitors for the authenticated user.
 */
export const listMonitors = async (req, res, next) => {
  try {
    const filter = {
      user: req.user.id,
      isDeleted: false
    };

    if (req.query.status && ['active', 'paused', 'error'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const monitors = await Monitor.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        monitors,
        count: monitors.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new monitor.
 */
export const createMonitor = async (req, res, next) => {
  try {
    const { name, url, method, interval, timeout, headers, body } = req.body;

    const monitor = new Monitor({
      user: req.user.id,
      name,
      url,
      method: method || 'GET',
      interval: interval || 5,
      timeout: timeout || 30000,
      headers: headers || {},
      body: body || null,
      status: 'active'
    });

    await monitor.save();

    // Schedule background recurring health checks
    await queueService.scheduleMonitor(monitor);

    return res.status(201).json({
      success: true,
      message: 'Monitor created successfully',
      data: {
        monitor
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single monitor by ID.
 */
export const getMonitor = async (req, res, next) => {
  try {
    const monitor = await Monitor.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false
    });

    if (!monitor) {
      return res.status(404).json({
        success: false,
        error: 'Monitor not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        monitor
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update monitor by ID.
 */
export const updateMonitor = async (req, res, next) => {
  try {
    const monitor = await Monitor.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false
    });

    if (!monitor) {
      return res.status(404).json({
        success: false,
        error: 'Monitor not found'
      });
    }

    const { name, url, method, interval, timeout, headers, body } = req.body;

    if (name !== undefined) monitor.name = name;
    if (url !== undefined) monitor.url = url;
    if (method !== undefined) monitor.method = method;
    if (timeout !== undefined) monitor.timeout = timeout;
    if (headers !== undefined) monitor.headers = headers;
    if (body !== undefined) monitor.body = body;

    const intervalChanged = interval !== undefined && interval !== monitor.interval;
    if (interval !== undefined) monitor.interval = interval;

    await monitor.save();

    // Reschedule if active and interval or URL was changed
    if (monitor.status === 'active' && (intervalChanged || url !== undefined)) {
      await queueService.scheduleMonitor(monitor);
    }

    return res.status(200).json({
      success: true,
      message: 'Monitor updated successfully',
      data: {
        monitor
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete monitor.
 */
export const deleteMonitor = async (req, res, next) => {
  try {
    const monitor = await Monitor.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false
    });

    if (!monitor) {
      return res.status(404).json({
        success: false,
        error: 'Monitor not found'
      });
    }

    monitor.isDeleted = true;
    monitor.status = 'paused';
    await monitor.save();

    // Remove from scheduler
    await queueService.unscheduleMonitor(monitor._id);

    return res.status(200).json({
      success: true,
      message: 'Monitor deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Pause monitoring.
 */
export const pauseMonitor = async (req, res, next) => {
  try {
    const monitor = await Monitor.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false
    });

    if (!monitor) {
      return res.status(404).json({
        success: false,
        error: 'Monitor not found'
      });
    }

    monitor.status = 'paused';
    await monitor.save();

    await queueService.unscheduleMonitor(monitor._id);

    return res.status(200).json({
      success: true,
      message: 'Monitor paused successfully',
      data: {
        monitor
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resume monitoring.
 */
export const resumeMonitor = async (req, res, next) => {
  try {
    const monitor = await Monitor.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false
    });

    if (!monitor) {
      return res.status(404).json({
        success: false,
        error: 'Monitor not found'
      });
    }

    monitor.status = 'active';
    await monitor.save();

    await queueService.scheduleMonitor(monitor);

    return res.status(200).json({
      success: true,
      message: 'Monitor resumed successfully',
      data: {
        monitor
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manual health check (on-demand).
 */
export const checkMonitor = async (req, res, next) => {
  try {
    const monitor = await Monitor.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false
    });

    if (!monitor) {
      return res.status(404).json({
        success: false,
        error: 'Monitor not found'
      });
    }

    // Call performCheck directly
    const checkResult = await performCheck(monitor);

    // Save metric record
    const metric = new Metric({
      monitor: monitor._id,
      user: req.user.id,
      timestamp: new Date(),
      responseTime: checkResult.responseTime,
      statusCode: checkResult.statusCode,
      status: checkResult.status,
      errorMessage: checkResult.errorMessage,
      isUp: checkResult.isUp
    });
    await metric.save();

    // Update incident status & monitor counters
    await handleCheckResult(monitor, checkResult);

    // Recalculate rolling uptimes
    const [uptime7d, uptime30d] = await Promise.all([
      calculateRollingUptime(monitor._id, 7),
      calculateRollingUptime(monitor._id, 30)
    ]);
    monitor.uptime7d = uptime7d;
    monitor.uptime30d = uptime30d;
    await monitor.save();

    return res.status(200).json({
      success: true,
      message: 'Manual check completed',
      data: {
        result: checkResult,
        monitor
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get paginated check history for a monitor.
 */
export const getMonitorHistory = async (req, res, next) => {
  try {
    const monitor = await Monitor.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false
    });

    if (!monitor) {
      return res.status(404).json({
        success: false,
        error: 'Monitor not found'
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [metrics, total] = await Promise.all([
      Metric.find({ monitor: monitor._id })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      Metric.countDocuments({ monitor: monitor._id })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        metrics,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  listMonitors,
  createMonitor,
  getMonitor,
  updateMonitor,
  deleteMonitor,
  pauseMonitor,
  resumeMonitor,
  checkMonitor,
  getMonitorHistory
};
