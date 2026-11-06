import { Op } from 'sequelize';
import { Coupon } from '../models/index.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * GET /api/v1/admin/coupons
 * Lists all coupons with usage metrics and filter options.
 */
export const getCoupons = asyncHandler(async (req, res) => {
  const { search, is_active, is_hidden, is_special_offer, special_offer } = req.query;

  const whereClause = {};

  if (search) {
    whereClause.code = {
      [Op.like]: `%${search.trim().toUpperCase()}%`
    };
  }

  if (is_active !== undefined) {
    whereClause.is_active = is_active === 'true' || is_active === true;
  }

  if (is_hidden !== undefined) {
    whereClause.is_hidden = is_hidden === 'true' || is_hidden === true;
  }

  const specialOfferParam = is_special_offer !== undefined ? is_special_offer : special_offer;
  if (specialOfferParam !== undefined) {
    whereClause.is_special_offer = specialOfferParam === 'true' || specialOfferParam === true;
  }

  const coupons = await Coupon.findAll({
    where: whereClause,
    attributes: [
      'id',
      'code',
      'description',
      'discount_type',
      'discount_value',
      'applicable_products',
      'is_active',
      'is_hidden',
      'is_special_offer',
      'expires_at',
      'max_uses',
      'used_count',
      'created_at',
      'updated_at'
    ],
    order: [['created_at', 'DESC']]
  });

  const formattedCoupons = coupons.map((c) => {
    const raw = typeof c.toJSON === 'function' ? c.toJSON() : c;
    return {
      ...raw,
      share_url: `https://japaika.com/pricing?coupon=${encodeURIComponent(raw.code)}`
    };
  });

  res.status(200).json({
    success: true,
    message: 'Coupons list retrieved',
    data: {
      coupons: formattedCoupons
    }
  });
});

/**
 * POST /api/v1/admin/coupons
 * Creates a new discount coupon code.
 */
export const createCoupon = asyncHandler(async (req, res, next) => {
  const {
    code,
    description,
    discount_type,
    discount_value,
    applicable_products,
    expires_at,
    max_uses,
    is_hidden,
    is_special_offer,
    special_offer
  } = req.body;

  if (!code || typeof code !== 'string' || !code.trim()) {
    return next(new AppError('A valid coupon code is required.', 400));
  }

  const normalizedCode = code.trim().toUpperCase();

  // Check code uniqueness (including soft-deleted records due to unique DB index)
  const existingCoupon = await Coupon.findOne({
    where: { code: normalizedCode },
    paranoid: false
  });
  if (existingCoupon) {
    return next(new AppError(`Coupon code "${normalizedCode}" already exists.`, 400));
  }

  const validTypes = ['percentage', 'flat'];
  if (!discount_type || !validTypes.includes(discount_type)) {
    return next(
      new AppError(`discount_type must be one of: ${validTypes.join(', ')}`, 400)
    );
  }

  const parsedValue = parseFloat(discount_value);
  if (isNaN(parsedValue) || parsedValue < 0) {
    return next(new AppError('discount_value must be a non-negative number.', 400));
  }

  if (discount_type === 'percentage' && parsedValue > 100) {
    return next(new AppError('Percentage discount cannot exceed 100%.', 400));
  }

  let parsedMaxUses = null;
  if (max_uses !== undefined && max_uses !== null && max_uses !== '') {
    parsedMaxUses = parseInt(max_uses, 10);
    if (isNaN(parsedMaxUses) || parsedMaxUses <= 0) {
      return next(new AppError('max_uses must be a positive integer.', 400));
    }
  }

  let parsedExpiresAt = null;
  if (expires_at) {
    const expiryDate = new Date(expires_at);
    if (isNaN(expiryDate.getTime())) {
      return next(new AppError('Invalid date format for expires_at.', 400));
    }
    parsedExpiresAt = expiryDate;
  }

  const newCoupon = await Coupon.create({
    code: normalizedCode,
    description: description?.trim() || `${normalizedCode} discount code`,
    discount_type,
    discount_value: parsedValue,
    applicable_products: Array.isArray(applicable_products) ? applicable_products : [],
    expires_at: parsedExpiresAt,
    max_uses: parsedMaxUses,
    is_active: true,
    is_hidden: typeof is_hidden === 'boolean' ? is_hidden : false,
    is_special_offer: typeof is_special_offer === 'boolean'
      ? is_special_offer
      : (typeof special_offer === 'boolean' ? special_offer : false)
  });

  res.status(201).json({
    success: true,
    message: 'Coupon created successfully',
    data: {
      coupon: {
        ...(typeof newCoupon.toJSON === 'function' ? newCoupon.toJSON() : newCoupon),
        share_url: `https://japaika.com/pricing?coupon=${encodeURIComponent(newCoupon.code)}`
      }
    }
  });
});

