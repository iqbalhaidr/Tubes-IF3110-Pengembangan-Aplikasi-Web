/**
 * Admin Controller - Business Logic for Admin Operations
 * 
 * Handles all admin-related operations including:
 * - Admin authentication (login)
 * - User management (list, search, filter)
 * - User feature flags (view, update)
 * - Global feature flags (view, update)
 * 
 * @module controllers/adminController
 */

import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { generateAdminToken } from '../middleware/adminMiddleware.js';

/**
 * Admin Login
 * Authenticates admin using email and password, returns JWT token
 * 
 * @param {Request} req - Express request with email & password in body
 * @param {Response} res - Express response
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required.'
            });
        }

        // Find admin by email
        const result = await pool.query(
            'SELECT admin_id, email, password_hash, name FROM admin WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        // Check if admin exists
        if (result.rows.length === 0) {
            // Generic error message for security (don't reveal if email exists)
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password.'
            });
        }

        const admin = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password.'
            });
        }

        // Generate JWT token
        const token = generateAdminToken(admin);

        // Return success with token
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                admin: {
                    id: admin.admin_id,
                    email: admin.email,
                    name: admin.name
                },
                expiresIn: parseInt(process.env.JWT_EXPIRE) || 3600
            }
        });

    } catch (error) {
        console.error('[Admin Login Error]', error.message);
        res.status(500).json({
            success: false,
            error: 'An error occurred during login. Please try again.'
        });
    }
};

/**
 * Get Current Admin Info
 * Returns the authenticated admin's information
 * 
 * @param {Request} req - Express request with admin info from middleware
 * @param {Response} res - Express response
 */
export const getMe = async (req, res) => {
    try {
        // Admin info is already attached by middleware
        res.json({
            success: true,
            data: {
                id: req.admin.adminId,
                email: req.admin.email,
                name: req.admin.name,
                role: req.admin.role
            }
        });
    } catch (error) {
        console.error('[Get Admin Info Error]', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve admin information.'
        });
    }
};

/**
 * Get All Users
 * Returns paginated list of users with search and filter support
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - search: Search term for name/email
 * - role: Filter by role (BUYER/SELLER)
 * 
 * @param {Request} req - Express request with query params
 * @param {Response} res - Express response
 */
export const getUsers = async (req, res) => {
    try {
        // Parse query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search?.trim() || '';
        const role = req.query.role?.toUpperCase() || '';

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Build dynamic query with filters
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        // Add search filter (name or email)
        if (search) {
            whereClause += ` AND (LOWER(u.name) LIKE $${paramIndex} OR LOWER(u.email) LIKE $${paramIndex})`;
            params.push(`%${search.toLowerCase()}%`);
            paramIndex++;
        }

        // Add role filter
        if (role && (role === 'BUYER' || role === 'SELLER')) {
            whereClause += ` AND u.role = $${paramIndex}`;
            params.push(role);
            paramIndex++;
        }

        // Get total count for pagination
        const countQuery = `
      SELECT COUNT(*) as total 
      FROM "user" u 
      ${whereClause}
    `;
        const countResult = await pool.query(countQuery, params);
        const totalItems = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalItems / limit);

        // Get users with pagination
        const usersQuery = `
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.balance,
        u.created_at as registration_date
      FROM "user" u 
      ${whereClause}
      ORDER BY u.user_id ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

        const usersResult = await pool.query(usersQuery, [...params, limit, offset]);

        res.json({
            success: true,
            data: {
                users: usersResult.rows,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems,
                    itemsPerPage: limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error('[Get Users Error]', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve users.'
        });
    }
};

/**
 * Get User Feature Flags
 * Returns all feature flags for a specific user
 * 
 * @param {Request} req - Express request with user ID in params
 * @param {Response} res - Express response
 */
export const getUserFlags = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid user ID.'
            });
        }

        // Check if user exists
        const userResult = await pool.query(
            'SELECT user_id, name, email FROM "user" WHERE user_id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found.'
            });
        }

        // Get user's feature flags
        const flagsResult = await pool.query(`
      SELECT 
        feature_flag,
        access_enabled,
        disable_reason,
        disabled_at
      FROM user_feature_access 
      WHERE user_id = $1
    `, [userId]);

        // Define all possible flags with defaults
        const allFlags = ['auction_enabled', 'chat_enabled', 'checkout_enabled'];
        const userFlags = {};

        // Initialize all flags as enabled (default)
        allFlags.forEach(flag => {
            userFlags[flag] = {
                enabled: true,
                reason: null,
                disabledAt: null
            };
        });

        // Override with actual user flags
        flagsResult.rows.forEach(row => {
            userFlags[row.feature_flag] = {
                enabled: row.access_enabled,
                reason: row.disable_reason,
                disabledAt: row.disabled_at
            };
        });

        res.json({
            success: true,
            data: {
                user: userResult.rows[0],
                flags: userFlags
            }
        });

    } catch (error) {
        console.error('[Get User Flags Error]', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve user feature flags.'
        });
    }
};

/**
 * Update User Feature Flags
 * Enables/disables specific features for a user
 * 
 * Body params:
 * - flags: Object with feature_flag: { enabled: boolean, reason?: string }
 * 
 * @param {Request} req - Express request with user ID and flags
 * @param {Response} res - Express response
 */
export const updateUserFlags = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { flags } = req.body;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid user ID.'
            });
        }

        if (!flags || typeof flags !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Flags object is required.'
            });
        }

        // Check if user exists
        const userResult = await pool.query(
            'SELECT user_id FROM "user" WHERE user_id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found.'
            });
        }

        // Validate and update each flag
        const validFlags = ['auction_enabled', 'chat_enabled', 'checkout_enabled'];
        const updates = [];

        for (const [flagName, flagData] of Object.entries(flags)) {
            if (!validFlags.includes(flagName)) {
                continue; // Skip invalid flag names
            }

            const enabled = flagData.enabled;
            const reason = flagData.reason || null;

            // Validate reason requirement when disabling
            if (!enabled && (!reason || reason.trim().length < 10)) {
                return res.status(400).json({
                    success: false,
                    error: `Reason is required (minimum 10 characters) when disabling ${flagName}.`
                });
            }

            // Upsert the flag
            await pool.query(`
        INSERT INTO user_feature_access (user_id, feature_flag, access_enabled, disable_reason, disabled_at, disabled_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, feature_flag) 
        DO UPDATE SET 
          access_enabled = $3,
          disable_reason = CASE WHEN $3 = false THEN $4 ELSE NULL END,
          disabled_at = CASE WHEN $3 = false THEN $5 ELSE NULL END,
          disabled_by = CASE WHEN $3 = false THEN $6 ELSE NULL END
      `, [
                userId,
                flagName,
                enabled,
                enabled ? null : reason.trim(),
                enabled ? null : new Date(),
                enabled ? null : req.admin.adminId
            ]);

            updates.push({ flag: flagName, enabled });
        }

        res.json({
            success: true,
            message: 'Feature flags updated successfully.',
            data: { updates }
        });

    } catch (error) {
        console.error('[Update User Flags Error]', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to update user feature flags.'
        });
    }
};

/**
 * Get Global Feature Flags
 * Returns all global/system-wide feature flags
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export const getGlobalFlags = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        feature_flag,
        is_enabled,
        disable_reason,
        updated_at
      FROM global_feature_flags
      ORDER BY feature_flag
    `);

        // Convert to object for easier frontend use
        const flags = {};
        result.rows.forEach(row => {
            flags[row.feature_flag] = {
                enabled: row.is_enabled,
                reason: row.disable_reason,
                updatedAt: row.updated_at
            };
        });

        res.json({
            success: true,
            data: { flags }
        });

    } catch (error) {
        console.error('[Get Global Flags Error]', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve global feature flags.'
        });
    }
};

