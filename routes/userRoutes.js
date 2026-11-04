import express from 'express';
import {
  getUsers,
  getUserById,
  updateUserStatus,
  adjustUserCredits,
  exportUsers
} from '../controllers/userController.js';
import { adminAuth, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply adminAuth to all user management routes
router.use(adminAuth);

// GET /api/v1/admin/users
router.get('/', requirePermission('users:read'), getUsers);

// GET /api/v1/admin/users/export (Must be before /:id)
router.get('/export', requirePermission('users:read'), exportUsers);

// GET /api/v1/admin/users/:id
router.get('/:id', requirePermission('users:read'), getUserById);

// PATCH /api/v1/admin/users/:id/status
router.patch('/:id/status', requirePermission('users:write'), updateUserStatus);

// PATCH /api/v1/admin/users/:id/credits
router.patch('/:id/credits', requirePermission('users:write'), adjustUserCredits);

export default router;
