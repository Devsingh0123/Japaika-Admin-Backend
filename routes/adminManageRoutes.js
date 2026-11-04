import express from 'express';
import {
  getAvailablePermissions,
  listAdmins,
  createAdminUser,
  updateAdminRole,
  updateAdminPermissions,
  updateAdminStatus,
  deleteAdminUser
} from '../controllers/adminManageController.js';
import { adminAuth, superAdminOnly, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// All staff routes require admin authentication
router.use(adminAuth);

// GET /api/v1/admin/admins/permissions - List all supported permission keys
router.get('/permissions', getAvailablePermissions);

// GET /api/v1/admin/admins - List staff
router.get('/', requirePermission('admins:read'), listAdmins);

// Staff management operations restricted to Super Admins
router.post('/', superAdminOnly, createAdminUser);
router.patch('/:id/role', superAdminOnly, updateAdminRole);
router.patch('/:id/permissions', superAdminOnly, updateAdminPermissions);
router.patch('/:id/status', superAdminOnly, updateAdminStatus);
router.delete('/:id', superAdminOnly, deleteAdminUser);

export default router;
