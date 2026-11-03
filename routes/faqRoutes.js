import express from 'express';
import {
  getFaqs,
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaq
} from '../controllers/faqController.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(adminAuth);

// GET /api/v1/admin/faqs
router.get('/', getFaqs);

// GET /api/v1/admin/faqs/:id
router.get('/:id', getFaqById);

// POST /api/v1/admin/faqs
router.post('/', createFaq);

// PATCH & PUT /api/v1/admin/faqs/:id
router.patch('/:id', updateFaq);
router.put('/:id', updateFaq);

// DELETE /api/v1/admin/faqs/:id
router.delete('/:id', deleteFaq);

export default router;
