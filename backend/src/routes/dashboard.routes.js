import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Protect all dashboard routes with auth middleware
router.use(auth);

// GET /api/dashboard/summary - all dashboard stats
router.get('/summary', dashboardController.getDashboardSummary);

export default router;
