import express from 'express';
import { authenticateToken } from '../auth.js';
import { pool } from '../db.js';
import { requireFeature, FEATURES } from '../middleware/featureFlagMiddleware.js';

const router = express.Router();

/**
 * Helper function to create an order when an auction ends with a winner
 * Creates an order with status 'APPROVED', deducts buyer balance, and adds order_item
 * Returns { success, orderId, error } - does not throw on insufficient balance
 */
async function createOrderFromAuction(client, auction) {
  // Get buyer's address, balance, and product details
  const buyerResult = await client.query(
    'SELECT address, balance FROM "user" WHERE user_id = $1',
    [auction.highest_bidder_id]
  );

  const productResult = await client.query(
    'SELECT product_id, store_id FROM product WHERE product_id = $1',
    [auction.product_id]
  );

  if (buyerResult.rows.length === 0 || productResult.rows.length === 0) {
    console.error(`[Auction] Buyer or product not found for auction #${auction.id}`);
    return { success: false, orderId: null, error: 'Buyer or product not found' };
  }

  const buyerAddress = buyerResult.rows[0].address || 'Address not provided';
  const buyerBalance = parseFloat(buyerResult.rows[0].balance) || 0;
  const storeId = productResult.rows[0].store_id;
  const finalPrice = Math.round(parseFloat(auction.current_bid));

  // Check if buyer has enough balance - gracefully handle insufficient funds
  if (buyerBalance < finalPrice) {
    console.warn(`[Auction] Buyer #${auction.highest_bidder_id} has insufficient balance (${buyerBalance} < ${finalPrice}). Order will not be created.`);
    return { 
      success: false, 
      orderId: null, 
      error: 'Insufficient balance',
      details: { buyerBalance, requiredAmount: finalPrice }
    };
  }

  // Deduct balance from buyer
  await client.query(
    'UPDATE "user" SET balance = balance - $1 WHERE user_id = $2',
    [finalPrice, auction.highest_bidder_id]
  );
  console.log(`[Auction] Deducted Rp ${finalPrice} from buyer #${auction.highest_bidder_id}`);

  // Create the order with status 'APPROVED'
  const orderResult = await client.query(
    `INSERT INTO "order" (buyer_id, store_id, total_price, shipping_address, status, confirmed_at)
     VALUES ($1, $2, $3, $4, 'APPROVED', CURRENT_TIMESTAMP)
     RETURNING order_id`,
    [auction.highest_bidder_id, storeId, finalPrice, buyerAddress]
  );

  const orderId = orderResult.rows[0].order_id;

  // Create the order item
  await client.query(
    `INSERT INTO order_item (order_id, product_id, quantity, price_at_purchase, subtotal)
     VALUES ($1, $2, 1, $3, $3)`,
    [orderId, auction.product_id, finalPrice]
  );

  console.log(`[Auction] Order #${orderId} created for auction #${auction.id} winner (user #${auction.highest_bidder_id})`);

  return { success: true, orderId, error: null };
}

// ============ GET ENDPOINTS ============

