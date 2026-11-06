import { Op } from 'sequelize';
import { Dosha } from '../models/index.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const VALID_CATEGORIES = ['marriage', 'planetary', 'karmic', 'nakshatra', 'general'];
const VALID_SEVERITIES = ['low', 'medium', 'high', 'severe'];
const VALID_STATUSES = ['draft', 'published', 'archived'];

/**
 * Helper to slugify a string if slug is not explicitly provided.
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * GET /api/v1/admin/doshas
 * Lists doshas with search, category/status/active filters, pagination, and KPI counts.
 */
export const getDoshas = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    status,
    is_active,
    page = 1,
    limit = 20
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const whereClause = {};

  if (search) {
    const term = `%${search.trim()}%`;
    whereClause[Op.or] = [
      { name: { [Op.like]: term } },
      { title: { [Op.like]: term } },
      { slug: { [Op.like]: term } }
    ];
  }

  if (category && VALID_CATEGORIES.includes(category.toLowerCase())) {
    whereClause.category = category.toLowerCase();
  }

  if (status && VALID_STATUSES.includes(status.toLowerCase())) {
    whereClause.status = status.toLowerCase();
  }

  if (is_active !== undefined) {
    whereClause.is_active = is_active === 'true' || is_active === true;
  }

  const { count, rows: doshas } = await Dosha.findAndCountAll({
    where: whereClause,
    limit: limitNum,
    offset,
    order: [
      ['sort_order', 'ASC'],
      ['created_at', 'DESC']
    ]
  });

  // Calculate summary metrics across all non-deleted records
  const totalCount = await Dosha.count();
  const publishedCount = await Dosha.count({ where: { status: 'published', is_active: true } });
  const draftCount = await Dosha.count({ where: { status: 'draft' } });

  res.status(200).json({
    success: true,
    message: 'Doshas list retrieved successfully',
    data: {
      doshas,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum) || 1
      },
      metrics: {
        total: totalCount,
        published: publishedCount,
        drafts: draftCount
      }
    }
  });
});

/**
 * GET /api/v1/admin/doshas/:id
 * Retrieves full details of a specific Dosha.
 */
export const getDoshaById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const dosha = await Dosha.findByPk(id);

  if (!dosha) {
    return next(new AppError('Dosha not found with the provided ID.', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Dosha details retrieved successfully',
    data: {
      dosha
    }
  });
});

/**
 * POST /api/v1/admin/doshas
 * Creates a new Vedic Dosha entry with astrological causes, cancellations, remedies, and SEO metadata.
 */
export const createDosha = asyncHandler(async (req, res, next) => {
  const {
    name,
    sanskrit_name,
    slug,
    title,
    subtitle,
    category,
    severity,
    affected_planets,
    affected_houses,
    excerpt,
    description,
    effects,
    cancellations,
    remedies,
    featured_image,
    status,
    is_active,
    sort_order,
    meta_title,
    meta_description,
    meta_keywords,
    canonical_url
  } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return next(new AppError('A valid dosha name is required.', 400));
  }

  if (!description || typeof description !== 'string' || !description.trim()) {
    return next(new AppError('A detailed description explaining the dosha is required.', 400));
  }

  const generatedSlug = slug?.trim() ? slugify(slug) : slugify(name);

  // Check unique slug (including soft-deleted)
  const existing = await Dosha.findOne({
    where: { slug: generatedSlug },
    paranoid: false
  });

  if (existing) {
    return next(new AppError(`A dosha with slug "${generatedSlug}" already exists.`, 400));
  }

  const cleanCategory = category && VALID_CATEGORIES.includes(category.toLowerCase())
    ? category.toLowerCase()
    : 'general';

  const cleanSeverity = severity && VALID_SEVERITIES.includes(severity.toLowerCase())
    ? severity.toLowerCase()
    : 'medium';

  const cleanStatus = status && VALID_STATUSES.includes(status.toLowerCase())
    ? status.toLowerCase()
    : 'published';

  const newDosha = await Dosha.create({
    name: name.trim(),
    sanskrit_name: sanskrit_name?.trim() || null,
    slug: generatedSlug,
    title: title?.trim() || `${name.trim()} in Vedic Astrology`,
    subtitle: subtitle?.trim() || null,
    category: cleanCategory,
    severity: cleanSeverity,
    affected_planets: Array.isArray(affected_planets) ? affected_planets : [],
    affected_houses: Array.isArray(affected_houses) ? affected_houses : [],
    excerpt: excerpt?.trim() || null,
    description: description.trim(),
    effects: effects?.trim() || null,
    cancellations: cancellations?.trim() || null,
    remedies: Array.isArray(remedies) ? remedies : [],
    featured_image: featured_image?.trim() || null,
    status: cleanStatus,
    is_active: typeof is_active === 'boolean' ? is_active : true,
    sort_order: parseInt(sort_order, 10) || 0,
    meta_title: meta_title?.trim() || `${name.trim()} Guide | Japaika`,
    meta_description: meta_description?.trim() || (excerpt?.trim() ? excerpt.trim().slice(0, 160) : null),
    meta_keywords: meta_keywords?.trim() || null,
    canonical_url: canonical_url?.trim() || `https://japaika.com/doshas/${generatedSlug}`
  });

  res.status(201).json({
    success: true,
    message: 'Dosha created successfully',
    data: {
      dosha: newDosha
    }
  });
});

/**
 * PATCH /api/v1/admin/doshas/:id
 * Updates an existing Dosha's information.
 */
