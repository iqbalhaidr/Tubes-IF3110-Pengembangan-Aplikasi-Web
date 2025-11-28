import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

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

// ============== ROUTES PLACEHOLDER ==============
// Import and use route modules here
// import authRoutes from './routes/auth.js';
// import adminRoutes from './routes/admin.js';
// import auctionRoutes from './routes/auction.js';
// import chatRoutes from './routes/chat.js';
// import pushRoutes from './routes/push.js';
// 
// app.use('/api/node/auth', authRoutes);
// app.use('/api/node/admin', adminRoutes);
// app.use('/api/node/auction', auctionRoutes);
// app.use('/api/node/chat', chatRoutes);
// app.use('/api/node/push', pushRoutes);

// ============== WEBSOCKET EVENTS ==============

// WebSocket connection handler
io.on('connection', (socket) => {
  console.log(`[WebSocket] User connected: ${socket.id}`);

  // Example: Join auction room
  socket.on('join_auction', (data) => {
    const { auctionId, userId } = data;
    const room = `auction_${auctionId}`;
    socket.join(room);
    console.log(`[WebSocket] User ${userId} joined auction ${auctionId}`);
    
    // Notify other users
    io.to(room).emit('user_joined', { userId, auctionId });
  });

  // Example: Join chat room
  socket.on('join_chat', (data) => {
    const { storeId, buyerId, userId } = data;
    const room = `chat_${storeId}_${buyerId}`;
    socket.join(room);
    console.log(`[WebSocket] User ${userId} joined chat room ${room}`);
  });

  // Example: Place bid
  socket.on('place_bid', (data) => {
    const { auctionId, bidAmount, userId } = data;
    const room = `auction_${auctionId}`;
    console.log(`[WebSocket] Bid placed: ${bidAmount} by user ${userId} in auction ${auctionId}`);
    
    // Broadcast to all clients in auction room
    io.to(room).emit('bid_placed', { userId, bidAmount, timestamp: new Date() });
  });

  // Example: Send chat message
  socket.on('send_message', (data) => {
    const { storeId, buyerId, message, userId } = data;
    const room = `chat_${storeId}_${buyerId}`;
    console.log(`[WebSocket] Message from ${userId}: ${message}`);
    
    // Broadcast to all clients in chat room
    io.to(room).emit('message_received', { userId, message, timestamp: new Date() });
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const { storeId, buyerId, userId } = data;
    const room = `chat_${storeId}_${buyerId}`;
    socket.to(room).emit('user_typing', { userId });
  });

  // Stop typing
  socket.on('stop_typing', (data) => {
    const { storeId, buyerId, userId } = data;
    const room = `chat_${storeId}_${buyerId}`;
    socket.to(room).emit('user_stop_typing', { userId });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`[WebSocket] User disconnected: ${socket.id}`);
  });

  // Error handling
  socket.on('error', (error) => {
    console.error(`[WebSocket] Socket error for ${socket.id}:`, error);
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
});

export { app, io };