/**
 * GET /api/node/auctions
 * List auctions with pagination
 * Query params: page (default 1), limit (default 10), status (default 'ACTIVE', can also be 'SCHEDULED', 'ENDED', 'CANCELLED')
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || 'ACTIVE';
    const offset = (page - 1) * limit;

    // Validate status
    const validStatuses = ['SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status filter' });
    }

    // Get total count of auctions with given status (exclude soft-deleted)
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM auctions WHERE status = $1 AND deleted_at IS NULL',
      [status]
    );
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated auctions with seller info
    const result = await pool.query(
      `SELECT 
        a.id,
        a.product_id,
        a.seller_id,
        u_seller.name as seller_username,
        p.product_name as product_name,
        p.description as product_description,
        p.main_image_path as product_image,
        a.initial_bid,
        a.current_bid,
        a.highest_bidder_id,
        u_bidder.name as highest_bidder_username,
        a.min_bid_increment,
        a.status,
        a.start_time,
        a.countdown_end_time,
        a.started_at,
        a.ended_at,
        EXTRACT(EPOCH FROM (a.countdown_end_time - CURRENT_TIMESTAMP))::INTEGER as seconds_remaining,
        EXTRACT(EPOCH FROM (a.start_time - CURRENT_TIMESTAMP))::INTEGER as seconds_until_start,
        (SELECT COUNT(*) FROM auction_bids WHERE auction_id = a.id) as total_bids
      FROM auctions a
      LEFT JOIN "user" u_seller ON a.seller_id = u_seller.user_id
      LEFT JOIN "user" u_bidder ON a.highest_bidder_id = u_bidder.user_id
      LEFT JOIN product p ON a.product_id = p.product_id
      WHERE a.status = $1 AND a.deleted_at IS NULL
      ORDER BY ${status === 'SCHEDULED' ? 'a.start_time ASC' : status === 'ACTIVE' ? 'a.countdown_end_time ASC' : 'a.ended_at DESC'}
      LIMIT $2 OFFSET $3`,
      [status, limit, offset]
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
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get auction details with seller and current bidder info
    const result = await pool.query(
      `SELECT 
        a.id,
        a.product_id,
        a.seller_id,
        u_seller.name as seller_username,
        u_seller.address as seller_address,
        p.product_name as product_name,
        p.description as product_description,
        p.main_image_path as product_image,
        p.price as product_price,
        a.initial_bid,
        a.current_bid,
        a.highest_bidder_id,
        u_bidder.name as highest_bidder_username,
        a.min_bid_increment,
        a.status,
        a.start_time,
        a.countdown_end_time,
        a.started_at,
        a.ended_at,
        a.highest_bidder_id as winner_id,
        u_bidder.name as winner_username,
        EXTRACT(EPOCH FROM (a.countdown_end_time - CURRENT_TIMESTAMP))::INTEGER as seconds_remaining,
        EXTRACT(EPOCH FROM (a.start_time - CURRENT_TIMESTAMP))::INTEGER as seconds_until_start
      FROM auctions a
      LEFT JOIN "user" u_seller ON a.seller_id = u_seller.user_id
      LEFT JOIN "user" u_bidder ON a.highest_bidder_id = u_bidder.user_id
      LEFT JOIN product p ON a.product_id = p.product_id
      WHERE a.id = $1 AND a.deleted_at IS NULL`,
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
router.get('/:id/bids', async (req, res) => {
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
        u.name as bidder_username,
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
 * Required: product_id, initial_bid, min_bid_increment
 * Optional: start_time (ISO 8601 timestamp, defaults to now for immediate start)
 * Auth: Required
 */
router.post('/', authenticateToken, requireFeature(FEATURES.AUCTION_ENABLED), async (req, res) => {
  const client = await pool.connect();
  try {
    const { product_id, initial_bid, min_bid_increment, start_time } = req.body;
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

    // Parse start_time - default to now if not provided
    let auctionStartTime = new Date();
    if (start_time) {
      auctionStartTime = new Date(start_time);
      if (isNaN(auctionStartTime.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid start_time format. Use ISO 8601 (e.g., 2025-12-10T10:00:00Z)',
        });
      }
    }

    // Determine initial status based on start_time
    const now = new Date();
    const initialStatus = auctionStartTime > now ? 'SCHEDULED' : 'ACTIVE';

    await client.query('BEGIN');

    // Verify product exists and belongs to seller
    const productCheck = await client.query(
      `SELECT p.product_id, p.store_id, s.user_id 
       FROM product p 
       JOIN store s ON p.store_id = s.store_id
       WHERE p.product_id = $1`,
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const { store_id, user_id } = productCheck.rows[0];
    
    // Verify seller owns the store
    if (user_id !== seller_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, error: 'You do not own this product' });
    }

    // Check if seller already has an ACTIVE or SCHEDULED auction in the same store
    const existingAuction = await client.query(
      `SELECT a.id 
       FROM auctions a
       JOIN product p ON a.product_id = p.product_id
       WHERE p.store_id = $1 
       AND a.seller_id = $2 
       AND a.status IN ('ACTIVE', 'SCHEDULED')
       AND a.deleted_at IS NULL`,
      [store_id, seller_id]
    );

    if (existingAuction.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: 'You can only have 1 active or scheduled auction per store at a time',
      });
    }

    // Calculate countdown end time (15 seconds from start if ACTIVE, or from start_time if SCHEDULED)
    const countdownEndTime = initialStatus === 'ACTIVE' 
      ? new Date(Date.now() + 15 * 1000)
      : new Date(auctionStartTime.getTime() + 15 * 1000);

    // Create auction
    const result = await client.query(
      `INSERT INTO auctions (
        product_id, seller_id, initial_bid, current_bid, 
        min_bid_increment, status, start_time, countdown_end_time, started_at
      ) VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        product_id, 
        seller_id, 
        initial_bid, 
        min_bid_increment, 
        initialStatus,
        auctionStartTime.toISOString(),
        countdownEndTime.toISOString(),
        initialStatus === 'ACTIVE' ? new Date().toISOString() : null
      ]
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
router.post('/:id/bid', authenticateToken, requireFeature(FEATURES.AUCTION_ENABLED), async (req, res) => {
  const { id } = req.params;
  const auctionIdNum = parseInt(id);
  const client = await pool.connect();
  
  try {
    const { bid_amount } = req.body;
    const bidder_id = req.user.id;

    if (!bid_amount || bid_amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'bid_amount must be a positive number',
      });
    }

    await client.query('SELECT pg_advisory_lock($1)', [auctionIdNum]);
    
    await client.query('BEGIN');
    const auctionResult = await client.query(
      'SELECT * FROM auctions WHERE id = $1',
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

    // Check bidder's balance
    const bidderResult = await client.query(
      'SELECT balance FROM "user" WHERE user_id = $1',
      [bidder_id]
    );

    if (bidderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const bidderBalance = parseFloat(bidderResult.rows[0].balance) || 0;
    if (bid_amount > bidderBalance) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Your balance: ${bidderBalance}, Bid amount: ${bid_amount}`,
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
    // Always release the advisory lock
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [auctionIdNum]);
    } catch (unlockErr) {
      console.error('Error releasing advisory lock:', unlockErr);
    }
    client.release();
  }
});

