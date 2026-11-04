import express from 'express';
import {
  getQuestionPacks,
  createQuestionPack,
  updateQuestionPack,
  deleteQuestionPack
} from '../controllers/questionPackController.js';
import { adminAuth, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply adminAuth to all question pack endpoints
router.use(adminAuth);

// GET /api/v1/admin/question-packs
router.get('/', requirePermission('question_packs:read'), getQuestionPacks);

// POST /api/v1/admin/question-packs
router.post('/', requirePermission('question_packs:write'), createQuestionPack);

// PATCH /api/v1/admin/question-packs/:id
router.patch('/:id', requirePermission('question_packs:write'), updateQuestionPack);

// DELETE /api/v1/admin/question-packs/:id
router.delete('/:id', requirePermission('question_packs:write'), deleteQuestionPack);

export default router;