/**
 * Update Global Feature Flags
 * Enables/disables global features (affects all users)
 * 
 * Body params:
 * - flags: Object with feature_flag: { enabled: boolean, reason?: string }
 * 
 * @param {Request} req - Express request with flags
 * @param {Response} res - Express response
 */
export const updateGlobalFlags = async (req, res) => {
    try {
        const { flags } = req.body;

        if (!flags || typeof flags !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Flags object is required.'
            });
        }

        const validFlags = ['auction_enabled', 'chat_enabled', 'checkout_enabled'];
        const updates = [];

        for (const [flagName, flagData] of Object.entries(flags)) {
            if (!validFlags.includes(flagName)) {
                continue; // Skip invalid flag names
            }

            const enabled = flagData.enabled;
            const reason = flagData.reason || null;

            // Validate reason requirement when disabling (min 20 chars for global)
            if (!enabled && (!reason || reason.trim().length < 20)) {
                return res.status(400).json({
                    success: false,
                    error: `Reason is required (minimum 20 characters) when disabling ${flagName} globally.`
                });
            }

            // Update the global flag
            await pool.query(`
        UPDATE global_feature_flags
        SET 
          is_enabled = $1,
          disable_reason = $2,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $3
        WHERE feature_flag = $4
      `, [
                enabled,
                enabled ? null : reason.trim(),
                req.admin.adminId,
                flagName
            ]);

            updates.push({ flag: flagName, enabled });
        }

        res.json({
            success: true,
            message: 'Global feature flags updated successfully.',
            data: { updates }
        });

    } catch (error) {
        console.error('[Update Global Flags Error]', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to update global feature flags.'
        });
    }
};

/**
 * Check Feature Access (Public endpoint - no auth required)
 * Used by PHP and frontend to check if features are enabled
 * 
 * Query params:
 * - userId: Optional user ID to check user-specific flags
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export const checkFeatureAccess = async (req, res) => {
    try {
        const userId = req.query.userId ? parseInt(req.query.userId) : null;

        // Get global flags
        const globalResult = await pool.query(`
      SELECT feature_flag, is_enabled, disable_reason
      FROM global_feature_flags
    `);

        const features = {};

        // Initialize with global flags
        globalResult.rows.forEach(row => {
            features[row.feature_flag] = {
                enabled: row.is_enabled,
                reason: row.is_enabled ? null : 'This feature is currently under maintenance.',
                isGlobal: !row.is_enabled
            };
        });

        // If userId provided, check user-specific flags
        if (userId) {
            const userResult = await pool.query(`
        SELECT feature_flag, access_enabled, disable_reason
        FROM user_feature_access
        WHERE user_id = $1
      `, [userId]);

            userResult.rows.forEach(row => {
                // User flag overrides only if it's more restrictive
                if (!row.access_enabled) {
                    features[row.feature_flag] = {
                        enabled: false,
                        reason: row.disable_reason || 'This feature has been disabled for your account.',
                        isGlobal: false
                    };
                }
            });
        }

        res.json({
            success: true,
            data: { features }
        });

    } catch (error) {
        console.error('[Check Feature Access Error]', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to check feature access.'
        });
    }
};