/**
 * POST /api/node/auctions/:id/chat
 * Send a chat message in an auction
 * Required: message
 * Auth: Required
 */
router.post('/:id/chat', authenticateToken, async (req, res) => {
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
 * Creates an order for the winner with status 'APPROVED'
 * Auth: Required (must be auction seller)
 */
router.post('/:id/accept', authenticateToken, requireFeature(FEATURES.AUCTION_ENABLED), async (req, res) => {
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

    // Try to create order for the winner
    const orderResult = await createOrderFromAuction(client, auction);

    await client.query('COMMIT');

    // Build response based on order creation result
    if (orderResult.success) {
      res.json({
        success: true,
        data: result.rows[0],
        order_id: orderResult.orderId,
        message: 'Auction ended, bid accepted, order created for winner',
      });
    } else {
      res.json({
        success: true,
        data: result.rows[0],
        order_id: null,
        order_error: orderResult.error,
        message: `Auction ended, but order could not be created: ${orderResult.error}`,
      });
    }
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
 * PUT /api/node/auctions/:id/end
 * End an auction when countdown expires (can be called by anyone/system)
 * Creates an order for the winner if there are bids
 */
router.put('/:id/end', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

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

    // Verify auction is still active
    if (auction.status !== 'ACTIVE') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Auction is not active' });
    }

    // Check if countdown has expired
    const now = new Date();
    const endTime = new Date(auction.countdown_end_time);
    if (endTime > now) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        error: 'Auction countdown has not expired yet',
        seconds_remaining: Math.ceil((endTime - now) / 1000)
      });
    }

    let orderId = null;
    let orderError = null;
    let winnerId = auction.highest_bidder_id;

    // If there's a winner, try to create the order
    if (winnerId) {
      const orderResult = await createOrderFromAuction(client, auction);
      if (orderResult.success) {
        orderId = orderResult.orderId;
      } else {
        orderError = orderResult.error;
        console.warn(`[Auction] Could not create order for auction #${id}: ${orderError}`);
      }
    }

    // End auction regardless of order creation result
    const result = await client.query(
      `UPDATE auctions 
       SET status = 'ENDED', winner_id = $1, ended_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [winnerId, id]
    );

    await client.query('COMMIT');

    // Build response message
    let message;
    if (!winnerId) {
      message = 'Auction ended with no bids';
    } else if (orderId) {
      message = 'Auction ended with winner, order created';
    } else {
      message = `Auction ended with winner, but order could not be created: ${orderError}`;
    }

    res.json({
      success: true,
      data: result.rows[0],
      order_id: orderId,
      order_error: orderError,
      message,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error ending auction:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

/**
 * PUT /api/node/auctions/:id/cancel
 * Cancel an active auction (seller only)
 * Auth: Required (must be auction seller)
 */
router.put('/:id/cancel', authenticateToken, async (req, res) => {
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

/**
 * DELETE /api/node/auctions/:id
 * Soft-delete an auction (seller only)
 * Can only delete SCHEDULED or ACTIVE auctions with no bids (total_bids = 0)
 * Auth: Required (must be auction seller)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
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

    // Only seller can delete their own auction
    if (auction.seller_id !== seller_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, error: 'Only auction seller can delete' });
    }

    // Check for bids
    const bidCount = await client.query(
      'SELECT COUNT(*) FROM auction_bids WHERE auction_id = $1',
      [id]
    );
    const totalBids = parseInt(bidCount.rows[0].count);

    if (totalBids > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Cannot delete auction with bids',
      });
    }

    // Can only delete SCHEDULED or ACTIVE auctions
    if (!['SCHEDULED', 'ACTIVE'].includes(auction.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Cannot delete ${auction.status} auctions`,
      });
    }

    // Soft delete
    const result = await client.query(
      `UPDATE auctions 
       SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Auction deleted successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting auction:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

export default router;
