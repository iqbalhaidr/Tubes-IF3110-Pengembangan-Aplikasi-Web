/**
 * Admin Routes - API Endpoints for Admin Operations
 * 
 * Provides RESTful endpoints for:
 * - Admin authentication (login)
 * - User management
 * - Feature flag management (user-specific and global)
 * 
 * Base path: /api/node/admin
 * 
 * @module routes/adminRoutes
 */

import express from 'express';
import { authenticateAdmin } from '../middleware/adminMiddleware.js';
import {
    login,
    getMe,
    getUsers,
    getUserFlags,
    updateUserFlags,
    getGlobalFlags,
    updateGlobalFlags,
    checkFeatureAccess
} from '../controllers/adminController.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * POST /api/node/admin/login
 * Admin login - returns JWT token
 * 
 * Body: { email: string, password: string }
 * Returns: { success: true, data: { token, admin, expiresIn } }
 */
router.post('/login', login);

/**
 * GET /api/node/admin/features/check
 * Check feature access for frontend/PHP
 * 
 * Query: userId (optional) - User ID to check user-specific flags
 * Returns: { success: true, data: { features: {...} } }
 */
router.get('/features/check', checkFeatureAccess);

// ============================================
// PROTECTED ROUTES (Requires admin JWT)
// ============================================

// Apply authentication middleware to all routes below
router.use(authenticateAdmin);

/**
 * GET /api/node/admin/me
 * Get current admin info
 * 
 * Headers: Authorization: Bearer <token>
 * Returns: { success: true, data: { id, email, name, role } }
 */
router.get('/me', getMe);

// ============================================
// USER MANAGEMENT ROUTES
// ============================================

/**
 * GET /api/node/admin/users
 * Get paginated list of all users
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - search: Search term for name/email
 * - role: Filter by role (BUYER/SELLER)
 * 
 * Returns: { success: true, data: { users: [...], pagination: {...} } }
 */
router.get('/users', getUsers);

/**
 * GET /api/node/admin/users/:id/flags
 * Get feature flags for a specific user
 * 
 * Params: id - User ID
 * Returns: { success: true, data: { user: {...}, flags: {...} } }
 */
router.get('/users/:id/flags', getUserFlags);

/**
 * PUT /api/node/admin/users/:id/flags
 * Update feature flags for a specific user
 * 
 * Params: id - User ID
 * Body: { flags: { feature_name: { enabled: boolean, reason?: string } } }
 * Returns: { success: true, message: string, data: { updates: [...] } }
 */
router.put('/users/:id/flags', updateUserFlags);

// ============================================
// GLOBAL FEATURE FLAGS ROUTES
// ============================================

/**
 * GET /api/node/admin/global-flags
 * Get all global feature flags
 * 
 * Returns: { success: true, data: { flags: {...} } }
 */
router.get('/global-flags', getGlobalFlags);

/**
 * PUT /api/node/admin/global-flags
 * Update global feature flags
 * 
 * Body: { flags: { feature_name: { enabled: boolean, reason?: string } } }
 * Returns: { success: true, message: string, data: { updates: [...] } }
 */
router.put('/global-flags', updateGlobalFlags);

export default router;
