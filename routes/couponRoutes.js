import express from 'express';
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  updateCouponStatus,
  deleteCoupon
} from '../controllers/couponController.js';
import { adminAuth, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply adminAuth to all coupon routes
router.use(adminAuth);

// GET /api/v1/admin/coupons
router.get('/', requirePermission('coupons:read'), getCoupons);

// POST /api/v1/admin/coupons
router.post('/', requirePermission('coupons:write'), createCoupon);

// PATCH & PUT /api/v1/admin/coupons/:id
router.patch('/:id', requirePermission('coupons:write'), updateCoupon);
router.put('/:id', requirePermission('coupons:write'), updateCoupon);

// PATCH /api/v1/admin/coupons/:id/status
router.patch('/:id/status', requirePermission('coupons:write'), updateCouponStatus);

// DELETE /api/v1/admin/coupons/:id
router.delete('/:id', requirePermission('coupons:write'), deleteCoupon);

export default router;
