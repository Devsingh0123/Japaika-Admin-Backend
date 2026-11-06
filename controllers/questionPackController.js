import { QuestionPack, Coupon } from '../models/index.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateQuestionPackPrices } from '../utils/validatePrices.js';

/**
 * Computes dynamic offer telemetry when a valid default coupon is linked to a pack.
 *
 * @param {Object} pack - QuestionPack instance or plain object
 * @returns {Object|null} Offer telemetry or null if no valid coupon is linked
 */
function computeOfferTelemetry(pack) {
  const coupon = pack.default_coupon;
  if (!coupon || !coupon.is_active) {
    return null;
  }
  if (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) {
    return null;
  }

  const prices = typeof pack.prices === 'string' ? JSON.parse(pack.prices) : pack.prices;
  if (!prices || typeof prices !== 'object') {
    return null;
  }

  const offerPrices = {};
  const val = Number(coupon.discount_value) || 0;

  for (const [curr, p] of Object.entries(prices)) {
    const base = Number(p.basePrice !== undefined ? p.basePrice : p);
    if (isNaN(base) || base <= 0) continue;

    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = Math.round((base * (val / 100)) * 100) / 100;
    } else if (coupon.discount_type === 'flat') {
      if (curr === 'USD' && val > base) {
        const inrBase = prices.INR ? Number(prices.INR.basePrice !== undefined ? prices.INR.basePrice : prices.INR) : null;
        if (inrBase && inrBase > 0) {
          const ratio = Math.min(1, val / inrBase);
          discountAmount = Math.round((base * ratio) * 100) / 100;
        } else {
          discountAmount = Math.min(base, val);
        }
      } else {
        discountAmount = Math.min(base, val);
      }
    }

    const effectivePrice = Math.max(0, Math.round((base - discountAmount) * 100) / 100);
    offerPrices[curr] = {
      basePrice: base,
      discountAmount,
      effectivePrice
    };
  }

  return {
    coupon_id: coupon.id,
    coupon_code: coupon.code,
    discount_type: coupon.discount_type,
    discount_value: Number(coupon.discount_value),
    prices: offerPrices
  };
}

/**
 * Serializes a QuestionPack including its default_coupon and computed offer.
 *
 * @param {Object} pack - QuestionPack instance or plain object
 * @returns {Object} Formatted pack object
 */
function formatQuestionPack(pack) {
  const raw = typeof pack.toJSON === 'function' ? pack.toJSON() : pack;
  return {
    ...raw,
    offer: computeOfferTelemetry(raw)
  };
}

/**
 * GET /api/v1/admin/question-packs
 * Retrieves all question packs with active/sort ordering, eager loading default coupons and computed offers.
 */
export const getQuestionPacks = asyncHandler(async (req, res) => {
  const { is_active, include_deleted } = req.query;

  const whereClause = {};

  if (is_active !== undefined) {
    whereClause.is_active = is_active === 'true' || is_active === true;
  }

  const paranoid = include_deleted !== 'true';

  const packs = await QuestionPack.findAll({
    where: whereClause,
    paranoid,
    include: [
      {
        model: Coupon,
        as: 'default_coupon',
        attributes: [
          'id',
          'code',
          'description',
          'discount_type',
          'discount_value',
          'is_active',
          'expires_at'
        ]
      }
    ],
    order: [
      ['sort_order', 'ASC'],
      ['credits', 'ASC'],
      ['created_at', 'DESC']
    ]
  });

  res.status(200).json({
    success: true,
    message: 'Question packs retrieved successfully',
    data: {
      packs: packs.map(formatQuestionPack)
    }
  });
});

/**
 * POST /api/v1/admin/question-packs
 * Creates a new question pack with multi-currency basePrice and optional auto-apply coupon.
 */