/**
 * PATCH /api/v1/admin/coupons/:id/status
 * Enables or disables a coupon code.
 */
export const updateCouponStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { is_active } = req.body;

  const coupon = await Coupon.findByPk(id);

  if (!coupon) {
    return next(new AppError('Coupon not found with the provided ID.', 404));
  }

  const newStatus = typeof is_active === 'boolean' ? is_active : !coupon.is_active;

  await coupon.update({ is_active: newStatus });

  res.status(200).json({
    success: true,
    message: `Coupon "${coupon.code}" ${newStatus ? 'enabled' : 'disabled'} successfully`,
    data: {
      id: coupon.id,
      code: coupon.code,
      is_active: coupon.is_active,
      share_url: `https://japaika.com/pricing?coupon=${encodeURIComponent(coupon.code)}`
    }
  });
});

/**
 * PATCH /api/v1/admin/coupons/:id/visibility
 * Toggles or sets a coupon's hidden/secret visibility.
 */
export const updateCouponVisibility = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { is_hidden } = req.body;

  const coupon = await Coupon.findByPk(id);

  if (!coupon) {
    return next(new AppError('Coupon not found with the provided ID.', 404));
  }

  const newHidden = typeof is_hidden === 'boolean' ? is_hidden : !coupon.is_hidden;

  await coupon.update({ is_hidden: newHidden });

  res.status(200).json({
    success: true,
    message: `Coupon "${coupon.code}" marked as ${newHidden ? 'secret/hidden' : 'public'} successfully`,
    data: {
      id: coupon.id,
      code: coupon.code,
      is_hidden: coupon.is_hidden,
      share_url: `https://japaika.com/pricing?coupon=${encodeURIComponent(coupon.code)}`
    }
  });
});

/**
 * PATCH /api/v1/admin/coupons/:id/special-offer
 * Toggles or sets a coupon's special promotional offer status.
 */
export const updateCouponSpecialOffer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { is_special_offer, special_offer } = req.body;

  const coupon = await Coupon.findByPk(id);

  if (!coupon) {
    return next(new AppError('Coupon not found with the provided ID.', 404));
  }

  const targetVal = is_special_offer !== undefined ? is_special_offer : special_offer;
  const newSpecialOffer = typeof targetVal === 'boolean' ? targetVal : !coupon.is_special_offer;

  await coupon.update({ is_special_offer: newSpecialOffer });

  res.status(200).json({
    success: true,
    message: `Coupon "${coupon.code}" ${newSpecialOffer ? 'marked as special promotional offer' : 'removed from special promotional offers'} successfully`,
    data: {
      id: coupon.id,
      code: coupon.code,
      is_special_offer: coupon.is_special_offer,
      share_url: `https://japaika.com/pricing?coupon=${encodeURIComponent(coupon.code)}`
    }
  });
});

/**
 * GET /api/v1/admin/coupons/special-offer
 * Retrieves the currently active special promotional offer for AI chat upsell cards and marketing campaigns.
 */
export const getActiveSpecialOffer = asyncHandler(async (req, res) => {
  const now = new Date();

  const coupon = await Coupon.findOne({
    where: {
      is_special_offer: true,
      is_active: true,
      [Op.or]: [
        { expires_at: null },
        { expires_at: { [Op.gt]: now } }
      ]
    },
    order: [['updated_at', 'DESC']]
  });

  if (!coupon) {
    return res.status(200).json({
      success: true,
      message: 'No active special promotional offer currently configured',
      data: {
        special_offer: null
      }
    });
  }

  const raw = typeof coupon.toJSON === 'function' ? coupon.toJSON() : coupon;

  res.status(200).json({
    success: true,
    message: 'Active special promotional offer retrieved successfully',
    data: {
      special_offer: {
        id: raw.id,
        code: raw.code,
        title: 'Special Promotional Offer',
        description: raw.description,
        discount_type: raw.discount_type,
        discount_value: Number(raw.discount_value),
        applicable_products: raw.applicable_products,
        is_active: raw.is_active,
        is_special_offer: raw.is_special_offer,
        expires_at: raw.expires_at,
        share_url: `https://japaika.com/pricing?coupon=${encodeURIComponent(raw.code)}`
      }
    }
  });
});

/**
 * PATCH / PUT /api/v1/admin/coupons/:id
 * Updates an existing coupon's details (code, description, discount, limits, expiry, status).
 */
