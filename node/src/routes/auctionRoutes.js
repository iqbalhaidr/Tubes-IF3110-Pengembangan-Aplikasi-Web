import express from 'express';
import { authenticateToken } from '../auth.js';
import { pool } from '../db.js';

const router = express.Router();

// ============ GET ENDPOINTS ============

/**
 * GET /api/node/auctions
 * List all active auctions with pagination
 * Query params: page (default 1), limit (default 10)
 */
router.get('/auctions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count of active auctions
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM auctions WHERE status = $1',
      ['ACTIVE']
    );
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated active auctions with seller info
    const result = await pool.query(
      `SELECT 
        a.id,
        a.product_id,
        a.seller_id,
        u_seller.username as seller_username,
        p.name as product_name,
        p.description as product_description,
        a.initial_bid,
        a.current_bid,
        a.highest_bidder_id,
        u_bidder.username as highest_bidder_username,
        a.min_bid_increment,
        a.countdown_end_time,
        a.started_at,
        EXTRACT(EPOCH FROM (a.countdown_end_time - CURRENT_TIMESTAMP))::INTEGER as seconds_remaining,
        (SELECT COUNT(*) FROM auction_bids WHERE auction_id = a.id) as total_bids
      FROM auctions a
      LEFT JOIN "user" u_seller ON a.seller_id = u_seller.user_id
      LEFT JOIN "user" u_bidder ON a.highest_bidder_id = u_bidder.user_id
      LEFT JOIN product p ON a.product_id = p.product_id
      WHERE a.status = $1
      ORDER BY a.countdown_end_time ASC
      LIMIT $2 OFFSET $3`,
      ['ACTIVE', limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching auctions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/node/auctions/:id
 * Get detailed information about a specific auction
 */
router.get('/auctions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get auction details with seller and current bidder info
    const result = await pool.query(
      `SELECT 
        a.id,
        a.product_id,
        a.seller_id,
        u_seller.username as seller_username,
        u_seller.phone as seller_phone,
        p.name as product_name,
        p.description as product_description,
        p.image as product_image,
        p.price as product_price,
        a.initial_bid,
        a.current_bid,
        a.highest_bidder_id,
        u_bidder.username as highest_bidder_username,
        a.min_bid_increment,
        a.status,
        a.countdown_end_time,
        a.started_at,
        a.ended_at,
        a.winner_id,
        u_winner.username as winner_username,
        EXTRACT(EPOCH FROM (a.countdown_end_time - CURRENT_TIMESTAMP))::INTEGER as seconds_remaining
      FROM auctions a
      LEFT JOIN "user" u_seller ON a.seller_id = u_seller.user_id
      LEFT JOIN "user" u_bidder ON a.highest_bidder_id = u_bidder.user_id
      LEFT JOIN "user" u_winner ON a.winner_id = u_winner.user_id
      LEFT JOIN product p ON a.product_id = p.product_id
      WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching auction:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/node/auctions/:id/bids
 * Get bid history for an auction
 */
router.get('/auctions/:id/bids', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    // Verify auction exists
    const auctionCheck = await pool.query('SELECT id FROM auctions WHERE id = $1', [id]);
    if (auctionCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }

    // Get bid history ordered by most recent first
    const result = await pool.query(
      `SELECT 
        ab.id,
        ab.auction_id,
        ab.bidder_id,
        u.username as bidder_username,
        ab.bid_amount,
        ab.placed_at
      FROM auction_bids ab
      LEFT JOIN "user" u ON ab.bidder_id = u.user_id
      WHERE ab.auction_id = $1
      ORDER BY ab.placed_at DESC
      LIMIT $2`,
      [id, limit]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching bid history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/node/auctions/user/:userId/created
 * Get auctions created by a specific user (seller)
 */
router.get('/user/:userId/created', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT 
        a.id,
        a.product_id,
        a.seller_id,
        p.name as product_name,
        a.initial_bid,
        a.current_bid,
        a.status,
        a.countdown_end_time,
        a.started_at,
        a.ended_at,
        (SELECT COUNT(*) FROM auction_bids WHERE auction_id = a.id) as total_bids
      FROM auctions a
      LEFT JOIN product p ON a.product_id = p.product_id
      WHERE a.seller_id = $1
      ORDER BY a.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching seller auctions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ POST ENDPOINTS ============

/**
 * POST /api/node/auctions
 * Create a new auction
 * Required: product_id, seller_id, initial_bid, min_bid_increment
 * Auth: Required
 */
router.post('/auctions', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { product_id, initial_bid, min_bid_increment } = req.body;
    const seller_id = req.user.id; // From JWT token

    // Validate input
    if (!product_id || !initial_bid || !min_bid_increment) {
      return res.status(400).json({
        success: false,
        error: 'product_id, initial_bid, and min_bid_increment are required',
      });
    }

    if (initial_bid <= 0 || min_bid_increment <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Bid amounts must be greater than 0',
      });
    }

    await client.query('BEGIN');

    // Verify product exists and belongs to user
    const productCheck = await client.query(
      'SELECT product_id FROM product WHERE product_id = $1',
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Create auction
    const result = await client.query(
      `INSERT INTO auctions (
        product_id, seller_id, initial_bid, current_bid, 
        min_bid_increment, status, countdown_end_time
      ) VALUES ($1, $2, $3, $3, $4, 'ACTIVE', CURRENT_TIMESTAMP + INTERVAL '15 seconds')
      RETURNING *`,
      [product_id, seller_id, initial_bid, min_bid_increment]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating auction:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

/**
 * POST /api/node/auctions/:id/bid
 * Place a bid on an auction
 * Required: bid_amount
 * Auth: Required
 */
router.post('/auctions/:id/bid', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { bid_amount } = req.body;
    const bidder_id = req.user.id;

    if (!bid_amount || bid_amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'bid_amount must be a positive number',
      });
    }

    await client.query('BEGIN');

    // Get current auction state
    const auctionResult = await client.query(
      'SELECT * FROM auctions WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (auctionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }

    const auction = auctionResult.rows[0];

    // Validate auction is still active
    if (auction.status !== 'ACTIVE') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Auction is not active' });
    }

    // Validate bid is higher than current bid
    const minimumBid = auction.current_bid + auction.min_bid_increment;
    if (bid_amount < minimumBid) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Bid must be at least ${minimumBid} (current: ${auction.current_bid})`,
      });
    }

    // Prevent seller from bidding on own auction
    if (bidder_id === auction.seller_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Seller cannot bid on their own auction',
      });
    }

    // Record the bid
    await client.query(
      `INSERT INTO auction_bids (auction_id, bidder_id, bid_amount)
       VALUES ($1, $2, $3)`,
      [id, bidder_id, bid_amount]
    );

    // Update auction with new highest bid
    const updateResult = await client.query(
      `UPDATE auctions 
       SET current_bid = $1, highest_bidder_id = $2, countdown_end_time = CURRENT_TIMESTAMP + INTERVAL '15 seconds'
       WHERE id = $3
       RETURNING *`,
      [bid_amount, bidder_id, id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: updateResult.rows[0],
      message: 'Bid placed successfully, countdown reset to 15 seconds',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error placing bid:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

/**
 * POST /api/node/auctions/:id/chat
 * Send a chat message in an auction
 * Required: message
 * Auth: Required
 */
router.post('/auctions/:id/chat', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const user_id = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message cannot be empty' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ success: false, error: 'Message too long (max 1000 chars)' });
    }

    // Verify auction exists
    const auctionCheck = await pool.query('SELECT id FROM auctions WHERE id = $1', [id]);
    if (auctionCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }

    // Insert chat message
    const result = await pool.query(
      `INSERT INTO chat_messages (auction_id, user_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, user_id, message]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/node/auctions/:id/accept
 * Seller accepts a bid and ends auction immediately
 * Auth: Required (must be auction seller)
 */
router.post('/auctions/:id/accept', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const seller_id = req.user.id;

    await client.query('BEGIN');

    // Get auction
    const auctionResult = await client.query(
      'SELECT * FROM auctions WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (auctionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }

    const auction = auctionResult.rows[0];

    // Verify seller owns auction
    if (auction.seller_id !== seller_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, error: 'Only auction seller can accept bids' });
    }

    // Verify auction is active
    if (auction.status !== 'ACTIVE') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Auction is not active' });
    }

    // Verify there are bids
    if (!auction.highest_bidder_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'No bids to accept' });
    }

    // End auction with winner
    const result = await client.query(
      `UPDATE auctions 
       SET status = 'ENDED', winner_id = $1, ended_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [auction.highest_bidder_id, id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Auction ended, bid accepted',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error accepting bid:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

// ============ PUT ENDPOINTS ============

/**
 * PUT /api/node/auctions/:id/cancel
 * Cancel an active auction (seller only)
 * Auth: Required (must be auction seller)
 */
router.put('/auctions/:id/cancel', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const seller_id = req.user.id;

    await client.query('BEGIN');

    const auctionResult = await client.query(
      'SELECT * FROM auctions WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (auctionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }

    const auction = auctionResult.rows[0];

    if (auction.seller_id !== seller_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, error: 'Only auction seller can cancel' });
    }

    if (auction.status !== 'ACTIVE') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Only active auctions can be cancelled' });
    }

    const result = await client.query(
      `UPDATE auctions 
       SET status = 'CANCELLED', ended_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Auction cancelled successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cancelling auction:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

export default router;
