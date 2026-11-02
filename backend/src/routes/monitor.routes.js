import { Router } from 'express';
import { body, param } from 'express-validator';
import monitorController from '../controllers/monitor.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Protect all monitor routes with auth middleware
router.use(auth);

// GET /api/monitors - list user's monitors
router.get('/', monitorController.listMonitors);

// POST /api/monitors - create monitor
router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Monitor name is required')
      .isLength({ max: 100 })
      .withMessage('Monitor name cannot exceed 100 characters'),
    body('url')
      .trim()
      .notEmpty()
      .withMessage('URL is required')
      .isURL({ require_protocol: true, protocols: ['http', 'https'] })
      .withMessage('A valid HTTP or HTTPS URL is required'),
    body('method')
      .optional()
      .toUpperCase()
      .isIn(['GET', 'POST', 'PUT', 'DELETE', 'HEAD'])
      .withMessage('Method must be GET, POST, PUT, DELETE, or HEAD'),
    body('interval')
      .optional()
      .isInt({ min: 1, max: 1440 })
      .withMessage('Interval must be an integer between 1 and 1440 minutes'),
    body('timeout')
      .optional()
      .isInt({ min: 1000, max: 60000 })
      .withMessage('Timeout must be an integer between 1000 and 60000 ms')
  ],
  validate,
  monitorController.createMonitor
);

// GET /api/monitors/:id - get single monitor
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid monitor ID format')],
  validate,
  monitorController.getMonitor
);

// PUT /api/monitors/:id - update monitor
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid monitor ID format'),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Name cannot be empty')
      .isLength({ max: 100 })
      .withMessage('Name cannot exceed 100 characters'),
    body('url')
      .optional()
      .trim()
      .isURL({ require_protocol: true, protocols: ['http', 'https'] })
      .withMessage('A valid HTTP or HTTPS URL is required'),
    body('method')
      .optional()
      .toUpperCase()
      .isIn(['GET', 'POST', 'PUT', 'DELETE', 'HEAD'])
      .withMessage('Method must be GET, POST, PUT, DELETE, or HEAD'),
    body('interval')
      .optional()
      .isInt({ min: 1, max: 1440 })
      .withMessage('Interval must be between 1 and 1440 minutes'),
    body('timeout')
      .optional()
      .isInt({ min: 1000, max: 60000 })
      .withMessage('Timeout must be between 1000 and 60000 ms')
  ],
  validate,
  monitorController.updateMonitor
);

// DELETE /api/monitors/:id - soft delete monitor
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid monitor ID format')],
  validate,
  monitorController.deleteMonitor
);

// POST /api/monitors/:id/pause - pause monitoring
router.post(
  '/:id/pause',
  [param('id').isMongoId().withMessage('Invalid monitor ID format')],
  validate,
  monitorController.pauseMonitor
);

// POST /api/monitors/:id/resume - resume monitoring
router.post(
  '/:id/resume',
  [param('id').isMongoId().withMessage('Invalid monitor ID format')],
  validate,
  monitorController.resumeMonitor
);

// POST /api/monitors/:id/check - manual health check
router.post(
  '/:id/check',
  [param('id').isMongoId().withMessage('Invalid monitor ID format')],
  validate,
  monitorController.checkMonitor
);

// GET /api/monitors/:id/history - monitoring history (paginated)
router.get(
  '/:id/history',
  [param('id').isMongoId().withMessage('Invalid monitor ID format')],
  validate,
  monitorController.getMonitorHistory
);

export default router;
