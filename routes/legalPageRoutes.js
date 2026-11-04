import express from 'express';
import {
  getLegalPages,
  getLegalPageBySlug,
  updateLegalPage
} from '../controllers/legalPageController.js';
import { adminAuth, requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.use(adminAuth);

// GET /api/v1/admin/legal-pages
router.get('/', requirePermission('legal_pages:read'), getLegalPages);

// GET /api/v1/admin/legal-pages/:slug
router.get('/:slug', requirePermission('legal_pages:read'), getLegalPageBySlug);

// PUT & PATCH /api/v1/admin/legal-pages/:slug
router.put('/:slug', requirePermission('legal_pages:write'), updateLegalPage);
router.patch('/:slug', requirePermission('legal_pages:write'), updateLegalPage);

export default router;
