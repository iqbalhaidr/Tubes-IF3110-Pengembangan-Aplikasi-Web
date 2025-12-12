import pool from '../db.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Setup file upload directory
const uploadDir = '/app/uploads/reviews';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for review images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `review_${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed'));
    }
});

export const uploadReviewImages = upload.array('images', 3);

/**
 * Submit a new review for an order
 * POST /api/node/reviews
 * Body: { order_id, product_id, rating, text }
 * Files: images (max 3)
 */
export const submitReview = async (req, res) => {
    const client = await pool.connect();
    try {
        // Try to get userId from middleware auth first, then fall back to request body
        let userId = req.user?.user_id || req.body?.user_id;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const { order_id, product_id, rating, text } = req.body;

        // Validate inputs
        if (!order_id || !product_id || !rating || !text) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        if (text.length > 500) {
            return res.status(400).json({ error: 'Review text cannot exceed 500 characters' });
        }

        if (req.files && req.files.length > 3) {
            return res.status(400).json({ error: 'Maximum 3 images allowed' });
        }

        // Verify order ownership and status
        const orderResult = await client.query(
            `SELECT o.order_id, o.buyer_id, o.store_id, o.status
             FROM "order" o
             WHERE o.order_id = $1 AND o.buyer_id = $2`,
            [order_id, userId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(403).json({ error: 'Order not found or you do not own this order' });
        }

        const order = orderResult.rows[0];

        if (order.status !== 'RECEIVED') {
            return res.status(400).json({ error: 'Order must be RECEIVED to write a review' });
        }

        // Check if review already exists for this specific product in this order
        const existingReview = await client.query(
            `SELECT review_id FROM reviews WHERE order_id = $1 AND product_id = $2`,
            [order_id, product_id]
        );

        if (existingReview.rows.length > 0) {
            return res.status(400).json({ error: 'Review already exists for this product in this order' });
        }

        // Verify product belongs to the order
        const productInOrder = await client.query(
            `SELECT oi.order_item_id FROM order_item oi
             WHERE oi.order_id = $1 AND oi.product_id = $2`,
            [order_id, product_id]
        );

        if (productInOrder.rows.length === 0) {
            return res.status(400).json({ error: 'Product not found in this order' });
        }

        // Start transaction
        await client.query('BEGIN');

        // Create review (auto-approved)
        const reviewResult = await client.query(
            `INSERT INTO reviews (order_id, buyer_id, store_id, product_id, rating, text, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'APPROVED')
             RETURNING review_id`,
            [order_id, userId, order.store_id, product_id, rating, text]
        );

        const reviewId = reviewResult.rows[0].review_id;

        // Upload images if provided
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                await client.query(
                    `INSERT INTO review_images (review_id, image_path)
                     VALUES ($1, $2)`,
                    [reviewId, `/uploads/reviews/${file.filename}`]
                );
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            review_id: reviewId,
            message: 'Review submitted successfully'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error submitting review:', error);
        res.status(500).json({ error: 'Failed to submit review' });
    } finally {
        client.release();
    }
};

/**
 * Get reviews for a product with pagination, filtering, and helpfulness voting
 * GET /api/node/reviews/product/:product_id?page=1&limit=10&sort=recent&rating_filter=all
 * Query params:
 *   - page: Page number (default 1)
 *   - limit: Reviews per page (default 10)
 *   - sort: recent | rating_high | rating_low | helpful (default recent)
 *   - rating_filter: all | 1 | 2 | 3 | 4 | 5 (default all)
 */
export const getProductReviews = async (req, res) => {
    try {
        const { product_id } = req.params;
        const { page = 1, limit = 10, sort = 'recent', rating_filter = 'all' } = req.query;
        const offset = (page - 1) * limit;

        let orderClause = 'r.created_at DESC';
        if (sort === 'rating_high') orderClause = 'r.rating DESC, r.created_at DESC';
        if (sort === 'rating_low') orderClause = 'r.rating ASC, r.created_at DESC';
        if (sort === 'helpful') orderClause = '(COALESCE(helpful_count, 0) - COALESCE(not_helpful_count, 0)) DESC, r.created_at DESC';

        let ratingFilter = '';
        if (rating_filter !== 'all') {
            const rating = parseInt(rating_filter);
            if (rating >= 1 && rating <= 5) {
                ratingFilter = `AND r.rating = ${rating}`;
            }
        }

        // Get reviews with helpfulness stats and verified purchase info
        const reviewsResult = await pool.query(
            `SELECT 
                r.review_id,
                r.order_id,
                r.buyer_id,
                u.name as buyer_name,
                r.rating,
                r.text,
                r.created_at,
                sr.response_id,
                sr.response_text,
                sr.created_at as response_created_at,
                COALESCE(SUM(CASE WHEN rhv.helpful = true THEN 1 ELSE 0 END), 0) as helpful_count,
                COALESCE(SUM(CASE WHEN rhv.helpful = false THEN 1 ELSE 0 END), 0) as not_helpful_count,
                CASE WHEN oi.order_item_id IS NOT NULL THEN true ELSE false END as is_verified_purchase,
                json_agg(json_build_object('image_id', ri.image_id, 'image_path', ri.image_path))
                    FILTER (WHERE ri.image_id IS NOT NULL) as images
             FROM reviews r
             LEFT JOIN "user" u ON r.buyer_id = u.user_id
             LEFT JOIN seller_responses sr ON r.review_id = sr.review_id
             LEFT JOIN review_images ri ON r.review_id = ri.review_id
             LEFT JOIN review_helpfulness_votes rhv ON r.review_id = rhv.review_id
             LEFT JOIN order_item oi ON r.order_id = oi.order_id AND r.product_id = oi.product_id
             WHERE r.product_id = $1 AND r.status = 'APPROVED' ${ratingFilter}
             GROUP BY r.review_id, r.order_id, r.buyer_id, u.name, r.rating, r.text, r.created_at,
                      sr.response_id, sr.response_text, sr.created_at, oi.order_item_id
             ORDER BY ${orderClause}
             LIMIT $2 OFFSET $3`,
            [product_id, limit, offset]
        );

        // Get total count with rating filter
        const countResult = await pool.query(
            `SELECT COUNT(*) as total FROM reviews WHERE product_id = $1 AND status = 'APPROVED' ${ratingFilter}`,
            [product_id]
        );

        // Get rating stats
        const statsResult = await pool.query(
            `SELECT 
                COALESCE(AVG(rating), 0)::decimal(3,2) as average_rating,
                COUNT(*) as total_reviews,
                COALESCE(SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END), 0) as stars_5,
                COALESCE(SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END), 0) as stars_4,
                COALESCE(SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END), 0) as stars_3,
                COALESCE(SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END), 0) as stars_2,
                COALESCE(SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END), 0) as stars_1
             FROM reviews WHERE product_id = $1 AND status = 'APPROVED'`,
            [product_id]
        );

        const total = parseInt(countResult.rows[0].total);
        const stats = statsResult.rows[0];

        res.json({
            success: true,
            reviews: reviewsResult.rows,
            page: parseInt(page),
            total_pages: Math.ceil(total / limit),
            total: total,
            limit: parseInt(limit),
            pagination: {
                current_page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                total_pages: Math.ceil(total / limit)
            },
            stats: {
                average_rating: stats.average_rating,
                total_reviews: stats.total_reviews,
                distribution: {
                    5: stats.stars_5,
                    4: stats.stars_4,
                    3: stats.stars_3,
                    2: stats.stars_2,
                    1: stats.stars_1
                }
            }
        });
    } catch (error) {
        console.error('Error fetching product reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};

/**
 * Get rating statistics for a product
 * GET /api/node/reviews/product/:product_id/stats
 */
export const getProductRatingStats = async (req, res) => {
    try {
        const { product_id } = req.params;

        // Get rating statistics
        const statsResult = await pool.query(
            `SELECT 
                COUNT(*) as total_reviews,
                COALESCE(AVG(rating), 0) as average_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as stars_5,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as stars_4,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as stars_3,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as stars_2,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as stars_1
             FROM reviews 
             WHERE product_id = $1 AND status = 'APPROVED'`,
            [product_id]
        );

        const stats = statsResult.rows[0] || {
            total_reviews: 0,
            average_rating: 0,
            stars_5: 0,
            stars_4: 0,
            stars_3: 0,
            stars_2: 0,
            stars_1: 0
        };

        res.json({
            success: true,
            product_id,
            average_rating: parseFloat(stats.average_rating) || 0,
            total_reviews: parseInt(stats.total_reviews) || 0,
            distribution: {
                5: parseInt(stats.stars_5) || 0,
                4: parseInt(stats.stars_4) || 0,
                3: parseInt(stats.stars_3) || 0,
                2: parseInt(stats.stars_2) || 0,
                1: parseInt(stats.stars_1) || 0
            }
        });
    } catch (error) {
        console.error('Error fetching rating stats:', error);
        res.status(500).json({ error: 'Failed to fetch rating stats' });
    }
};

/**
 * Get reviews for a seller's products
 * GET /api/node/reviews/seller?page=1&limit=10
 */
export const getSellerReviews = async (req, res) => {
    try {
        const storeId = req.user.store_id;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        if (!storeId) {
            return res.status(403).json({ error: 'Only sellers can access this endpoint' });
        }

        const reviewsResult = await pool.query(
            `SELECT 
                r.review_id,
                r.order_id,
                r.product_id,
                p.product_name,
                r.buyer_id,
                u.name as buyer_name,
                r.rating,
                r.text,
                r.created_at,
                sr.response_id,
                sr.response_text,
                sr.created_at as response_created_at,
                json_agg(json_build_object('image_id', ri.image_id, 'image_path', ri.image_path))
                    FILTER (WHERE ri.image_id IS NOT NULL) as images
             FROM reviews r
             LEFT JOIN "user" u ON r.buyer_id = u.user_id
             LEFT JOIN product p ON r.product_id = p.product_id
             LEFT JOIN seller_responses sr ON r.review_id = sr.review_id
             LEFT JOIN review_images ri ON r.review_id = ri.review_id
             WHERE r.store_id = $1
             GROUP BY r.review_id, r.order_id, r.product_id, p.product_name, r.buyer_id, u.name,
                      r.rating, r.text, r.created_at, sr.response_id, sr.response_text, sr.created_at
             ORDER BY r.created_at DESC
             LIMIT $2 OFFSET $3`,
            [storeId, limit, offset]
        );

        const countResult = await pool.query(
            `SELECT COUNT(*) as total FROM reviews WHERE store_id = $1`,
            [storeId]
        );

        const total = parseInt(countResult.rows[0].total);

        res.json({
            reviews: reviewsResult.rows,
            pagination: {
                current_page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                total_pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching seller reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};

/**
 * Add or update seller response to a review
 * POST /api/node/reviews/:review_id/response
 * Body: { response_text }
 */
export const addSellerResponse = async (req, res) => {
    const client = await pool.connect();
    try {
        const storeId = req.user.store_id;
        const { review_id } = req.params;
        const { response_text } = req.body;

        if (!storeId) {
            return res.status(403).json({ error: 'Only sellers can add responses' });
        }

        if (!response_text || response_text.length === 0) {
            return res.status(400).json({ error: 'Response text is required' });
        }

        if (response_text.length > 500) {
            return res.status(400).json({ error: 'Response cannot exceed 500 characters' });
        }

        // Verify review belongs to seller's store
        const reviewResult = await client.query(
            `SELECT r.review_id, r.store_id FROM reviews r WHERE r.review_id = $1 AND r.store_id = $2`,
            [review_id, storeId]
        );

        if (reviewResult.rows.length === 0) {
            return res.status(403).json({ error: 'Review not found or does not belong to your store' });
        }

        // Check if response already exists
        const existingResponse = await client.query(
            `SELECT response_id FROM seller_responses WHERE review_id = $1`,
            [review_id]
        );

        await client.query('BEGIN');

        let responseId;
        if (existingResponse.rows.length > 0) {
            // Update existing response
            const updateResult = await client.query(
                `UPDATE seller_responses 
                 SET response_text = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE review_id = $2
                 RETURNING response_id`,
                [response_text, review_id]
            );
            responseId = updateResult.rows[0].response_id;
        } else {
            // Create new response
            const insertResult = await client.query(
                `INSERT INTO seller_responses (review_id, store_id, response_text)
                 VALUES ($1, $2, $3)
                 RETURNING response_id`,
                [review_id, storeId, response_text]
            );
            responseId = insertResult.rows[0].response_id;
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            response_id: responseId,
            message: 'Response saved successfully'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding seller response:', error);
        res.status(500).json({ error: 'Failed to add response' });
    } finally {
        client.release();
    }
};

/**
 * Get flagged reviews for admin moderation
 * GET /api/node/reviews/admin/moderation?page=1&limit=10&status=PENDING
 */
export const getModerationQueue = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'PENDING' } = req.query;
        const offset = (page - 1) * limit;

        const reviewsResult = await pool.query(
            `SELECT 
                rmq.queue_id,
                rmq.review_id,
                rmq.flagged_reason,
                rmq.admin_notes,
                rmq.status,
                rmq.flagged_by,
                rmq.created_at,
                r.rating,
                r.text,
                r.buyer_id,
                u.name as buyer_name,
                r.product_id,
                p.product_name,
                r.store_id,
                s.store_name,
                json_agg(json_build_object('image_id', ri.image_id, 'image_path', ri.image_path))
                    FILTER (WHERE ri.image_id IS NOT NULL) as images
             FROM review_moderation_queue rmq
             JOIN reviews r ON rmq.review_id = r.review_id
             LEFT JOIN "user" u ON r.buyer_id = u.user_id
             LEFT JOIN product p ON r.product_id = p.product_id
             LEFT JOIN store s ON r.store_id = s.store_id
             LEFT JOIN review_images ri ON r.review_id = ri.review_id
             WHERE rmq.status = $1
             GROUP BY rmq.queue_id, rmq.review_id, rmq.flagged_reason, rmq.admin_notes, rmq.status,
                      rmq.flagged_by, rmq.created_at, r.rating, r.text, r.buyer_id, u.name,
                      r.product_id, p.product_name, r.store_id, s.store_name
             ORDER BY rmq.created_at DESC
             LIMIT $2 OFFSET $3`,
            [status, limit, offset]
        );

        const countResult = await pool.query(
            `SELECT COUNT(*) as total FROM review_moderation_queue WHERE status = $1`,
            [status]
        );

        const total = parseInt(countResult.rows[0].total);

        res.json({
            reviews: reviewsResult.rows,
            pagination: {
                current_page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                total_pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching moderation queue:', error);
        res.status(500).json({ error: 'Failed to fetch moderation queue' });
    }
};

/**
 * Update review moderation status
 * PUT /api/node/reviews/admin/moderation/:queue_id
 * Body: { status, admin_notes }
 * status: PENDING, APPROVED, REJECTED
 */
export const updateModerationStatus = async (req, res) => {
    const client = await pool.connect();
    try {
        const { queue_id } = req.params;
        const { status, admin_notes } = req.body;

        if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await client.query('BEGIN');

        // Get the review from moderation queue
        const queueResult = await client.query(
            `SELECT review_id FROM review_moderation_queue WHERE queue_id = $1`,
            [queue_id]
        );

        if (queueResult.rows.length === 0) {
            return res.status(404).json({ error: 'Moderation queue entry not found' });
        }

        const reviewId = queueResult.rows[0].review_id;

        // Update moderation queue
        await client.query(
            `UPDATE review_moderation_queue 
             SET status = $1, admin_notes = $2, updated_at = CURRENT_TIMESTAMP
             WHERE queue_id = $3`,
            [status, admin_notes, queue_id]
        );

        // Update review status if rejecting
        if (status === 'REJECTED') {
            await client.query(
                `UPDATE reviews SET status = 'HIDDEN' WHERE review_id = $1`,
                [reviewId]
            );
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: `Review moderation status updated to ${status}`
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating moderation status:', error);
        res.status(500).json({ error: 'Failed to update moderation status' });
    } finally {
        client.release();
    }
};

/**
 * Flag a review for moderation
 * POST /api/node/reviews/:review_id/flag
 * Body: { flagged_reason }
 */
export const flagReview = async (req, res) => {
    const client = await pool.connect();
    try {
        const { review_id } = req.params;
        const { flagged_reason } = req.body;

        if (!flagged_reason) {
            return res.status(400).json({ error: 'Reason for flagging is required' });
        }

        await client.query('BEGIN');

        // Check if already flagged
        const existingFlag = await client.query(
            `SELECT queue_id FROM review_moderation_queue WHERE review_id = $1 AND status = 'PENDING'`,
            [review_id]
        );

        if (existingFlag.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Review is already flagged for moderation' });
        }

        // Create moderation queue entry
        const queueResult = await client.query(
            `INSERT INTO review_moderation_queue (review_id, flagged_reason, status)
             VALUES ($1, $2, 'PENDING')
             RETURNING queue_id`,
            [review_id, flagged_reason]
        );

        // Update review status to FLAGGED
        await client.query(
            `UPDATE reviews SET status = 'FLAGGED' WHERE review_id = $1`,
            [review_id]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            queue_id: queueResult.rows[0].queue_id,
            message: 'Review flagged for moderation'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error flagging review:', error);
        res.status(500).json({ error: 'Failed to flag review' });
    } finally {
        client.release();
    }
};

/**
 * Vote on review helpfulness
 * POST /api/node/reviews/:review_id/helpfulness
 * Body: { helpful: true/false }
 */
export const voteReviewHelpfulness = async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.user_id;
        const { review_id } = req.params;
        const { helpful } = req.body;

        if (typeof helpful !== 'boolean') {
            return res.status(400).json({ error: 'helpful must be a boolean' });
        }

        await client.query('BEGIN');

        // Check if user already voted
        const existingVote = await client.query(
            `SELECT vote_id, helpful FROM review_helpfulness_votes 
             WHERE review_id = $1 AND voter_id = $2`,
            [review_id, userId]
        );

        let voteId;
        if (existingVote.rows.length > 0) {
            // Update existing vote
            const vote = existingVote.rows[0];
            
            // If voting the same way, remove the vote
            if (vote.helpful === helpful) {
                await client.query(
                    `DELETE FROM review_helpfulness_votes WHERE vote_id = $1`,
                    [vote.vote_id]
                );
                voteId = null;
            } else {
                // Update to opposite vote
                const updateResult = await client.query(
                    `UPDATE review_helpfulness_votes 
                     SET helpful = $1, updated_at = CURRENT_TIMESTAMP
                     WHERE vote_id = $2
                     RETURNING vote_id`,
                    [helpful, vote.vote_id]
                );
                voteId = updateResult.rows[0].vote_id;
            }
        } else {
            // Create new vote
            const insertResult = await client.query(
                `INSERT INTO review_helpfulness_votes (review_id, voter_id, helpful)
                 VALUES ($1, $2, $3)
                 RETURNING vote_id`,
                [review_id, userId, helpful]
            );
            voteId = insertResult.rows[0].vote_id;
        }

        // Get updated helpfulness stats
        const statsResult = await client.query(
            `SELECT 
                COALESCE(SUM(CASE WHEN helpful = true THEN 1 ELSE 0 END), 0) as helpful_count,
                COALESCE(SUM(CASE WHEN helpful = false THEN 1 ELSE 0 END), 0) as not_helpful_count
             FROM review_helpfulness_votes WHERE review_id = $1`,
            [review_id]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            vote_id: voteId,
            helpfulness_stats: statsResult.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error voting on review helpfulness:', error);
        res.status(500).json({ error: 'Failed to vote on review helpfulness' });
    } finally {
        client.release();
    }
};

/**
 * Get helpfulness stats for a review
 * GET /api/node/reviews/:review_id/helpfulness
 */
export const getReviewHelpfulness = async (req, res) => {
    try {
        const { review_id } = req.params;
        const token = req.headers.authorization?.split(' ')[1];
        let userId = null;

        // Try to extract userId from token if provided
        if (token) {
            try {
                // This would require your JWT verification logic
                // For now, we'll skip user vote if not properly authenticated
                userId = req.user?.user_id;
            } catch (err) {
                // Ignore auth errors for GET requests
            }
        }

        // Get helpfulness stats
        const statsResult = await pool.query(
            `SELECT 
                COALESCE(SUM(CASE WHEN helpful = true THEN 1 ELSE 0 END), 0) as helpful_count,
                COALESCE(SUM(CASE WHEN helpful = false THEN 1 ELSE 0 END), 0) as not_helpful_count
             FROM review_helpfulness_votes WHERE review_id = $1`,
            [review_id]
        );

        // Get user's vote if authenticated
        let userVote = null;
        if (userId) {
            const userVoteResult = await pool.query(
                `SELECT helpful FROM review_helpfulness_votes 
                 WHERE review_id = $1 AND voter_id = $2`,
                [review_id, userId]
            );
            if (userVoteResult.rows.length > 0) {
                userVote = userVoteResult.rows[0].helpful;
            }
        }

        res.json({
            stats: statsResult.rows[0],
            user_vote: userVote
        });
    } catch (error) {
        console.error('Error fetching review helpfulness:', error);
        res.status(500).json({ error: 'Failed to fetch review helpfulness' });
    }
};



export const getNotificationPreferences = async (req, res) => {
    try {
        const storeId = req.user.store_id;

        if (!storeId) {
            return res.status(403).json({ error: 'Only sellers can access this endpoint' });
        }

        const result = await pool.query(
            `SELECT notification_id, store_id, new_review_enabled, response_reply_enabled, flagged_review_enabled, updated_at
             FROM seller_review_notifications
             WHERE store_id = $1`,
            [storeId]
        );

        if (result.rows.length === 0) {
            // Return defaults if not yet created
            return res.json({
                store_id: storeId,
                new_review_enabled: true,
                response_reply_enabled: true,
                flagged_review_enabled: true
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching notification preferences:', error);
        res.status(500).json({ error: 'Failed to fetch notification preferences' });
    }
};

/**
 * Check if an order has been reviewed (all products)
 * GET /api/node/reviews/order/:order_id/status
 */
export const checkOrderReviewStatus = async (req, res) => {
    try {
        const { order_id } = req.params;

        // Get total products in order
        const orderItemsResult = await pool.query(
            `SELECT COUNT(*) as total_items FROM order_item WHERE order_id = $1`,
            [order_id]
        );

        const totalItems = parseInt(orderItemsResult.rows[0].total_items);

        // Get reviewed products
        const reviewedResult = await pool.query(
            `SELECT COUNT(DISTINCT product_id) as reviewed_count 
             FROM reviews 
             WHERE order_id = $1`,
            [order_id]
        );

        const reviewedCount = parseInt(reviewedResult.rows[0].reviewed_count);

        res.json({
            order_id,
            total_items: totalItems,
            reviewed_count: reviewedCount,
            is_fully_reviewed: reviewedCount === totalItems && totalItems > 0
        });
    } catch (error) {
        console.error('Error checking order review status:', error);
        res.status(500).json({ error: 'Failed to check review status' });
    }
};

/**
 * Update seller review notification preferences
 * PUT /api/node/reviews/seller/notifications
 * Body: { new_review_enabled, response_reply_enabled, flagged_review_enabled }
 */
export const updateNotificationPreferences = async (req, res) => {
    const client = await pool.connect();
    try {
        const storeId = req.user.store_id;
        const { new_review_enabled, response_reply_enabled, flagged_review_enabled } = req.body;

        if (!storeId) {
            return res.status(403).json({ error: 'Only sellers can update preferences' });
        }

        await client.query('BEGIN');

        // Check if preferences exist
        const existingResult = await client.query(
            `SELECT notification_id FROM seller_review_notifications WHERE store_id = $1`,
            [storeId]
        );

        let result;
        if (existingResult.rows.length > 0) {
            // Update existing
            result = await client.query(
                `UPDATE seller_review_notifications 
                 SET new_review_enabled = $1, response_reply_enabled = $2, flagged_review_enabled = $3, updated_at = CURRENT_TIMESTAMP
                 WHERE store_id = $4
                 RETURNING *`,
                [new_review_enabled, response_reply_enabled, flagged_review_enabled, storeId]
            );
        } else {
            // Create new
            result = await client.query(
                `INSERT INTO seller_review_notifications (store_id, new_review_enabled, response_reply_enabled, flagged_review_enabled)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [storeId, new_review_enabled, response_reply_enabled, flagged_review_enabled]
            );
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            preferences: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating notification preferences:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    } finally {
        client.release();
    }
};
