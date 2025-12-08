/**
 * useFeatureFlags Hook - Check Feature Flag Status from Frontend
 * 
 * Fetches feature flag status from the Node.js backend API.
 * Used to conditionally render or block access to features.
 * 
 * @module hooks/useFeatureFlags
 */

import { useState, useEffect, useCallback } from 'react';

// Feature flag constants
export const FEATURES = {
    CHECKOUT_ENABLED: 'checkout_enabled',
    CHAT_ENABLED: 'chat_enabled',
    AUCTION_ENABLED: 'auction_enabled'
};

// API endpoint for feature flags
const API_URL = '/api/node/admin/features/check';

/**
 * Hook to check feature flag status
 * 
 * @param {number|null} userId - Optional user ID for user-specific checks
 * @returns {Object} Feature flags state and methods
 */
export default function useFeatureFlags(userId = null) {
    const [flags, setFlags] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * Fetch feature flags from API
     */
    const fetchFlags = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const url = userId
                ? `${API_URL}?userId=${userId}`
                : API_URL;

            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch feature flags');
            }

            const data = await response.json();

            if (data.success && data.data?.features) {
                setFlags(data.data.features);
            } else {
                throw new Error(data.error || 'Invalid response');
            }
        } catch (err) {
            console.error('[useFeatureFlags] Error:', err);
            setError(err.message);
            // On error, default to all enabled (fail open)
            setFlags({
                [FEATURES.CHECKOUT_ENABLED]: { enabled: true },
                [FEATURES.CHAT_ENABLED]: { enabled: true },
                [FEATURES.AUCTION_ENABLED]: { enabled: true }
            });
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Fetch on mount and when userId changes
    useEffect(() => {
        fetchFlags();
    }, [fetchFlags]);

    /**
     * Check if a specific feature is enabled
     * @param {string} feature - Feature flag name
     * @returns {boolean}
     */
    const isEnabled = useCallback((feature) => {
        return flags[feature]?.enabled !== false;
    }, [flags]);

    /**
     * Get reason why a feature is disabled
     * @param {string} feature - Feature flag name
     * @returns {string|null}
     */
    const getDisabledReason = useCallback((feature) => {
        const flag = flags[feature];
        if (!flag || flag.enabled) return null;
        return flag.reason || 'This feature is currently unavailable.';
    }, [flags]);

    /**
     * Check if feature is globally disabled
     * @param {string} feature - Feature flag name
     * @returns {boolean}
     */
    const isGloballyDisabled = useCallback((feature) => {
        return flags[feature]?.isGlobal === true;
    }, [flags]);

    return {
        flags,
        loading,
        error,
        refetch: fetchFlags,
        isEnabled,
        getDisabledReason,
        isGloballyDisabled
    };
}

/**
 * Simple hook to check a single feature
 * @param {string} feature - Feature flag name
 * @param {number|null} userId - Optional user ID
 * @returns {{ enabled: boolean, loading: boolean, reason: string|null }}
 */
export function useFeatureEnabled(feature, userId = null) {
    const { flags, loading, error } = useFeatureFlags(userId);

    const enabled = flags[feature]?.enabled !== false;
    const reason = flags[feature]?.reason || null;
    const isGlobal = flags[feature]?.isGlobal || false;

    return { enabled, loading, error, reason, isGlobal };
}
