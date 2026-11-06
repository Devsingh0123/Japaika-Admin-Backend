import express from 'express';
import {
  getDashboardMetrics,
  getRevenueChart,
  getQuestionTopicStats
} from '../controllers/dashboardController.js';
import { adminAuth, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply adminAuth and dashboard:read permission to all dashboard routes
router.use(adminAuth, requirePermission('dashboard:read'));

// GET /api/v1/admin/dashboard/metrics - Fast KPI summary cards
router.get('/metrics', getDashboardMetrics);

// GET /api/v1/admin/dashboard/revenue-chart - Daily revenue & orders time-series chart
router.get('/revenue-chart', getRevenueChart);

// GET /api/v1/admin/dashboard/topics - User question distribution by astrology topic
router.get('/topics', getQuestionTopicStats);

export default router;
