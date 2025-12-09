import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// import webpush from 'web-push';
import auctionRoutes from './routes/auctionRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { registerAuctionEvents, initializeAuctionJobs } from './events/auctionEvents.js';
import { sendChatPushNotification } from './services/pushService.js';
import { socketAuthMiddleware } from './websocket-auth.js';
import pool from './db.js';
import pushRoutes from './routes/pushRoutes.js';

// Load environment variables
dotenv.config();

/*
// Configure web-push
const vapidDetails = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: 'mailto:admin@example.com'
};
webpush.setVapidDetails(vapidDetails.subject, vapidDetails.publicKey, vapidDetails.privateKey);
*/

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io with CORS configuration
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST'],
  },
  path: process.env.WEBSOCKET_PATH || '/socket.io',
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/node/health', (req, res) => {
  res.json({ status: 'Node.js backend is running', timestamp: new Date() });
});

// ============== ROUTES ==============
app.use('/api/node/auctions', auctionRoutes);
app.use('/api/node/chat', chatRoutes);
app.use('/api/node/admin', adminRoutes);
app.use('/api/node/push', pushRoutes);
// TODO (uncomment): Add other route modules here
// import authRoutes from './routes/auth.js';
// import pushRoutes from './routes/push.js';
// 
// app.use('/api/node/auth', authRoutes);
// app.use('/api/node/push', pushRoutes);


// ============== WEBSOCKET EVENTS ==============

// Register auction-related WebSocket events
const cleanupAuctionEvents = registerAuctionEvents(io);

// WebSocket connection handler for general events
io.on('connection', (socket) => {
  console.log(`[WebSocket] User connected to main namespace: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[WebSocket] User disconnected from main namespace: ${socket.id}`);
  });
});

// Create a dedicated, authenticated namespace for chat
const chatNamespace = io.of('/chat');

// Apply authentication middleware
chatNamespace.use(socketAuthMiddleware);

// Helper to get a socket ID for a given user ID within the chat namespace
function getUserSocketId(userId) {
    for (const [id, socket] of chatNamespace.sockets) {
        if (socket.userId === userId) {
            return id;
        }
    }
    return null;
}

