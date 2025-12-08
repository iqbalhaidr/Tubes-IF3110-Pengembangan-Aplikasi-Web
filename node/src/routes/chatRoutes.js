import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const router = express.Router();

// Setup for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads/chat');

// Create upload directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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

// Middleware to require authentication
const authMiddleware = requireAuth;

/**
 * GET /api/node/chat/rooms
 * Get all chat rooms for the current user
 */
router.get('/rooms', authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const userRole = req.user.role;

    try {
        let query;
        let params;

        if (userRole === 'BUYER') {
            // Buyer sees rooms where they are the buyer
            query = `
                SELECT 
                    cr.store_id, 
                    cr.buyer_id, 
                    cr.last_message_at,
                    cr.unread_count,
                    s.store_name,
                    s.store_logo_path as store_logo,
                    u.name as other_username,
                    (SELECT content FROM chat_messages cm 
                     WHERE cm.store_id = cr.store_id AND cm.buyer_id = cr.buyer_id 
                     ORDER BY cm.created_at DESC LIMIT 1) as last_message_preview
                FROM chat_room cr
                JOIN store s ON cr.store_id = s.store_id
                JOIN "user" u ON s.user_id = u.user_id
                WHERE cr.buyer_id = $1
                ORDER BY cr.last_message_at DESC NULLS LAST
            `;
            params = [userId];
        } else {
            // Seller sees rooms for their store(s)
            query = `
                SELECT 
                    cr.store_id, 
                    cr.buyer_id, 
                    cr.last_message_at,
                    cr.unread_count,
                    s.store_name,
                    u.name as other_username,
                    NULL as buyer_avatar,
                    (SELECT content FROM chat_messages cm 
                     WHERE cm.store_id = cr.store_id AND cm.buyer_id = cr.buyer_id 
                     ORDER BY cm.created_at DESC LIMIT 1) as last_message_preview
                FROM chat_room cr
                JOIN store s ON cr.store_id = s.store_id
                JOIN "user" u ON cr.buyer_id = u.user_id
                WHERE s.user_id = $1
                ORDER BY cr.last_message_at DESC NULLS LAST
            `;
            params = [userId];
        }

        const result = await pool.query(query, params);

        res.json({
            status: 'success',
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching chat rooms:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch chat rooms'
        });
    }
});

/**
 * POST /api/node/chat/rooms
 * Create a new chat room or get existing one
 */
router.post('/rooms', authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { store_id } = req.body;

    if (userRole !== 'BUYER') {
        return res.status(403).json({
            status: 'error',
            message: 'Only buyers can initiate chat rooms'
        });
    }

    if (!store_id) {
        return res.status(400).json({
            status: 'error',
            message: 'store_id is required'
        });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if room already exists
        const existingRoom = await client.query(
            'SELECT * FROM chat_room WHERE store_id = $1 AND buyer_id = $2',
            [store_id, userId]
        );

        if (existingRoom.rows.length > 0) {
            await client.query('COMMIT');

            // Fetch full room details
            const roomDetails = await client.query(`
                SELECT 
                    cr.store_id, 
                    cr.buyer_id, 
                    cr.last_message_at,
                    cr.unread_count,
                    s.store_name,
                    s.store_logo_path as store_logo,
                    u.name as other_username
                FROM chat_room cr
                JOIN store s ON cr.store_id = s.store_id
                JOIN "user" u ON s.user_id = u.user_id
                WHERE cr.store_id = $1 AND cr.buyer_id = $2
            `, [store_id, userId]);

            return res.json({
                status: 'success',
                data: roomDetails.rows[0]
            });
        }

        // Create new room
        await client.query(
            'INSERT INTO chat_room (store_id, buyer_id, unread_count) VALUES ($1, $2, 0)',
            [store_id, userId]
        );

        await client.query('COMMIT');

        // Fetch the newly created room with details
        const roomDetails = await client.query(`
            SELECT 
                cr.store_id, 
                cr.buyer_id, 
                cr.last_message_at,
                cr.unread_count,
                s.store_name,
                s.store_logo_path as store_logo,
                u.name as other_username
            FROM chat_room cr
            JOIN store s ON cr.store_id = s.store_id
            JOIN "user" u ON s.user_id = u.user_id
            WHERE cr.store_id = $1 AND cr.buyer_id = $2
        `, [store_id, userId]);

        res.status(201).json({
            status: 'success',
            data: roomDetails.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating chat room:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create chat room'
        });
    } finally {
        client.release();
    }
});

/**
 * GET /api/node/chat/rooms/:storeId/:buyerId/messages
 * Get messages for a specific chat room
 */
router.get('/rooms/:storeId/:buyerId/messages', authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { storeId, buyerId } = req.params;
    const { limit = 50, before } = req.query;

    try {
        // Verify user has access to this room
        let hasAccess = false;

        if (userRole === 'BUYER' && parseInt(buyerId) === userId) {
            hasAccess = true;
        } else if (userRole === 'SELLER') {
            const storeCheck = await pool.query(
                'SELECT 1 FROM store WHERE store_id = $1 AND user_id = $2',
                [storeId, userId]
            );
            hasAccess = storeCheck.rows.length > 0;
        }

        if (!hasAccess) {
            return res.status(403).json({
                status: 'error',
                message: 'You do not have access to this chat room'
            });
        }

        let query = `
            SELECT 
                cm.message_id,
                cm.store_id,
                cm.buyer_id,
                cm.sender_id,
                cm.message_type,
                cm.content,
                cm.product_id,
                cm.is_read,
                cm.created_at,
                u.name as sender_username
            FROM chat_messages cm
            JOIN "user" u ON cm.sender_id = u.user_id
            WHERE cm.store_id = $1 AND cm.buyer_id = $2
        `;
        const params = [storeId, buyerId];

        if (before) {
            query += ` AND cm.created_at < $3`;
            params.push(before);
        }

        query += ` ORDER BY cm.created_at DESC LIMIT $${params.length + 1}`;
        params.push(parseInt(limit));

        const result = await pool.query(query, params);

        res.json({
            status: 'success',
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch messages'
        });
    }
});

/**
 * POST /api/node/chat/upload-image
 * Upload an image for chat
 */
router.post('/upload-image', authMiddleware, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            status: 'error',
            message: 'No image file provided'
        });
    }

    // Return the URL path for the uploaded image
    const imageUrl = `/api/node/chat/images/${req.file.filename}`;

    res.json({
        status: 'success',
        data: {
            url: imageUrl,
            filename: req.file.filename
        }
    });
});

/**
 * GET /api/node/chat/images/:filename
 * Serve uploaded chat images
 */
router.get('/images/:filename', (req, res) => {
    const { filename } = req.params;
    const imagePath = path.join(uploadDir, filename);

    if (!fs.existsSync(imagePath)) {
        return res.status(404).json({
            status: 'error',
            message: 'Image not found'
        });
    }

    res.sendFile(imagePath);
});

export default router;
