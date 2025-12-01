import { pool } from '../db.js';

export function registerAuctionEvents(io) {
  // Track active auction countdowns
  const activeCountdowns = new Map();
  const auctionTimers = new Map();

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

        // Validate bid data
        if (!auctionId || !userId || !bidAmount) {
          socket.emit('auction_error', {
            code: 'INVALID_BID',
            message: 'Missing required bid data',
          });
          return;
        }

        // BUG-012 FIX: Persist bid to database with transaction
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          // Get current auction state with lock
          const auctionResult = await client.query(
            `SELECT id, current_bid, min_bid_increment, status, countdown_end_time 
             FROM auctions WHERE id = $1 FOR UPDATE`,
            [auctionId]
          );

          if (auctionResult.rows.length === 0) {
            await client.query('ROLLBACK');
            socket.emit('auction_error', {
              code: 'AUCTION_NOT_FOUND',
              message: 'Auction not found',
            });
            return;
          }

          const auction = auctionResult.rows[0];

          // Validate auction is active
          if (auction.status !== 'ACTIVE') {
            await client.query('ROLLBACK');
            socket.emit('auction_error', {
              code: 'AUCTION_NOT_ACTIVE',
              message: 'Auction is no longer active',
            });
            return;
          }

          // Validate bid amount
          const minBid = auction.current_bid + auction.min_bid_increment;
          if (bidAmount < minBid) {
            await client.query('ROLLBACK');
            socket.emit('auction_error', {
              code: 'BID_TOO_LOW',
              message: `Bid must be at least ${minBid}`,
            });
            return;
          }

          // Insert bid record
          await client.query(
            `INSERT INTO auction_bids (auction_id, bidder_id, bid_amount) 
             VALUES ($1, $2, $3)`,
            [auctionId, userId, bidAmount]
          );

          // Update auction with new highest bid and reset countdown
          const newEndTime = new Date(Date.now() + 15000); // 15 seconds from now
          await client.query(
            `UPDATE auctions 
             SET current_bid = $1, highest_bidder_id = $2, countdown_end_time = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [bidAmount, userId, newEndTime, auctionId]
          );

          await client.query('COMMIT');

          console.log(
            `[Auction] Bid placed and saved: $${bidAmount} by user ${userId} in auction ${auctionId}`
          );

          if (auctionTimers.has(auctionId)) {
            auctionTimers.get(auctionId).lastBidTime = Date.now();
          }

          // Broadcast bid to all users in auction room
          io.to(room).emit('bid_placed', {
            userId,
            bidAmount,
            auctionId,
            timestamp: new Date(),
            countdownReset: true,
            newEndTime: newEndTime.toISOString(),
          });

          // Notify only this socket of successful bid
          socket.emit('bid_success', {
            bidAmount,
            message: 'Your bid has been placed successfully',
          });
        } catch (dbError) {
          await client.query('ROLLBACK');
          console.error('[Auction] Database error in place_bid:', dbError);
          socket.emit('auction_error', {
            code: 'DB_ERROR',
            message: 'Failed to save bid',
          });
        } finally {
          client.release();
        }
      } catch (error) {
        console.error('[Auction] Error in place_bid:', error);
        socket.emit('auction_error', {
          code: 'BID_FAILED',
          message: error.message,
        });
      }
    });

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
      if (auctionTimers.has(auctionId)) {
        return; // Already running
      }

      console.log(`[Auction] Starting countdown for auction ${auctionId}`);

      const timerData = {
        lastBidTime: Date.now(),
        countdownInterval: null,
      };

      timerData.countdownInterval = setInterval(async () => {
        try {
          const result = await pool.query(
            `SELECT countdown_end_time, status FROM auctions WHERE id = $1`,
            [auctionId]
          );

          if (result.rows.length === 0) {
            clearInterval(timerData.countdownInterval);
            auctionTimers.delete(auctionId);
            return;
          }

          const auction = result.rows[0];

          // If auction ended, cleanup
          if (auction.status !== 'ACTIVE') {
            io.to(room).emit('auction_ended', {
              auctionId,
              status: auction.status,
              endReason: 'auction_completed',
              timestamp: new Date(),
            });
            clearInterval(timerData.countdownInterval);
            auctionTimers.delete(auctionId);
            return;
          }

          // Calculate remaining seconds
          const endTime = new Date(auction.countdown_end_time);
          const now = new Date();
          const secondsRemaining = Math.max(0, Math.floor((endTime - now) / 1000));

          // Broadcast countdown tick
          io.to(room).emit('countdown_update', {
            auctionId,
            secondsRemaining,
            timestamp: new Date(),
          });

          // If countdown expires
          if (secondsRemaining <= 0) {
            console.log(`[Auction] Countdown expired for auction ${auctionId}`);

            // End auction in database
            await pool.query(
              `UPDATE auctions 
               SET status = 'ENDED', ended_at = CURRENT_TIMESTAMP
               WHERE id = $1 AND status = 'ACTIVE'`,
              [auctionId]
            );

            io.to(room).emit('auction_ended', {
              auctionId,
              status: 'ENDED',
              endReason: 'countdown_expired',
              timestamp: new Date(),
            });

            clearInterval(timerData.countdownInterval);
            auctionTimers.delete(auctionId);
          }
        } catch (error) {
          console.error(`[Auction] Error in countdown loop for ${auctionId}:`, error);
        }
      }, 1000); // Update every second

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
    }
  }

  return () => {
    auctionTimers.forEach((timerData) => {
      if (timerData.countdownInterval) {
        clearInterval(timerData.countdownInterval);
      }
    });
    auctionTimers.clear();
  };
}

export default registerAuctionEvents;
