import express from 'express';
import {
  getOrders,
  getOrderById,
  getOrderInvoice,
  refundOrder,
  exportOrders
} from '../controllers/orderController.js';
import { adminAuth, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply adminAuth to all order routes
router.use(adminAuth);

// GET /api/v1/admin/orders
router.get('/', requirePermission('orders:read'), getOrders);

// GET /api/v1/admin/orders/export (Must be before /:id)
router.get('/export', requirePermission('orders:read'), exportOrders);

// GET /api/v1/admin/orders/:id
router.get('/:id', requirePermission('orders:read'), getOrderById);

// GET /api/v1/admin/orders/:id/invoice
router.get('/:id/invoice', requirePermission('orders:read'), getOrderInvoice);

// POST /api/v1/admin/orders/:id/refund
router.post('/:id/refund', requirePermission('orders:write'), refundOrder);

export default router;