export const createQuestionPack = asyncHandler(async (req, res, next) => {
  const {
    name,
    credits,
    prices,
    code,
    title,
    tier,
    default_coupon_id,
    is_active,
    sort_order
  } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return next(new AppError('A valid pack name is required.', 400));
  }

  const parsedCredits = parseInt(credits, 10);
  if (isNaN(parsedCredits) || parsedCredits <= 0) {
    return next(new AppError('credits must be a positive integer greater than 0.', 400));
  }

  const sanitizedPrices = validateQuestionPackPrices(prices, { requireBoth: true });

  // Derive unique code if not explicitly passed
  const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  const packCode = code?.trim()?.toLowerCase() || `pack_${cleanName}_${parsedCredits}`;

  const existingPack = await QuestionPack.findOne({
    where: { code: packCode },
    paranoid: false
  });

  if (existingPack) {
    return next(new AppError(`A question pack with code "${packCode}" already exists.`, 400));
  }

  let validatedCouponId = null;
  if (default_coupon_id !== undefined && default_coupon_id !== null && default_coupon_id !== '') {
    const coupon = await Coupon.findByPk(default_coupon_id);
    if (!coupon) {
      return next(new AppError('The specified default coupon was not found.', 404));
    }
    if (!coupon.is_active) {
      return next(new AppError('The specified default coupon is inactive.', 400));
    }
    validatedCouponId = coupon.id;
  }

  const validTiers = ['silver', 'gold', 'diamond', 'custom'];
  const packTier = tier && validTiers.includes(tier.toLowerCase()) ? tier.toLowerCase() : 'silver';

  const newPack = await QuestionPack.create({
    code: packCode,
    name: name.trim(),
    title: title?.trim() || `${name.trim()} Pack (${parsedCredits} Questions)`,
    tier: packTier,
    credits: parsedCredits,
    prices: sanitizedPrices,
    default_coupon_id: validatedCouponId,
    is_active: typeof is_active === 'boolean' ? is_active : true,
    sort_order: parseInt(sort_order, 10) || 0
  });

  // Re-fetch with coupon association for consistent output
  const createdPack = await QuestionPack.findByPk(newPack.id, {
    include: [
      {
        model: Coupon,
        as: 'default_coupon',
        attributes: [
          'id',
          'code',
          'description',
          'discount_type',
          'discount_value',
          'is_active',
          'expires_at'
        ]
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Question pack created successfully',
    data: {
      pack: formatQuestionPack(createdPack || newPack)
    }
  });
});

/**
 * PATCH /api/v1/admin/question-packs/:id
 * Updates basePrice pricing, credits, linked default coupon, active status, or metadata.
 */
export const updateQuestionPack = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const {
    name,
    credits,
    prices,
    code,
    title,
    tier,
    default_coupon_id,
    is_active,
    sort_order
  } = req.body;

  const pack = await QuestionPack.findByPk(id);

  if (!pack) {
    return next(new AppError('Question pack not found with the provided ID.', 404));
  }

  const updates = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return next(new AppError('Pack name cannot be empty.', 400));
    }
    updates.name = name.trim();
  }

  if (credits !== undefined) {
    const parsedCredits = parseInt(credits, 10);
    if (isNaN(parsedCredits) || parsedCredits <= 0) {
      return next(new AppError('credits must be a positive integer greater than 0.', 400));
    }
    updates.credits = parsedCredits;
  }

  if (prices !== undefined) {
    updates.prices = validateQuestionPackPrices(prices, { requireBoth: false });
  }

  if (default_coupon_id !== undefined) {
    if (default_coupon_id === null || default_coupon_id === '' || default_coupon_id === 'null') {
      updates.default_coupon_id = null;
    } else {
      const coupon = await Coupon.findByPk(default_coupon_id);
      if (!coupon) {
        return next(new AppError('The specified default coupon was not found.', 404));
      }
      if (!coupon.is_active) {
        return next(new AppError('The specified default coupon is inactive.', 400));
      }
      updates.default_coupon_id = coupon.id;
    }
  }

  if (is_active !== undefined) {
    if (typeof is_active !== 'boolean') {
      return next(new AppError('is_active must be a boolean value.', 400));
    }
    updates.is_active = is_active;
  }

  if (code !== undefined) {
    const normalizedCode = code.trim().toLowerCase();
    if (normalizedCode !== pack.code) {
      const codeTaken = await QuestionPack.findOne({
        where: { code: normalizedCode },
        paranoid: false
      });
      if (codeTaken) {
        return next(new AppError(`Code "${normalizedCode}" is already in use by another pack.`, 400));
      }
      updates.code = normalizedCode;
    }
  }

  if (title !== undefined) updates.title = title?.trim();
  if (tier !== undefined) updates.tier = tier?.trim().toLowerCase();
  if (sort_order !== undefined) updates.sort_order = parseInt(sort_order, 10) || 0;

  await pack.update(updates);

  // Re-fetch with coupon association for consistent output
  const updatedPack = await QuestionPack.findByPk(pack.id, {
    include: [
      {
        model: Coupon,
        as: 'default_coupon',
        attributes: [
          'id',
          'code',
          'description',
          'discount_type',
          'discount_value',
          'is_active',
          'expires_at'
        ]
      }
    ]
  });

  res.status(200).json({
    success: true,
    message: 'Question pack updated successfully',
    data: {
      pack: formatQuestionPack(updatedPack || pack)
    }
  });
});

/**
 * DELETE /api/v1/admin/question-packs/:id
 * Soft deletes a question pack using paranoid deleted_at.
 */
export const deleteQuestionPack = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const pack = await QuestionPack.findByPk(id);

  if (!pack) {
    return next(new AppError('Question pack not found with the provided ID.', 404));
  }

  await pack.destroy();

  res.status(200).json({
    success: true,
    message: `Question pack "${pack.name}" (${pack.code}) soft-deleted successfully`,
    data: {
      id: pack.id,
      code: pack.code,
      deleted_at: pack.deleted_at
    }
  });
});