export const updateDosha = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const {
    name,
    sanskrit_name,
    slug,
    title,
    subtitle,
    category,
    severity,
    affected_planets,
    affected_houses,
    excerpt,
    description,
    effects,
    cancellations,
    remedies,
    featured_image,
    status,
    is_active,
    sort_order,
    meta_title,
    meta_description,
    meta_keywords,
    canonical_url
  } = req.body;

  const dosha = await Dosha.findByPk(id);

  if (!dosha) {
    return next(new AppError('Dosha not found with the provided ID.', 404));
  }

  const updates = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return next(new AppError('Dosha name cannot be empty.', 400));
    }
    updates.name = name.trim();
  }

  if (sanskrit_name !== undefined) updates.sanskrit_name = sanskrit_name?.trim() || null;
  if (title !== undefined) updates.title = title?.trim() || dosha.title;
  if (subtitle !== undefined) updates.subtitle = subtitle?.trim() || null;
  if (excerpt !== undefined) updates.excerpt = excerpt?.trim() || null;

  if (description !== undefined) {
    if (typeof description !== 'string' || !description.trim()) {
      return next(new AppError('Description cannot be empty.', 400));
    }
    updates.description = description.trim();
  }

  if (effects !== undefined) updates.effects = effects?.trim() || null;
  if (cancellations !== undefined) updates.cancellations = cancellations?.trim() || null;
  if (featured_image !== undefined) updates.featured_image = featured_image?.trim() || null;

  if (category !== undefined) {
    if (!VALID_CATEGORIES.includes(category.toLowerCase())) {
      return next(new AppError(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`, 400));
    }
    updates.category = category.toLowerCase();
  }

  if (severity !== undefined) {
    if (!VALID_SEVERITIES.includes(severity.toLowerCase())) {
      return next(new AppError(`Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}`, 400));
    }
    updates.severity = severity.toLowerCase();
  }

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status.toLowerCase())) {
      return next(new AppError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400));
    }
    updates.status = status.toLowerCase();
  }

  if (is_active !== undefined) {
    if (typeof is_active !== 'boolean') {
      return next(new AppError('is_active must be a boolean value.', 400));
    }
    updates.is_active = is_active;
  }

  if (sort_order !== undefined) {
    updates.sort_order = parseInt(sort_order, 10) || 0;
  }

  if (slug !== undefined) {
    const cleanSlug = slugify(slug);
    if (!cleanSlug) {
      return next(new AppError('Slug cannot be empty.', 400));
    }
    if (cleanSlug !== dosha.slug) {
      const existing = await Dosha.findOne({
        where: { slug: cleanSlug },
        paranoid: false
      });
      if (existing) {
        return next(new AppError(`A dosha with slug "${cleanSlug}" already exists.`, 400));
      }
      updates.slug = cleanSlug;
    }
  }

  if (affected_planets !== undefined) {
    if (!Array.isArray(affected_planets)) {
      return next(new AppError('affected_planets must be an array of planet names.', 400));
    }
    updates.affected_planets = affected_planets;
  }

  if (affected_houses !== undefined) {
    if (!Array.isArray(affected_houses)) {
      return next(new AppError('affected_houses must be an array of house numbers.', 400));
    }
    updates.affected_houses = affected_houses;
  }

  if (remedies !== undefined) {
    if (!Array.isArray(remedies)) {
      return next(new AppError('remedies must be an array of remedy objects.', 400));
    }
    updates.remedies = remedies;
  }

  if (meta_title !== undefined) updates.meta_title = meta_title?.trim() || null;
  if (meta_description !== undefined) updates.meta_description = meta_description?.trim() || null;
  if (meta_keywords !== undefined) updates.meta_keywords = meta_keywords?.trim() || null;
  if (canonical_url !== undefined) updates.canonical_url = canonical_url?.trim() || null;

  await dosha.update(updates);

  res.status(200).json({
    success: true,
    message: 'Dosha updated successfully',
    data: {
      dosha
    }
  });
});

/**
 * PATCH /api/v1/admin/doshas/:id/status
 * 1-click status update (toggles or sets is_active and/or publishing status).
 */
export const updateDoshaStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { is_active, status } = req.body;

  const dosha = await Dosha.findByPk(id);

  if (!dosha) {
    return next(new AppError('Dosha not found with the provided ID.', 404));
  }

  const updates = {};

  if (is_active !== undefined) {
    updates.is_active = typeof is_active === 'boolean' ? is_active : !dosha.is_active;
  } else if (status === undefined) {
    // If neither is_active nor status is provided, toggle is_active by default
    updates.is_active = !dosha.is_active;
  }

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status.toLowerCase())) {
      return next(new AppError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400));
    }
    updates.status = status.toLowerCase();
  }

  await dosha.update(updates);

  res.status(200).json({
    success: true,
    message: `Dosha "${dosha.name}" status updated successfully`,
    data: {
      id: dosha.id,
      name: dosha.name,
      status: dosha.status,
      is_active: dosha.is_active
    }
  });
});

/**
 * DELETE /api/v1/admin/doshas/:id
 * Soft deletes a Dosha using paranoid deleted_at.
 */
export const deleteDosha = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const dosha = await Dosha.findByPk(id);

  if (!dosha) {
    return next(new AppError('Dosha not found with the provided ID.', 404));
  }

  const now = new Date();
  await dosha.destroy();

  res.status(200).json({
    success: true,
    message: `Dosha "${dosha.name}" (${dosha.slug}) deleted successfully`,
    data: {
      id: dosha.id,
      slug: dosha.slug,
      deleted_at: dosha.deleted_at || now
    }
  });
});
