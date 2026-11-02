import { Router } from 'express';
import { query } from 'express-validator';
import metricsController from '../controllers/metrics.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Protect all metrics routes with auth middleware
router.use(auth);

// GET /api/metrics/analytics - aggregated analytics
router.get(
  '/analytics',
  [
    query('monitorId')
      .optional()
      .isMongoId()
      .withMessage('Invalid monitorId format'),
    query('range')
      .optional()
      .isIn(['1h', '24h', '1d', '7d', '30d'])
      .withMessage('Range must be one of: 1h, 24h, 1d, 7d, 30d'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('startDate must be a valid ISO8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('endDate must be a valid ISO8601 date')
  ],
  validate,
  metricsController.getMetricsAnalytics
);

// GET /api/metrics/slowest - slowest endpoints
router.get(
  '/slowest',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be an integer between 1 and 50')
  ],
  validate,
  metricsController.getSlowest
);

export default router;
