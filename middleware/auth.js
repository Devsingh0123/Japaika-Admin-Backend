import { verifyAccessToken } from '../utils/jwt.js';
import { Admin } from '../models/index.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Middleware: verifyToken
 * Validates Bearer access token from Authorization header and attaches the authenticated Admin record.
 */
export const verifyToken = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please provide a valid Bearer token.', 401));
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Your access token has expired. Please log in or refresh your token.', 401));
    }
    return next(new AppError('Invalid token. Authorization denied.', 401));
  }

  const currentAdmin = await Admin.findByPk(decoded.id);
  if (!currentAdmin) {
    return next(new AppError('The administrator belonging to this token no longer exists.', 401));
  }

  if (currentAdmin.is_blocked) {
    return next(new AppError('Your administrator account has been suspended. Please contact support.', 403));
  }

  req.user = currentAdmin;
  req.admin = currentAdmin;
  next();
});

/**
 * Middleware: adminOnly
 * Ensures the authenticated account has role === 'admin' or 'super_admin'.
 */
export const adminOnly = (req, res, next) => {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

/**
 * Middleware: superAdminOnly
 * Ensures the authenticated account has role === 'super_admin'.
 */
export const superAdminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super Administrator privileges required.'
    });
  }
  next();
};

/**
 * Complete list of granular permissions supported for 'admin' accounts.
 * 'super_admin' automatically bypasses all permission checks.
 */
export const ALL_PERMISSIONS = [
  'dashboard:read',
  'users:read',
  'users:write',
  'orders:read',
  'orders:write',
  'coupons:read',
  'coupons:write',
  'question_packs:read',
  'question_packs:write',
  'report_packs:read',
  'report_packs:write',
  'blogs:read',
  'blogs:write',
  'chats:read',
  'faqs:read',
  'faqs:write',
  'doshas:read',
  'doshas:write',
  'legal_pages:read',
  'legal_pages:write',
  'admins:read'
];

/**
 * Middleware: requirePermission(...requiredPermissions)
 * - 'super_admin' always passes.
 * - 'admin' passes if their permissions array includes any of requiredPermissions
 *   (or the corresponding ':write' permission when ':read' is checked).
 */
export const requirePermission = (...requiredPermissions) => (req, res, next) => {
  if (req.user.role === 'super_admin') return next();

  const userPermissions = req.user.permissions;
  const hasAccess = requiredPermissions.some(
    (perm) =>
      userPermissions.includes(perm) ||
      (perm.endsWith(':read') && userPermissions.includes(perm.replace(':read', ':write')))
  );

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required permission: ${requiredPermissions.join(' or ')}`
    });
  }

  next();
};

/**
 * Middleware: adminAuth
 * Combined middleware pipeline: verifies token, ensures admin is active & has admin role.
 */
export const adminAuth = [verifyToken, adminOnly];
