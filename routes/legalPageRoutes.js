import express from 'express';
import {
  getLegalPages,
  getLegalPageBySlug,
  updateLegalPage
} from '../controllers/legalPageController.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(adminAuth);

// GET /api/v1/admin/legal-pages
router.get('/', getLegalPages);

// GET /api/v1/admin/legal-pages/:slug
router.get('/:slug', getLegalPageBySlug);

// PUT & PATCH /api/v1/admin/legal-pages/:slug
router.put('/:slug', updateLegalPage);
router.patch('/:slug', updateLegalPage);

export default router;
