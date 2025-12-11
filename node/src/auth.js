// JWT Authentication utilities for Node.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const JWT_EXPIRE = process.env.JWT_EXPIRE || 3600;

/**
 * Generate JWT token for admin
 * @param {number} userId - Admin user ID
 * @param {string} email - Admin email
 * @returns {string} JWT token
 */
export const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email, role: 'ADMIN' },
    JWT_SECRET,
    { expiresIn: parseInt(JWT_EXPIRE) }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {object|null} Decoded token or null if invalid
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('[JWT Error]', error.message);
    return null;
  }
};

/**
 * Verify PHP session by calling PHP backend
 * @param {string} cookies - Cookie header string
 * @returns {Promise<object|null>} User object or null if invalid
 */
const verifyPHPSession = async (cookies) => {
  try {
    // Call PHP /auth/me endpoint to verify session
    const response = await fetch('http://php/auth/me', {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.success && data.data) {
      const user = {
        id: data.data.user_id,
        userId: data.data.user_id,
        email: data.data.email,
        name: data.data.name,
        role: data.data.role,
      };
      // Include store_id if user is a seller
      if (data.data.store_id) {
        user.store_id = data.data.store_id;
      }
      return user;
    }
    return null;
  } catch (error) {
    console.error('[PHP Session Verification Error]', error.message);
    return null;
  }
};

/**
 * JWT middleware for Express - supports both JWT tokens and PHP sessions
 */
export const jwtMiddleware = async (req, res, next) => {
  // First, try JWT token authentication
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
      return next();
    }
  }

  // Fall back to PHP session authentication
  const cookies = req.headers.cookie;
  if (cookies) {
    const user = await verifyPHPSession(cookies);
    if (user) {
      req.user = user;
      return next();
    }
  }

  return res.status(401).json({ error: 'Unauthorized - No valid token or session' });
};

// Alias for backward compatibility
export const authenticateToken = jwtMiddleware;
export const requireAuth = jwtMiddleware;