// Handle connections to the '/chat' namespace
chatNamespace.on('connection', (socket) => {
  console.log(`[WebSocket CHAT] Authenticated user connected: ${socket.id}, UserID: ${socket.userId}, Role: ${socket.userRole}`);

  // Join a room based on the user's own ID to receive direct notifications
  socket.join(`user:${socket.userId}`);
  console.log(`[WebSocket CHAT] User ${socket.userId} joined their personal room: user:${socket.userId}`);

  // Event: Join Room
  // Spec: socket.emit('join_room', { storeId, buyerId })
  socket.on('join_room', async (data) => {
    console.log(`[WebSocket CHAT] Received 'join_room' event for user ${socket.userId}`, data);
    const { storeId, buyerId } = data;
    if (!storeId || !buyerId) {
      return socket.emit('error', { message: 'storeId and buyerId are required.' });
    }

    try {
      // Authorize: Check if the user is the buyer or the owner of the store
      let canAccess = false;
      if (socket.userRole === 'BUYER' && socket.userId === buyerId) {
        canAccess = true;
      } else if (socket.userRole === 'SELLER') {
        const { rows } = await pool.query('SELECT user_id FROM store WHERE store_id = $1', [storeId]);
        if (rows.length > 0 && rows[0].user_id === socket.userId) {
          canAccess = true;
        }
      }

      if (!canAccess) {
        return socket.emit('error', { message: 'Forbidden: You do not have access to this room.' });
      }

      // Join the room
      const roomName = `chat:${storeId}:${buyerId}`;
      socket.join(roomName);
      console.log(`[WebSocket CHAT] User ${socket.userId} joined room: ${roomName}`);

      // Confirm joining to the client
      socket.emit('joined_room', { roomId: roomName });

      
    } catch (err) {
      console.error(`[WebSocket CHAT] Error in join_room for user ${socket.userId}:`, err);
      socket.emit('error', { message: 'An internal error occurred while joining the room.' });
    }
  });

  // Event: Send Message
  // socket.emit('send_message', { storeId, buyerId, messageType, content, productId })
  socket.on('send_message', async (data) => {
    let { storeId, buyerId, messageType, content, productId } = data;
    const roomName = `chat:${storeId}:${buyerId}`;

    // Basic validation
    if (!storeId || !buyerId || !messageType || (!content && !productId)) {
      return socket.emit('error', { message: 'storeId, buyerId, messageType, and content/productId are required.' });
    }

    // Authorization: Check if user is in the room
    if (!socket.rooms.has(roomName)) {
      return socket.emit('error', { message: 'Forbidden: You must join the room before sending a message.' });
    }

    const dbClient = await pool.connect();
    try {
      // If it's an item preview, fetch product details and set as content
      if (messageType === 'item_preview' && productId) {
        const productQuery = 'SELECT product_id, product_name, price, main_image_path FROM product WHERE product_id = $1';
        const productResult = await dbClient.query(productQuery, [productId]);
        if (productResult.rows.length > 0) {
          content = JSON.stringify(productResult.rows[0]);
        } else {
          throw new Error(`Product with ID ${productId} not found.`);
        }
      }

      // Begin transaction
      await dbClient.query('BEGIN');

      // Insert new message
      const insertMessageQuery = `
        INSERT INTO chat_messages (store_id, buyer_id, sender_id, message_type, content, product_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const messageResult = await dbClient.query(insertMessageQuery, [
        storeId, buyerId, socket.userId, messageType, content, productId || null
      ]);
      const newMessage = messageResult.rows[0];

      // Update the chat_room's last message time and unread count
      const updateRoomQuery = `
        UPDATE chat_room
        SET last_message_at = NOW(), unread_count = unread_count + 1
        WHERE store_id = $1 AND buyer_id = $2;
      `;
      await dbClient.query(updateRoomQuery, [storeId, buyerId]);

      // Commit transaction
      await dbClient.query('COMMIT');

      // --- REVISED BROADCAST LOGIC ---
      const senderId = socket.userId;
      let recipientId;

      if (socket.userRole === 'BUYER') {
          // If sender is a buyer, the recipient is the seller who owns the store
          const storeOwnerQuery = await dbClient.query('SELECT user_id FROM store WHERE store_id = $1', [storeId]);
          recipientId = storeOwnerQuery.rows[0]?.user_id;
      } else { // Sender's role is 'SELLER'
          // If sender is a seller, the recipient is the buyer
          recipientId = buyerId;
      }

      // Broadcast the new message to both the sender and the recipient's personal rooms
      if (recipientId) {
        // We emit to both sender and recipient to ensure both their UIs update.
        chatNamespace.to(`user:${senderId}`).to(`user:${recipientId}`).emit('new_message', { message: newMessage });
        console.log(`[WebSocket CHAT] Message broadcasted to user:${senderId} and user:${recipientId}`);
      } else {
        console.error(`[WebSocket CHAT] Could not determine recipient for message in room chat:${storeId}:${buyerId}.`);
        // Fallback to old room-based emit if something went wrong
        chatNamespace.to(roomName).emit('new_message', { message: newMessage });
      }

      // (The old push notification logic that checked for active users in a room is no longer needed with this new broadcast approach)

      // PUSH NOTIFICATION LOGIC
      if (recipientId) {
          const recipientSocketId = getUserSocketId(recipientId);
          const isInRoom = recipientSocketId && chatNamespace.adapter.rooms.get(roomName)?.has(recipientSocketId);

          console.log(`[Push Check] Recipient: ${recipientId}, Socket: ${recipientSocketId}, InRoom: ${isInRoom}`);

          // Send push ONLY if recipient exists and is not in the room
          if (!isInRoom) {
              console.log(`[Push] Recipient ${recipientId} is not in the room. Sending push notification.`);
              try {
                  // Get sender's name for the notification
                  const { rows: senderRows } = await dbClient.query('SELECT name FROM "user" WHERE user_id = $1', [senderId]);
                  const senderName = senderRows.length > 0 ? senderRows[0].name : 'Someone';

                  const body = messageType === 'text' ? content.substring(0, 100) :
                               messageType === 'image' ? 'Sent you an image' :
                               messageType === 'item_preview' ? 'Sent you a product' :
                               'Sent you a message.';

                  sendChatPushNotification(recipientId, {
                      title: `New message from ${senderName}`,
                      body,
                      icon: '/icon.png',
                      data: {
                          type: 'chat',
                          url: `/chat`
                      }
                  }).catch(err => console.error('[Push Service Error]', err));

              } catch(pushError) {
                  console.error('[Push] Error during push notification preparation:', pushError);
              }
          }
      }

    } catch (err) {
      await dbClient.query('ROLLBACK');
      console.error(`[WebSocket CHAT] Error in send_message for user ${socket.userId}:`, err);
      socket.emit('error', { message: 'An internal error occurred while sending the message.' });
    } finally {
      dbClient.release();
    }
  });

  // Event: Typing Indicator
  // Spec: socket.emit('typing', { storeId, buyerId, isTyping: true })
  socket.on('typing', (data) => {
    const { storeId, buyerId, isTyping } = data;
    const roomName = `chat:${storeId}:${buyerId}`;

    if (!socket.rooms.has(roomName)) {
      return socket.emit('error', { message: 'Must join a room to send typing indicators.' });
    }

    // Broadcast to other user in the room
    socket.to(roomName).emit('user_typing', {
      userId: socket.userId,
      isTyping: isTyping
    });
  });

  // Event: Mark as Read
  // Spec: socket.emit('mark_read', { storeId, buyerId, messageIds: [] })
  socket.on('mark_read', async (data) => {
    const { storeId, buyerId } = data;
    const roomName = `chat:${storeId}:${buyerId}`;

    if (!socket.rooms.has(roomName)) {
      return socket.emit('error', { message: 'Must join a room to mark messages as read.' });
    }

    const dbClient = await pool.connect();
    try {
      await dbClient.query('BEGIN');

      // First, find the sender of the last message in this room.
      const lastMessageQuery = `
        SELECT sender_id FROM chat_messages 
        WHERE store_id = $1 AND buyer_id = $2 
        ORDER BY created_at DESC 
        LIMIT 1;
      `;
      const lastMessageRes = await dbClient.query(lastMessageQuery, [storeId, buyerId]);
      
      let proceedToMarkAsRead = true;
      if (lastMessageRes.rows.length > 0) {
        const lastSenderId = lastMessageRes.rows[0].sender_id;
        // If the person marking as read is the same person who sent the last message, do not reset the count.
        if (socket.userId === lastSenderId) {
          proceedToMarkAsRead = false;
        }
      }

      // Update messages to is_read = true, sent by the other party.
      const updateMessagesQuery = `
        UPDATE chat_messages
        SET is_read = true
        WHERE store_id = $1 AND buyer_id = $2 AND sender_id != $3 AND is_read = false
        RETURNING message_id;
      `;
      const res = await dbClient.query(updateMessagesQuery, [storeId, buyerId, socket.userId]);
      const readMessageIds = res.rows.map(r => r.message_id);

      // Only reset the room's unread count if the reader is the recipient.
      if (proceedToMarkAsRead) {
        const updateRoomQuery = `
          UPDATE chat_room
          SET unread_count = 0
          WHERE store_id = $1 AND buyer_id = $2;
        `;
        await dbClient.query(updateRoomQuery, [storeId, buyerId]);
      }
      
      await dbClient.query('COMMIT');

      // Broadcast to the room that messages were read
      chatNamespace.to(roomName).emit('messages_read', {
        messageIds: readMessageIds,
        readBy: socket.userId
      });

      console.log(`[WebSocket CHAT] Marked ${readMessageIds.length} messages as read in room ${roomName} by user ${socket.userId}`);

    } catch (err) {
      await dbClient.query('ROLLBACK');
      console.error(`[WebSocket CHAT] Error in mark_read for user ${socket.userId}:`, err);
      socket.emit('error', { message: 'An internal error occurred while marking messages as read.' });
    } finally {
      dbClient.release();
    }
  });

  // Event: Leave Room
  // Spec: socket.emit('leave_room', { storeId, buyerId })
  socket.on('leave_room', (data) => {
    const { storeId, buyerId } = data;
    if (storeId && buyerId) {
      const roomName = `chat:${storeId}:${buyerId}`;
      socket.leave(roomName);
      console.log(`[WebSocket CHAT] User ${socket.userId} left room: ${roomName}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`[WebSocket CHAT] User disconnected: ${socket.id}. Reason: ${reason}`);
  });

  // Error handling
  socket.on('error', (error) => {
    console.error(`[WebSocket CHAT] Socket error for ${socket.id}:`, error);
  });
});


// ============== ERROR HANDLING ==============

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date(),
  });
});

// ============== SERVER STARTUP ==============

const PORT = process.env.NODE_PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Nimonspedia Node.js Backend Ready    ║
╠════════════════════════════════════════╣
║ HTTP Server:  http://localhost:${PORT}     ║
║ WebSocket:    ws://localhost:${PORT}      ║
║ Environment:  ${process.env.NODE_ENV || 'development'}            ║
╚════════════════════════════════════════╝
  `);

  // Initialize background jobs for auction system
  const cleanupAuctionJobs = initializeAuctionJobs(io);
  console.log('[Startup] Auction background jobs initialized');
});

export { app, io };
