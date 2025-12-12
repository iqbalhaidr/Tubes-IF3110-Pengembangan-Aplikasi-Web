import { pool } from '../db.js';
import { checkFeatureForSocket, FEATURES } from '../middleware/featureFlagMiddleware.js';
import { sendPushNotification } from '../services/pushService.js';

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

export function registerAuctionEvents(io) {
  // Track active auction countdowns
  const auctionTimers = new Map();
  const notifiedForEndingSoon = new Set();

  io.on('connection', (socket) => {
    socket.on('join_auction', (data) => {
      try {
        const { auctionId, userId } = data;
        const room = `auction_${auctionId}`;

        socket.join(room);
        console.log(`[Auction] User ${userId} joined auction ${auctionId}`);

        // Broadcast user joined to others in room
        socket.to(room).emit('user_joined', {
          userId,
          auctionId,
          timestamp: new Date(),
        });

        // Send current auction state to joining user
        socket.emit('auction_state', {
          auctionId,
          message: 'Successfully joined auction room',
        });

        // Start countdown sync if not already running
        if (!auctionTimers.has(auctionId)) {
          startAuctionCountdown(io, auctionId, room);
        }
      } catch (error) {
        console.error('[Auction] Error in join_auction:', error);
        socket.emit('auction_error', {
          code: 'JOIN_FAILED',
          message: error.message,
        });
      }
    });

    socket.on('place_bid', async (data) => {
      try {
        const { auctionId, userId, bidAmount } = data;
        const room = `auction_${auctionId}`;

        if (!auctionId || !userId || !bidAmount) {
          return socket.emit('auction_error', { code: 'INVALID_BID', message: 'Missing required bid data' });
        }

        const featureError = await checkFeatureForSocket(FEATURES.AUCTION_ENABLED, userId);
        if (featureError) {
          return socket.emit('auction_error', featureError);
        }

        const client = await pool.connect();
        try {
          await client.query('SELECT pg_advisory_lock($1)', [auctionId]);
          
          await client.query('BEGIN');
          const auctionResult = await client.query(
            `SELECT a.id, a.current_bid, a.min_bid_increment, a.status, a.countdown_end_time, a.highest_bidder_id, p.product_name
             FROM auctions a
             JOIN product p ON a.product_id = p.product_id
             WHERE a.id = $1`,
            [auctionId]
          );

          if (auctionResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return socket.emit('auction_error', { code: 'AUCTION_NOT_FOUND', message: 'Auction not found' });
          }

          const auction = auctionResult.rows[0];
          const previousHighestBidderId = auction.highest_bidder_id;

          if (auction.status !== 'ACTIVE') {
            await client.query('ROLLBACK');
            return socket.emit('auction_error', { code: 'AUCTION_NOT_ACTIVE', message: 'Auction is no longer active' });
          }

          const minBid = parseFloat(auction.current_bid) + parseFloat(auction.min_bid_increment);
          if (bidAmount < minBid) {
            await client.query('ROLLBACK');
            return socket.emit('auction_error', { code: 'BID_TOO_LOW', message: `Bid must be at least ${minBid}` });
          }

          await client.query(
            `INSERT INTO auction_bids (auction_id, bidder_id, bid_amount) VALUES ($1, $2, $3)`,
            [auctionId, userId, bidAmount]
          );

          const newEndTime = new Date(Date.now() + 15000);
          await client.query(
            `UPDATE auctions SET current_bid = $1, highest_bidder_id = $2, countdown_end_time = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
            [bidAmount, userId, newEndTime, auctionId]
          );

          await client.query('COMMIT');

          // --- Notifications ---
          if (previousHighestBidderId && previousHighestBidderId !== userId) {
            const outbidPayload = {
              title: `You've been outbid on "${auction.product_name}"!`,
              body: `A new bid of Rp ${Number(bidAmount).toLocaleString('id-ID')} has been placed.`,
              data: { url: `/auction/${auctionId}` }
            };
            sendPushNotification(previousHighestBidderId, outbidPayload, 'auction_enabled');
          }

          if (auctionTimers.has(auctionId)) {
            auctionTimers.get(auctionId).lastBidTime = Date.now();
          }

          io.to(room).emit('bid_placed', { userId, bidAmount, auctionId, timestamp: new Date(), countdownReset: true, newEndTime: newEndTime.toISOString() });
          socket.emit('bid_success', { bidAmount, message: 'Your bid has been placed successfully' });

        } catch (dbError) {
          await client.query('ROLLBACK');
          console.error('[Auction] Database error in place_bid:', dbError);
          socket.emit('auction_error', { code: 'DB_ERROR', message: 'Failed to save bid' });
        } finally {
          try {
            await client.query('SELECT pg_advisory_unlock($1)', [auctionId]);
          } catch (unlockErr) {
            console.error('[Auction] Error releasing advisory lock:', unlockErr);
          }
          client.release();
        }
      } catch (error) {
        console.error('[Auction] Error in place_bid:', error);
        socket.emit('auction_error', { code: 'BID_FAILED', message: error.message });
      }
    });

    // ... (rest of the file is the same until startAuctionCountdown)
    socket.on('leave_auction', (data) => {
      try {
        const { auctionId, userId } = data;
        const room = `auction_${auctionId}`;

        socket.leave(room);
        console.log(`[Auction] User ${userId} left auction ${auctionId}`);

        // Notify others
        socket.to(room).emit('user_left', {
          userId,
          auctionId,
          timestamp: new Date(),
        });

        io.of('/').in(room).fetchSockets().then((sockets) => {
          if (sockets.length === 0) {
            console.log(`[Auction] Cleaning up empty auction room: ${room}`);
            cleanupAuctionRoom(auctionId);
          }
        });
      } catch (error) {
        console.error('[Auction] Error in leave_auction:', error);
      }
    });

    socket.on('send_message', (data) => {
      try {
        const { auctionId, userId, username, message } = data;
        const room = `auction_${auctionId}`;

        if (!message || message.trim().length === 0) {
          socket.emit('auction_error', {
            code: 'EMPTY_MESSAGE',
            message: 'Message cannot be empty',
          });
          return;
        }

        if (message.length > 1000) {
          socket.emit('auction_error', {
            code: 'MESSAGE_TOO_LONG',
            message: 'Message exceeds 1000 character limit',
          });
          return;
        }

        console.log(
          `[Auction Chat] User ${userId} in auction ${auctionId}: ${message}`
        );

        io.to(room).emit('message_received', {
          userId,
          username,
          auctionId,
          message,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('[Auction] Error in send_message:', error);
        socket.emit('auction_error', {
          code: 'MESSAGE_SEND_FAILED',
          message: error.message,
        });
      }
    });

    socket.on('typing', (data) => {
      try {
        const { auctionId, userId, username } = data;
        const room = `auction_${auctionId}`;

        socket.to(room).emit('user_typing', {
          userId,
          username,
          auctionId,
        });
      } catch (error) {
        console.error('[Auction] Error in typing:', error);
      }
    });

    socket.on('stop_typing', (data) => {
      try {
        const { auctionId, userId } = data;
        const room = `auction_${auctionId}`;

        socket.to(room).emit('user_stop_typing', {
          userId,
          auctionId,
        });
      } catch (error) {
        console.error('[Auction] Error in stop_typing:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Auction] Socket disconnected: ${socket.id}`);
    });
  });

  function startAuctionCountdown(io, auctionId, room) {
    try {
      if (auctionTimers.has(auctionId)) return;

      console.log(`[Auction] Starting countdown for auction ${auctionId}`);
      const timerData = { countdownInterval: null };

      timerData.countdownInterval = setInterval(async () => {
        try {
          const result = await pool.query(
            `SELECT a.countdown_end_time, a.status, a.highest_bidder_id, p.product_name 
             FROM auctions a
             JOIN product p ON a.product_id = p.product_id
             WHERE a.id = $1`,
            [auctionId]
          );

          if (result.rows.length === 0) {
            return cleanupAuctionRoom(auctionId);
          }

          const auction = result.rows[0];

          if (auction.status !== 'ACTIVE') {
            io.to(room).emit('auction_ended', { auctionId, status: auction.status, endReason: 'auction_completed' });
            return cleanupAuctionRoom(auctionId);
          }

          const endTime = new Date(auction.countdown_end_time);
          const now = new Date();
          const secondsRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
          
          // --- Ending Soon Notification ---
          if (secondsRemaining > 8 && secondsRemaining <= 10 && !notifiedForEndingSoon.has(auctionId) && auction.highest_bidder_id) {
            notifiedForEndingSoon.add(auctionId);
            const payload = {
                title: `Auction for "${auction.product_name}" is ending soon!`,
                body: 'You are the highest bidder. Place a bid to extend the time.',
                data: { url: `/auction/${auctionId}` }
            };
            sendPushNotification(auction.highest_bidder_id, payload, 'auction_enabled');
          }

          io.to(room).emit('countdown_update', { auctionId, secondsRemaining });

          if (secondsRemaining <= 0) {
            console.log(`[Auction] Countdown expired for auction ${auctionId}`);
            cleanupAuctionRoom(auctionId);

            const client = await pool.connect();
            try {
              await client.query('BEGIN');
              const auctionDetails = await client.query(
                `SELECT a.id, a.product_id, a.seller_id, a.highest_bidder_id, a.current_bid, p.product_name 
                 FROM auctions a
                 JOIN product p ON a.product_id = p.product_id
                 WHERE a.id = $1 AND a.status = 'ACTIVE' FOR UPDATE`,
                [auctionId]
              );

              if (auctionDetails.rows.length > 0) {
                const auctionData = auctionDetails.rows[0];
                await client.query(`UPDATE auctions SET status = 'ENDED', ended_at = CURRENT_TIMESTAMP WHERE id = $1`, [auctionId]);

                let orderId = null;
                let orderError = null;
                if (auctionData.highest_bidder_id) {
                  // --- Win Notification ---
                  const winPayload = {
                      title: `You won the auction for "${auctionData.product_name}"!`,
                      body: `Your winning bid was Rp ${Number(auctionData.current_bid).toLocaleString('id-ID')}. Check your orders.`,
                      data: { url: `/buyer/order-history` }
                  };
                  sendPushNotification(auctionData.highest_bidder_id, winPayload, 'auction_enabled');

                  const orderResult = await createOrderFromAuction(client, auctionData);
                  if (orderResult.success) {
                    orderId = orderResult.orderId;
                  } else {
                    orderError = orderResult.error;
                  }
                }
                
                await client.query('COMMIT');
                io.to(room).emit('auction_ended', { auctionId, status: 'ENDED', endReason: 'countdown_expired', winnerId: auctionData.highest_bidder_id, orderId, orderError });
              } else {
                await client.query('ROLLBACK');
              }
            } catch (dbError) {
              await client.query('ROLLBACK');
              console.error(`[Auction] Database error ending auction ${auctionId}:`, dbError);
              io.to(room).emit('auction_ended', { auctionId, status: 'ENDED', endReason: 'countdown_expired', error: 'Database error' });
            } finally {
              client.release();
            }
          }
        } catch (error) {
          console.error(`[Auction] Error in countdown loop for ${auctionId}:`, error);
        }
      }, 1000);

      auctionTimers.set(auctionId, timerData);
    } catch (error) {
      console.error(`[Auction] Error starting countdown for ${auctionId}:`, error);
    }
  }

  function cleanupAuctionRoom(auctionId) {
    if (auctionTimers.has(auctionId)) {
      const timerData = auctionTimers.get(auctionId);
      if (timerData.countdownInterval) {
        clearInterval(timerData.countdownInterval);
      }
      auctionTimers.delete(auctionId);
      notifiedForEndingSoon.delete(auctionId); // Clean up ending soon notification flag
    }
  }

  return () => {
    auctionTimers.forEach((timerData, auctionId) => {
      if (timerData.countdownInterval) {
        clearInterval(timerData.countdownInterval);
      }
      auctionTimers.delete(auctionId);
      notifiedForEndingSoon.delete(auctionId);
    });
  };
}

/**
 * Background job to start SCHEDULED auctions when their start_time arrives
 * Runs every 5 seconds to check for auctions that should be activated
 */
function startScheduledAuctionCheckJob(io) {
  console.log('[Auction] Starting scheduled auction check job...');
  
  const scheduledCheckInterval = setInterval(async () => {
    try {
      // Find all SCHEDULED auctions that should start now
      const result = await pool.query(
        `SELECT a.id, a.product_id, a.seller_id, a.start_time,
                p.product_name, u.name as seller_username
         FROM auctions a
         JOIN product p ON a.product_id = p.product_id
         JOIN "user" u ON a.seller_id = u.user_id
         WHERE a.status = 'SCHEDULED' 
         AND a.start_time <= CURRENT_TIMESTAMP
         AND a.deleted_at IS NULL
         ORDER BY a.start_time ASC`
      );

      if (result.rows.length > 0) {
        console.log(`[Auction] Found ${result.rows.length} auctions to start`);

        for (const auction of result.rows) {
          // Update auction to ACTIVE
          const updateResult = await pool.query(
            `UPDATE auctions 
             SET status = 'ACTIVE', 
                 started_at = CURRENT_TIMESTAMP,
                 countdown_end_time = NULL
             WHERE id = $1
             RETURNING *`,
            [auction.id]
          );

          if (updateResult.rows.length > 0) {
            console.log(`[Auction] Auction #${auction.id} (${auction.product_name}) started automatically`);
            
            // Broadcast to all connected clients that this auction is now active
            io.emit('auction_started', {
              auctionId: auction.id,
              status: 'ACTIVE',
              startedAt: new Date(),
              message: `Auction "${auction.product_name}" by ${auction.seller_username} is now live!`,
            });
            
            // Send to specific room
            const room = `auction_${auction.id}`;
            io.to(room).emit('auction_activated', {
              auctionId: auction.id,
              status: 'ACTIVE',
              startedAt: new Date(),
              countdownSeconds: 15,
            });
          }
        }
      }
    } catch (error) {
      console.error('[Auction] Error in scheduled auction check job:', error);
    }
  }, 5000); // Check every 5 seconds

  return () => clearInterval(scheduledCheckInterval);
}

/**
 * Background job to update auction statuses
 * Checks for ACTIVE auctions that have passed their countdown_end_time and marks them ENDED
 * Runs every 5 seconds to keep statuses in sync across all clients
 */
function startAuctionStatusUpdateJob(io) {
  console.log('[Auction] Starting auction status update job...');
  
  const statusUpdateInterval = setInterval(async () => {
    try {
      // Find all ACTIVE auctions that have passed their countdown_end_time
      const result = await pool.query(
        `SELECT a.id, a.highest_bidder_id, a.current_bid
         FROM auctions a
         WHERE a.status = 'ACTIVE' 
         AND a.countdown_end_time <= CURRENT_TIMESTAMP
         AND a.deleted_at IS NULL
         ORDER BY a.countdown_end_time ASC`
      );

      if (result.rows.length > 0) {
        console.log(`[Auction] Found ${result.rows.length} auctions that have expired`);

        for (const auction of result.rows) {
          // Update auction to ENDED
          const updateResult = await pool.query(
            `UPDATE auctions 
             SET status = 'ENDED', ended_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND status = 'ACTIVE'
             RETURNING *`,
            [auction.id]
          );

          if (updateResult.rows.length > 0) {
            console.log(`[Auction] Auction #${auction.id} marked as ENDED (status update job)`);
            
            // Try to create order if there's a winner
            let orderId = null;
            let orderError = null;
            if (auction.highest_bidder_id) {
              const client = await pool.connect();
              try {
                const orderResult = await createOrderFromAuction(client, auction);
                if (orderResult.success) {
                  orderId = orderResult.orderId;
                  console.log(`[Auction] Order #${orderId} created for auction #${auction.id}`);
                } else {
                  orderError = orderResult.error;
                  console.warn(`[Auction] Could not create order: ${orderError}`);
                }
              } finally {
                client.release();
              }
            }

            // Broadcast auction ended event
            io.emit('auction_ended_background', {
              auctionId: auction.id,
              status: 'ENDED',
              winnerId: auction.highest_bidder_id,
              finalBid: auction.current_bid,
              orderId: orderId,
              orderError: orderError,
              timestamp: new Date(),
            });
          }
        }
      }
    } catch (error) {
      console.error('[Auction] Error in auction status update job:', error);
    }
  }, 5000); // Check every 5 seconds

  return () => clearInterval(statusUpdateInterval);
}

/**
 * Initialize background jobs for auction system
 * Should be called once on server startup
 */
export function initializeAuctionJobs(io) {
  console.log('[Auction] Initializing auction background jobs...');
  
  // Start the scheduled auction check job
  const stopScheduledCheck = startScheduledAuctionCheckJob(io);
  
  // Start the auction status update job (check for expired countdowns)
  const stopStatusUpdate = startAuctionStatusUpdateJob(io);
  
  // Return cleanup function
  return () => {
    console.log('[Auction] Cleaning up auction background jobs...');
    stopScheduledCheck();
    stopStatusUpdate();
  };
}

export default registerAuctionEvents;
