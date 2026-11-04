import express from 'express';
import {
  getFaqs,
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaq
} from '../controllers/faqController.js';
import { adminAuth, requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.use(adminAuth);

// GET /api/v1/admin/faqs
router.get('/', requirePermission('faqs:read'), getFaqs);

// GET /api/v1/admin/faqs/:id
router.get('/:id', requirePermission('faqs:read'), getFaqById);

// POST /api/v1/admin/faqs
router.post('/', requirePermission('faqs:write'), createFaq);

// PATCH & PUT /api/v1/admin/faqs/:id
router.patch('/:id', requirePermission('faqs:write'), updateFaq);
router.put('/:id', requirePermission('faqs:write'), updateFaq);

// DELETE /api/v1/admin/faqs/:id
router.delete('/:id', requirePermission('faqs:write'), deleteFaq);

export default router;
