/**
 * Admin Middleware - JWT Authentication for Admin Routes
 * 
 * This middleware verifies JWT tokens specifically for admin users.
 * All admin API endpoints must pass through this middleware.
 * 
 * @module middleware/adminMiddleware
 */

import jwt from 'jsonwebtoken';

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

/**
 * Middleware to authenticate admin requests using JWT
 * 
 * Expects Authorization header in format: "Bearer <token>"
 * On success, attaches decoded admin info to req.admin
 * On failure, returns 401 Unauthorized
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
export const authenticateAdmin = (req, res, next) => {
    try {
        // Get authorization header
        const authHeader = req.headers['authorization'];

        // Check if header exists
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'Access denied. No authorization token provided.',
                code: 'NO_TOKEN'
            });
        }

        // Extract token from "Bearer <token>" format
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access denied. Invalid authorization header format.',
                code: 'INVALID_FORMAT'
            });
        }

        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if the token is for an admin
        if (decoded.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin privileges required.',
                code: 'NOT_ADMIN'
            });
        }

        // Attach admin info to request for use in route handlers
        req.admin = {
            adminId: decoded.adminId,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role
        };

        // Continue to next middleware/route handler
        next();

    } catch (error) {
        // Handle specific JWT errors
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Session expired. Please login again.',
                code: 'TOKEN_EXPIRED'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token. Please login again.',
                code: 'INVALID_TOKEN'
            });
        }

        // Log unexpected errors for debugging
        console.error('[Admin Auth Error]', error.message);

        return res.status(401).json({
            success: false,
            error: 'Authentication failed.',
            code: 'AUTH_FAILED'
        });
    }
};

/**
 * Helper function to generate JWT token for admin
 * Used in admin login controller
 * 
 * @param {Object} admin - Admin object from database
 * @param {number} admin.admin_id - Admin ID
 * @param {string} admin.email - Admin email
 * @param {string} admin.name - Admin name
 * @returns {string} JWT token
 */
export const generateAdminToken = (admin) => {
    const payload = {
        adminId: admin.admin_id,
        email: admin.email,
        name: admin.name,
        role: 'ADMIN'
    };

    // Token expires in 1 hour (3600 seconds) as per specification
    const expiresIn = parseInt(process.env.JWT_EXPIRE) || 3600;

    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export default authenticateAdmin;
