import express from 'express';
import { requireAuth } from '../auth.js';
import { authenticateAdmin as requireAdminAuth } from '../middleware/adminMiddleware.js';
import {
    submitReview,
    uploadReviewImages,
    getProductReviews,
    getSellerReviews,
    addSellerResponse,
    getModerationQueue,
    updateModerationStatus,
    flagReview,
    getNotificationPreferences,
    updateNotificationPreferences,
    voteReviewHelpfulness,
    getReviewHelpfulness,
    checkOrderReviewStatus
} from '../controllers/reviewController.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * GET /api/node/reviews/product/:product_id
 * Get all approved reviews for a product with pagination
 * Query: page, limit, sort, rating_filter
 */
router.get('/product/:product_id', getProductReviews);

/**
 * GET /api/node/reviews/order/:order_id/status
 * Check if an order has been reviewed (all products)
 */
router.get('/order/:order_id/status', checkOrderReviewStatus);

// ============================================
// ADMIN ROUTES (Admin authentication required) - MUST BE BEFORE GENERIC ROUTES
// ============================================

/**
 * GET /api/node/reviews/admin/moderation
 * Get flagged reviews for moderation
 */
router.get('/admin/moderation', requireAdminAuth, getModerationQueue);

/**
 * PUT /api/node/reviews/admin/moderation/:queue_id
 * Update moderation decision on a flagged review
 */
router.put('/admin/moderation/:queue_id', requireAdminAuth, updateModerationStatus);

// ============================================
// SELLER ROUTES (Authentication required + store_id) - MUST BE BEFORE GENERIC ROUTES
// ============================================

/**
 * GET /api/node/reviews/seller
 * Get all reviews for seller's products
 */
router.get('/seller', requireAuth, getSellerReviews);

/**
 * GET /api/node/reviews/seller/notifications
 * Get seller notification preferences for reviews
 */
router.get('/seller/notifications', requireAuth, getNotificationPreferences);

/**
 * PUT /api/node/reviews/seller/notifications
 * Update seller notification preferences
 */
router.put('/seller/notifications', requireAuth, updateNotificationPreferences);

// ============================================
// BUYER ROUTES (Authentication required)
// ============================================

/**
 * POST /api/node/reviews
 * Submit a new review for an order
 * Requires: order_id (owned by authenticated user), product_id, rating, text
 */
router.post('/', requireAuth, uploadReviewImages, submitReview);

/**
 * POST /api/node/reviews/:review_id/flag
 * Flag a review for moderation
 */
router.post('/:review_id/flag', requireAuth, flagReview);

/**
 * POST /api/node/reviews/:review_id/helpfulness
 * Vote on review helpfulness
 * Body: { helpful: true/false }
 */
router.post('/:review_id/helpfulness', requireAuth, voteReviewHelpfulness);

/**
 * GET /api/node/reviews/:review_id/helpfulness
 * Get helpfulness stats for a review (optional auth to include user's vote)
 */
router.get('/:review_id/helpfulness', (req, res, next) => {
    // Try to extract token but don't fail if missing
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        // User middleware here to set req.user if token is valid
        // For now, we'll handle it in the controller
    }
    next();
}, getReviewHelpfulness);

/**
 * POST /api/node/reviews/:review_id/response
 * Add or update seller response to a review
 */
router.post('/:review_id/response', requireAuth, addSellerResponse);

export default router;
