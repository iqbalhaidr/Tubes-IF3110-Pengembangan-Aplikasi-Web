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
 * JWT middleware for Express
 */
export const jwtMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token not found' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
};
