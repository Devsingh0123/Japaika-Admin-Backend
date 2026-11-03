import { Faq } from '../models/index.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * GET /api/v1/admin/faqs
 * Lists all FAQs ordered by sort_order ASC, created_at DESC.
 */
export const getFaqs = asyncHandler(async (req, res) => {
  const { category, is_active } = req.query;

  const whereClause = {};

  if (category && category !== 'all') {
    whereClause.category = category.trim().toLowerCase();
  }

  if (is_active !== undefined) {
    whereClause.is_active = is_active === 'true' || is_active === true;
  }

  const faqs = await Faq.findAll({
    where: whereClause,
    order: [
      ['sort_order', 'ASC'],
      ['created_at', 'DESC']
    ]
  });

  res.status(200).json({
    success: true,
    message: 'FAQs retrieved successfully',
    data: {
      faqs
    }
  });
});

/**
 * GET /api/v1/admin/faqs/:id
 * Retrieves a single FAQ by ID.
 */
export const getFaqById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const faq = await Faq.findByPk(id);
  if (!faq) {
    return next(new AppError('FAQ not found with the provided ID.', 404));
  }

  res.status(200).json({
    success: true,
    message: 'FAQ retrieved successfully',
    data: {
      faq
    }
  });
});

/**
 * POST /api/v1/admin/faqs
 * Creates a new FAQ item.
 */
export const createFaq = asyncHandler(async (req, res, next) => {
  const { question, answer, category, sort_order, is_active } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    return next(new AppError('Question is required.', 400));
  }

  if (!answer || typeof answer !== 'string' || !answer.trim()) {
    return next(new AppError('Answer is required.', 400));
  }

  const faq = await Faq.create({
    question: question.trim(),
    answer: answer.trim(),
    category: category?.trim()?.toLowerCase() || 'general',
    sort_order: Number.isFinite(Number(sort_order)) ? parseInt(sort_order, 10) : 0,
    is_active: typeof is_active === 'boolean' ? is_active : true
  });

  res.status(201).json({
    success: true,
    message: 'FAQ created successfully',
    data: {
      faq
    }
  });
});

/**
 * PATCH / PUT /api/v1/admin/faqs/:id
 * Updates an existing FAQ item.
 */
export const updateFaq = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { question, answer, category, sort_order, is_active } = req.body;

  const faq = await Faq.findByPk(id);
  if (!faq) {
    return next(new AppError('FAQ not found with the provided ID.', 404));
  }

  const updates = {};

  if (question !== undefined) {
    if (typeof question !== 'string' || !question.trim()) {
      return next(new AppError('Question cannot be empty.', 400));
    }
    updates.question = question.trim();
  }

  if (answer !== undefined) {
    if (typeof answer !== 'string' || !answer.trim()) {
      return next(new AppError('Answer cannot be empty.', 400));
    }
    updates.answer = answer.trim();
  }

  if (category !== undefined) {
    updates.category = category?.trim()?.toLowerCase() || 'general';
  }

  if (sort_order !== undefined) {
    updates.sort_order = Number.isFinite(Number(sort_order)) ? parseInt(sort_order, 10) : 0;
  }

  if (is_active !== undefined) {
    if (typeof is_active !== 'boolean') {
      return next(new AppError('is_active must be a boolean value.', 400));
    }
    updates.is_active = is_active;
  }

  await faq.update(updates);

  res.status(200).json({
    success: true,
    message: 'FAQ updated successfully',
    data: {
      faq
    }
  });
});

/**
 * DELETE /api/v1/admin/faqs/:id
 * Soft-deletes an FAQ item.
 */
export const deleteFaq = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const faq = await Faq.findByPk(id);
  if (!faq) {
    return next(new AppError('FAQ not found with the provided ID.', 404));
  }

  await faq.destroy();

  res.status(200).json({
    success: true,
    message: 'FAQ deleted successfully',
    data: {
      id: faq.id
    }
  });
});
