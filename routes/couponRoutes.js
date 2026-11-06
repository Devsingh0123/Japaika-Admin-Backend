import express from 'express';
import {
  getCoupons,
  getActiveSpecialOffer,
  createCoupon,
  updateCoupon,
  updateCouponStatus,
  updateCouponVisibility,
  updateCouponSpecialOffer,
  deleteCoupon
} from '../controllers/couponController.js';
import { adminAuth, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply adminAuth to all coupon routes
router.use(adminAuth);

// GET /api/v1/admin/coupons/special-offer (fetch active special promotional offer)
router.get('/special-offer', requirePermission('coupons:read'), getActiveSpecialOffer);

// GET /api/v1/admin/coupons
router.get('/', requirePermission('coupons:read'), getCoupons);

// POST /api/v1/admin/coupons
router.post('/', requirePermission('coupons:write'), createCoupon);

// PATCH /api/v1/admin/coupons/:id/status (toggle active/inactive)
router.patch('/:id/status', requirePermission('coupons:write'), updateCouponStatus);

// PATCH /api/v1/admin/coupons/:id/visibility (toggle secret/hidden vs public)
router.patch('/:id/visibility', requirePermission('coupons:write'), updateCouponVisibility);

// PATCH /api/v1/admin/coupons/:id/special-offer (toggle special promotional offer status)
router.patch('/:id/special-offer', requirePermission('coupons:write'), updateCouponSpecialOffer);

// PATCH & PUT /api/v1/admin/coupons/:id
router.patch('/:id', requirePermission('coupons:write'), updateCoupon);
router.put('/:id', requirePermission('coupons:write'), updateCoupon);

// DELETE /api/v1/admin/coupons/:id
router.delete('/:id', requirePermission('coupons:write'), deleteCoupon);

export default router;
