import { LegalPage } from '../models/index.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const DEFAULT_LEGAL_PAGES = [
  { slug: 'privacy-policy', title: 'Privacy Policy' },
  { slug: 'terms', title: 'Terms & Conditions' },
  { slug: 'refund-policy', title: 'Refund Policy' },
  { slug: 'disclaimer', title: 'Disclaimer' }
];

const SLUG_ALIASES = {
  'privacy': 'privacy-policy',
  'privacy_policy': 'privacy-policy',
  'terms-and-conditions': 'terms',
  'terms_and_conditions': 'terms',
  'refund': 'refund-policy',
  'refund_policy': 'refund-policy'
};

const normalizeSlug = (rawSlug) => {
  if (!rawSlug || typeof rawSlug !== 'string') return '';
  const cleaned = rawSlug.trim().toLowerCase();
  return SLUG_ALIASES[cleaned] || cleaned;
};

/**
 * Ensures the 4 core legal pages exist in the database.
 */
const ensureDefaultLegalPages = async () => {
  for (const def of DEFAULT_LEGAL_PAGES) {
    const existing = await LegalPage.findOne({ where: { slug: def.slug }, paranoid: false });
    if (!existing) {
      await LegalPage.create({
        slug: def.slug,
        title: def.title,
        content: '',
        is_active: true
      });
    } else if (existing.deleted_at || existing.deletedAt) {
      await existing.restore();
    }
  }
};

/**
 * GET /api/v1/admin/legal-pages
 * Retrieves all 4 legal pages (privacy-policy, terms, refund-policy, disclaimer).
 */
export const getLegalPages = asyncHandler(async (req, res) => {
  await ensureDefaultLegalPages();

  const legalPages = await LegalPage.findAll({
    order: [['created_at', 'ASC']]
  });

  res.status(200).json({
    success: true,
    message: 'Legal pages retrieved successfully',
    data: {
      legalPages
    }
  });
});

/**
 * GET /api/v1/admin/legal-pages/:slug
 * Retrieves a single legal page by slug (or ID).
 */
export const getLegalPageBySlug = asyncHandler(async (req, res, next) => {
  await ensureDefaultLegalPages();

  const rawParam = req.params.slug;
  const normalized = normalizeSlug(rawParam);

  let legalPage = await LegalPage.findOne({ where: { slug: normalized } });
  if (!legalPage) {
    legalPage = await LegalPage.findByPk(rawParam);
  }

  if (!legalPage) {
    return next(new AppError(`Legal page "${rawParam}" not found.`, 404));
  }

  res.status(200).json({
    success: true,
    message: 'Legal page retrieved successfully',
    data: {
      legalPage
    }
  });
});

/**
 * PUT / PATCH /api/v1/admin/legal-pages/:slug
 * Updates a legal page's title, content, or active status by slug (or ID).
 */
export const updateLegalPage = asyncHandler(async (req, res, next) => {
  await ensureDefaultLegalPages();

  const rawParam = req.params.slug;
  const normalized = normalizeSlug(rawParam);
  const { title, content, is_active } = req.body;

  let legalPage = await LegalPage.findOne({ where: { slug: normalized } });
  if (!legalPage) {
    legalPage = await LegalPage.findByPk(rawParam);
  }

  if (!legalPage) {
    return next(new AppError(`Legal page "${rawParam}" not found.`, 404));
  }

  const updates = {};

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return next(new AppError('Legal page title cannot be empty.', 400));
    }
    updates.title = title.trim();
  }

  if (content !== undefined) {
    if (typeof content !== 'string') {
      return next(new AppError('content must be a string.', 400));
    }
    updates.content = content;
  }

  if (is_active !== undefined) {
    if (typeof is_active !== 'boolean') {
      return next(new AppError('is_active must be a boolean value.', 400));
    }
    updates.is_active = is_active;
  }

  await legalPage.update(updates);

  res.status(200).json({
    success: true,
    message: `${legalPage.title} updated successfully`,
    data: {
      legalPage
    }
  });
});
