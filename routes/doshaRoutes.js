import express from 'express';
import {
  getDoshas,
  getDoshaById,
  createDosha,
  updateDosha,
  updateDoshaStatus,
  deleteDosha
} from '../controllers/doshaController.js';
import { adminAuth, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// All dosha admin endpoints require authenticated administrator session
router.use(adminAuth);

// GET /api/v1/admin/doshas
router.get('/', requirePermission('doshas:read'), getDoshas);

// GET /api/v1/admin/doshas/:id
router.get('/:id', requirePermission('doshas:read'), getDoshaById);

// POST /api/v1/admin/doshas
router.post('/', requirePermission('doshas:write'), createDosha);

// PATCH /api/v1/admin/doshas/:id/status (toggle active or draft/published status)
router.patch('/:id/status', requirePermission('doshas:write'), updateDoshaStatus);

// PATCH /api/v1/admin/doshas/:id
router.patch('/:id', requirePermission('doshas:write'), updateDosha);

// DELETE /api/v1/admin/doshas/:id
router.delete('/:id', requirePermission('doshas:write'), deleteDosha);

export default router;