export const updateCoupon = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const {
    code,
    description,
    discount_type,
    discount_value,
    applicable_products,
    expires_at,
    max_uses,
    is_active,
    is_hidden,
    is_special_offer,
    special_offer
  } = req.body;

  const coupon = await Coupon.findByPk(id);

  if (!coupon) {
    return next(new AppError('Coupon not found with the provided ID.', 404));
  }

  const updates = {};

  if (code !== undefined) {
    if (typeof code !== 'string' || !code.trim()) {
      return next(new AppError('Coupon code cannot be empty.', 400));
    }
    const normalizedCode = code.trim().toUpperCase();
    if (normalizedCode !== coupon.code) {
      const existingCoupon = await Coupon.findOne({
        where: { code: normalizedCode },
        paranoid: false
      });
      if (existingCoupon) {
        return next(new AppError(`Coupon code "${normalizedCode}" already exists.`, 400));
      }
      updates.code = normalizedCode;
    }
  }

  if (description !== undefined) {
    if (typeof description !== 'string' || !description.trim()) {
      return next(new AppError('Description cannot be empty.', 400));
    }
    updates.description = description.trim();
  }

  const validTypes = ['percentage', 'flat'];
  const effectiveType = discount_type !== undefined ? discount_type : coupon.discount_type;

  if (discount_type !== undefined) {
    if (!validTypes.includes(discount_type)) {
      return next(
        new AppError(`discount_type must be one of: ${validTypes.join(', ')}`, 400)
      );
    }
    updates.discount_type = discount_type;
  }

  if (discount_value !== undefined) {
    const parsedValue = parseFloat(discount_value);
    if (isNaN(parsedValue) || parsedValue < 0) {
      return next(new AppError('discount_value must be a non-negative number.', 400));
    }
    if (effectiveType === 'percentage' && parsedValue > 100) {
      return next(new AppError('Percentage discount cannot exceed 100%.', 400));
    }
    updates.discount_value = parsedValue;
  } else if (
    discount_type === 'percentage' &&
    parseFloat(coupon.discount_value) > 100
  ) {
    return next(new AppError('Percentage discount cannot exceed 100%.', 400));
  }

  if (applicable_products !== undefined) {
    if (!Array.isArray(applicable_products)) {
      return next(new AppError('applicable_products must be an array.', 400));
    }
    updates.applicable_products = applicable_products;
  }

  if (max_uses !== undefined) {
    if (max_uses === null || max_uses === '') {
      updates.max_uses = null;
    } else {
      const parsedMaxUses = parseInt(max_uses, 10);
      if (isNaN(parsedMaxUses) || parsedMaxUses <= 0) {
        return next(new AppError('max_uses must be a positive integer.', 400));
      }
      updates.max_uses = parsedMaxUses;
    }
  }

  if (expires_at !== undefined) {
    if (expires_at === null || expires_at === '') {
      updates.expires_at = null;
    } else {
      const expiryDate = new Date(expires_at);
      if (isNaN(expiryDate.getTime())) {
        return next(new AppError('Invalid date format for expires_at.', 400));
      }
      updates.expires_at = expiryDate;
    }
  }

  if (is_active !== undefined) {
    if (typeof is_active !== 'boolean') {
      return next(new AppError('is_active must be a boolean value.', 400));
    }
    updates.is_active = is_active;
  }

  if (is_hidden !== undefined) {
    if (typeof is_hidden !== 'boolean') {
      return next(new AppError('is_hidden must be a boolean value.', 400));
    }
    updates.is_hidden = is_hidden;
  }

  const specialOfferVal = is_special_offer !== undefined ? is_special_offer : special_offer;
  if (specialOfferVal !== undefined) {
    if (typeof specialOfferVal !== 'boolean') {
      return next(new AppError('is_special_offer must be a boolean value.', 400));
    }
    updates.is_special_offer = specialOfferVal;
  }

  await coupon.update(updates);

  res.status(200).json({
    success: true,
    message: 'Coupon updated successfully',
    data: {
      coupon: {
        ...(typeof coupon.toJSON === 'function' ? coupon.toJSON() : coupon),
        share_url: `https://japaika.com/pricing?coupon=${encodeURIComponent(coupon.code)}`
      }
    }
  });
});

/**
 * DELETE /api/v1/admin/coupons/:id
 * Soft-deletes a coupon code using paranoid deleted_at.
 */
export const deleteCoupon = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findByPk(id);

  if (!coupon) {
    return next(new AppError('Coupon not found with the provided ID.', 404));
  }

  await coupon.destroy();

  res.status(200).json({
    success: true,
    message: `Coupon "${coupon.code}" deleted successfully`,
    data: {
      id: coupon.id,
      code: coupon.code,
      deleted_at: coupon.deleted_at
    }
  });
});
