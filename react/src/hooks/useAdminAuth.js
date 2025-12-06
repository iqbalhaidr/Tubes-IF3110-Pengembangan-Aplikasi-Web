/**
 * useAdminAuth Hook - Admin Authentication Management
 * 
 * Provides admin authentication state and methods.
 * Handles JWT token storage, validation, and auto-refresh.
 * 
 * @module hooks/useAdminAuth
 */

import { useState, useEffect, useCallback } from 'react';

// Constants
const TOKEN_KEY = 'admin_token';
const ADMIN_KEY = 'admin_info';
const API_BASE = '/api/node/admin';

/**
 * Custom hook for admin authentication
 * 
 * @returns {Object} Auth state and methods
 */
export default function useAdminAuth() {
    // State
    const [admin, setAdmin] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * Get stored token from localStorage
     */
    const getToken = useCallback(() => {
        return localStorage.getItem(TOKEN_KEY);
    }, []);

    /**
     * Store token and admin info in localStorage
     */
    const storeAuth = useCallback((token, adminInfo) => {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(ADMIN_KEY, JSON.stringify(adminInfo));
    }, []);

    /**
     * Clear stored authentication data
     */
    const clearAuth = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ADMIN_KEY);
        setAdmin(null);
        setIsAuthenticated(false);
    }, []);

    /**
     * Verify current token with backend
     */
    const verifyToken = useCallback(async () => {
        const token = getToken();

        if (!token) {
            setIsAuthenticated(false);
            setIsLoading(false);
            return false;
        }

        try {
            const response = await fetch(`${API_BASE}/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setAdmin(data.data);
                    setIsAuthenticated(true);
                    setIsLoading(false);
                    return true;
                }
            }

            // Token invalid or expired
            clearAuth();
            setIsLoading(false);
            return false;

        } catch (err) {
            console.error('[Admin Auth] Token verification failed:', err);
            clearAuth();
            setIsLoading(false);
            return false;
        }
    }, [getToken, clearAuth]);

    /**
     * Login with email and password
     * 
     * @param {string} email - Admin email
     * @param {string} password - Admin password
     * @returns {Promise<boolean>} Success status
     */
    const login = useCallback(async (email, password) => {
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const { token, admin: adminInfo } = data.data;
                storeAuth(token, adminInfo);
                setAdmin(adminInfo);
                setIsAuthenticated(true);
                setIsLoading(false);
                return { success: true };
            }

            // Login failed
            setError(data.error || 'Login failed. Please check your credentials.');
            setIsLoading(false);
            return { success: false, error: data.error };

        } catch (err) {
            console.error('[Admin Auth] Login error:', err);
            setError('Network error. Please check your connection.');
            setIsLoading(false);
            return { success: false, error: 'Network error' };
        }
    }, [storeAuth]);

    /**
     * Logout admin - clear all auth data
     */
    const logout = useCallback(() => {
        clearAuth();
        setError(null);
    }, [clearAuth]);

    /**
     * Make authenticated API request
     * 
     * @param {string} endpoint - API endpoint (relative to /api/node/admin)
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} API response data
     */
    const authFetch = useCallback(async (endpoint, options = {}) => {
        const token = getToken();

        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            }
        });

        // Handle token expiration
        if (response.status === 401) {
            clearAuth();
            throw new Error('Session expired. Please login again.');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    }, [getToken, clearAuth]);

    // Check authentication on mount
    useEffect(() => {
        // Try to load cached admin info first
        const cachedAdmin = localStorage.getItem(ADMIN_KEY);
        if (cachedAdmin) {
            try {
                setAdmin(JSON.parse(cachedAdmin));
            } catch (e) {
                // Invalid cached data, ignore
            }
        }

        // Verify token with backend
        verifyToken();
    }, [verifyToken]);

    return {
        // State
        admin,
        isAuthenticated,
        isLoading,
        error,

        // Methods
        login,
        logout,
        getToken,
        authFetch,
        verifyToken,

        // Utilities
        clearError: () => setError(null)
    };
}
