import { Router } from 'express';
import { param, query } from 'express-validator';
import incidentsController from '../controllers/incidents.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Protect all incident routes with auth middleware
router.use(auth);

// GET /api/incidents - list incidents
router.get(
  '/',
  [
    query('status')
      .optional()
      .isIn(['open', 'resolved'])
      .withMessage('Status must be either "open" or "resolved"'),
    query('monitorId')
      .optional()
      .isMongoId()
      .withMessage('Invalid monitorId format'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  validate,
  incidentsController.listIncidents
);

// GET /api/incidents/:id - single incident
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid incident ID format')],
  validate,
  incidentsController.getIncident
);

// PUT /api/incidents/:id/resolve - manually resolve
router.put(
  '/:id/resolve',
  [param('id').isMongoId().withMessage('Invalid incident ID format')],
  validate,
  incidentsController.resolveIncidentManual
);

export default router;
