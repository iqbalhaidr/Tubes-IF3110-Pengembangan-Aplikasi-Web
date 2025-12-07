/**
 * Feature Flag Middleware for Node.js
 * 
 * Provides server-side enforcement of feature flags.
 * Checks both global flags and user-specific flags.
 * 
 * Usage:
 *   import { requireFeature, checkFeatureAccess } from './middleware/featureFlagMiddleware.js';
 *   router.post('/bid', authenticateToken, requireFeature('auction_enabled'), handler);
 * 
 * @module middleware/featureFlagMiddleware
 */

import pool from '../db.js';

// Valid feature flags
export const FEATURES = {
    CHECKOUT_ENABLED: 'checkout_enabled',
    CHAT_ENABLED: 'chat_enabled',
    AUCTION_ENABLED: 'auction_enabled'
};

/**
 * Check if a feature is enabled for a specific user
 * Checks both global flags and user-specific flags
 * 
 * @param {string} featureFlag - Feature flag name (e.g., 'auction_enabled')
 * @param {number|null} userId - Optional user ID for user-specific checks
 * @returns {Promise<{enabled: boolean, reason: string|null, isGlobal: boolean}>}
 */
export async function checkFeatureAccess(featureFlag, userId = null) {
    try {
        // 1. Check global feature flag first
        const globalResult = await pool.query(
            `SELECT is_enabled, disable_reason 
       FROM global_feature_flags 
       WHERE feature_flag = $1`,
            [featureFlag]
        );

        // If global flag exists and is disabled, return immediately
        if (globalResult.rows.length > 0 && !globalResult.rows[0].is_enabled) {
            return {
                enabled: false,
                reason: 'This feature is currently under maintenance.',
                isGlobal: true
            };
        }

        // 2. If userId provided, check user-specific flag
        if (userId !== null) {
            const userResult = await pool.query(
                `SELECT access_enabled, disable_reason 
         FROM user_feature_access 
         WHERE user_id = $1 AND feature_flag = $2`,
                [userId, featureFlag]
            );

            // If user has specific restriction
            if (userResult.rows.length > 0 && !userResult.rows[0].access_enabled) {
                return {
                    enabled: false,
                    reason: userResult.rows[0].disable_reason || 'This feature has been disabled for your account.',
                    isGlobal: false
                };
            }
        }

        // Feature is enabled
        return {
            enabled: true,
            reason: null,
            isGlobal: false
        };

    } catch (error) {
        console.error(`[FeatureFlag] Error checking ${featureFlag}:`, error);
        // On error, allow access (fail open) but log it
        return {
            enabled: true,
            reason: null,
            isGlobal: false,
            error: error.message
        };
    }
}

/**
 * Middleware factory to require a feature flag to be enabled
 * Use this in route definitions
 * 
 * @param {string} featureFlag - Feature flag name
 * @returns {Function} Express middleware function
 */
export function requireFeature(featureFlag) {
    return async (req, res, next) => {
        try {
            // Get user ID from request (set by authenticateToken middleware)
            const userId = req.user?.id || null;

            const result = await checkFeatureAccess(featureFlag, userId);

            if (!result.enabled) {
                // Map feature flags to user-friendly names
                const featureNames = {
                    'checkout_enabled': 'Checkout',
                    'chat_enabled': 'Chat',
                    'auction_enabled': 'Auction'
                };

                const featureName = featureNames[featureFlag] || featureFlag;

                // Build error message
                const message = result.isGlobal
                    ? `${featureName} is currently unavailable due to maintenance. Please try again later.`
                    : `${featureName} is not available for your account. ${result.reason ? `Reason: ${result.reason}` : ''}`;

                return res.status(403).json({
                    success: false,
                    error: message,
                    featureDisabled: true,
                    feature: featureFlag,
                    isGlobal: result.isGlobal
                });
            }

            next();
        } catch (error) {
            console.error(`[FeatureFlag] Middleware error for ${featureFlag}:`, error);
            // On error, allow access but log (fail open)
            next();
        }
    };
}

/**
 * Check feature access for Socket.io events
 * Returns error object if disabled, null if enabled
 * 
 * @param {string} featureFlag - Feature flag name
 * @param {number|null} userId - User ID
 * @returns {Promise<{code: string, message: string}|null>}
 */
export async function checkFeatureForSocket(featureFlag, userId = null) {
    const result = await checkFeatureAccess(featureFlag, userId);

    if (!result.enabled) {
        const featureNames = {
            'checkout_enabled': 'Checkout',
            'chat_enabled': 'Chat',
            'auction_enabled': 'Auction'
        };

        const featureName = featureNames[featureFlag] || featureFlag;

        return {
            code: 'FEATURE_DISABLED',
            message: result.isGlobal
                ? `${featureName} is currently unavailable due to maintenance.`
                : `${featureName} is not available for your account. ${result.reason || ''}`,
            isGlobal: result.isGlobal
        };
    }

    return null;
}

export default {
    checkFeatureAccess,
    requireFeature,
    checkFeatureForSocket,
    FEATURES
};
