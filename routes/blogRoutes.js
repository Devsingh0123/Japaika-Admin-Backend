import express from 'express';
import {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  updateBlogStatus,
  deleteBlog
} from '../controllers/blogController.js';
import { adminAuth, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply adminAuth to all blog routes
router.use(adminAuth);

// GET /api/v1/admin/blogs
router.get('/', requirePermission('blogs:read'), getBlogs);

// GET /api/v1/admin/blogs/:id
router.get('/:id', requirePermission('blogs:read'), getBlogById);

// POST /api/v1/admin/blogs
router.post('/', requirePermission('blogs:write'), createBlog);

// PUT /api/v1/admin/blogs/:id
router.put('/:id', requirePermission('blogs:write'), updateBlog);

// PATCH /api/v1/admin/blogs/:id
router.patch('/:id', requirePermission('blogs:write'), updateBlog);

// PATCH /api/v1/admin/blogs/:id/status
router.patch('/:id/status', requirePermission('blogs:write'), updateBlogStatus);

// DELETE /api/v1/admin/blogs/:id
router.delete('/:id', requirePermission('blogs:write'), deleteBlog);

export default router;
