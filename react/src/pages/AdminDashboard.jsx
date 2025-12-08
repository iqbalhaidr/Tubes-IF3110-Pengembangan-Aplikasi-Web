/**
 * Admin Dashboard Page
 * 
 * Main admin interface for managing users and feature flags.
 * Features:
 * - User list with search, filter, and pagination
 * - User-specific feature flags management
 * - Global feature flags management
 * - Toast notifications
 * 
 * Uses Tailwind CSS for styling.
 * 
 * @module pages/admin/AdminDashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdminAuth from '../hooks/useAdminAuth';
import Modal from '../components/admin/Modal';
import Pagination from '../components/admin/Pagination';
import Spinner, { Skeleton } from '../components/admin/Spinner';
import { useToast } from '../contexts/ToastContext';

// Debounce delay for search input (300ms as specified)
const SEARCH_DEBOUNCE_MS = 300;

// Items per page for pagination
const ITEMS_PER_PAGE = 10;

/**
 * Feature flag display names
 */
const FLAG_LABELS = {
    checkout_enabled: 'Checkout',
    chat_enabled: 'Chat',
    auction_enabled: 'Auction'
};

/**
 * Debounce hook for search input
 */
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { admin, isAuthenticated, isLoading: authLoading, logout, authFetch } = useAdminAuth();
    const { showToast } = useToast();

    // ============================================
    // USER MANAGEMENT STATE
    // ============================================
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    // Debounced search term
    const debouncedSearch = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);

    // ============================================
    // USER FLAGS MODAL STATE
    // ============================================
    const [selectedUser, setSelectedUser] = useState(null);
    const [userFlagsModalOpen, setUserFlagsModalOpen] = useState(false);
    const [userFlags, setUserFlags] = useState({});
    const [userFlagsLoading, setUserFlagsLoading] = useState(false);
    const [userFlagsSaving, setUserFlagsSaving] = useState(false);
    const [flagReasons, setFlagReasons] = useState({});

    // ============================================
    // GLOBAL FLAGS STATE
    // ============================================
    const [globalFlags, setGlobalFlags] = useState({});
    const [globalFlagsLoading, setGlobalFlagsLoading] = useState(true);
    const [globalFlagsSaving, setGlobalFlagsSaving] = useState(false);
    const [globalFlagReasons, setGlobalFlagReasons] = useState({});
    const [confirmGlobalModal, setConfirmGlobalModal] = useState(false);
    const [pendingGlobalChanges, setPendingGlobalChanges] = useState(null);

    // ============================================
    // AUTHENTICATION CHECK
    // ============================================
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/admin/login', { replace: true });
        }
    }, [authLoading, isAuthenticated, navigate]);

    // ============================================
    // FETCH USERS
    // ============================================
    const fetchUsers = useCallback(async () => {
        setUsersLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: ITEMS_PER_PAGE
            });

            if (debouncedSearch) params.append('search', debouncedSearch);
            if (roleFilter) params.append('role', roleFilter);

            const response = await authFetch(`/users?${params}`);

            if (response.success) {
                setUsers(response.data.users);
                setTotalPages(response.data.pagination.totalPages);
                setTotalUsers(response.data.pagination.totalItems);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
            showToast(error.message || 'Failed to load users', 'error');
        } finally {
            setUsersLoading(false);
        }
    }, [authFetch, currentPage, debouncedSearch, roleFilter, showToast]);

    // Fetch users when dependencies change
    useEffect(() => {
        if (isAuthenticated) {
            fetchUsers();
        }
    }, [isAuthenticated, fetchUsers]);

    // Reset to page 1 when search/filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, roleFilter]);

    // ============================================
    // FETCH GLOBAL FLAGS
    // ============================================
    const fetchGlobalFlags = useCallback(async () => {
        setGlobalFlagsLoading(true);
        try {
            const response = await authFetch('/global-flags');

            if (response.success) {
                setGlobalFlags(response.data.flags);
                // Initialize reasons for disabled flags
                const reasons = {};
                Object.entries(response.data.flags).forEach(([flag, data]) => {
                    if (!data.enabled && data.reason) {
                        reasons[flag] = data.reason;
                    }
                });
                setGlobalFlagReasons(reasons);
            }
        } catch (error) {
            console.error('Failed to fetch global flags:', error);
            showToast(error.message || 'Failed to load global flags', 'error');
        } finally {
            setGlobalFlagsLoading(false);
        }
    }, [authFetch, showToast]);

    // Fetch global flags on mount
    useEffect(() => {
        if (isAuthenticated) {
            fetchGlobalFlags();
        }
    }, [isAuthenticated, fetchGlobalFlags]);

    // ============================================
    // USER FLAGS HANDLERS
    // ============================================

    /**
     * Open user flags modal and fetch user's flags
     */
    const handleManageFlags = async (user) => {
        setSelectedUser(user);
        setUserFlagsModalOpen(true);
        setUserFlagsLoading(true);
        setFlagReasons({});

        try {
            const response = await authFetch(`/users/${user.user_id}/flags`);

            if (response.success) {
                setUserFlags(response.data.flags);
                // Initialize reasons for disabled flags
                const reasons = {};
                Object.entries(response.data.flags).forEach(([flag, data]) => {
                    if (!data.enabled && data.reason) {
                        reasons[flag] = data.reason;
                    }
                });
                setFlagReasons(reasons);
            }
        } catch (error) {
            console.error('Failed to fetch user flags:', error);
            showToast(error.message || 'Failed to load user flags', 'error');
            setUserFlagsModalOpen(false);
        } finally {
            setUserFlagsLoading(false);
        }
    };

    /**
     * Toggle a user's feature flag
     */
    const handleUserFlagToggle = (flagName) => {
        setUserFlags(prev => ({
            ...prev,
            [flagName]: {
                ...prev[flagName],
                enabled: !prev[flagName].enabled
            }
        }));

        // Clear reason if enabling
        if (!userFlags[flagName]?.enabled) {
            setFlagReasons(prev => {
                const updated = { ...prev };
                delete updated[flagName];
                return updated;
            });
        }
    };

    /**
     * Update reason for a disabled flag
     */
    const handleReasonChange = (flagName, reason) => {
        setFlagReasons(prev => ({
            ...prev,
            [flagName]: reason
        }));
    };

    /**
     * Save user's feature flags
     */
    const handleSaveUserFlags = async () => {
        // Validate reasons for disabled flags
        for (const [flag, data] of Object.entries(userFlags)) {
            if (!data.enabled && (!flagReasons[flag] || flagReasons[flag].trim().length < 10)) {
                showToast(`Please provide a reason (min 10 characters) for disabling ${FLAG_LABELS[flag]}`, 'error');
                return;
            }
        }

        setUserFlagsSaving(true);

        try {
            const flagsPayload = {};
            Object.entries(userFlags).forEach(([flag, data]) => {
                flagsPayload[flag] = {
                    enabled: data.enabled,
                    reason: data.enabled ? null : flagReasons[flag]
                };
            });

            const response = await authFetch(`/users/${selectedUser.user_id}/flags`, {
                method: 'PUT',
                body: JSON.stringify({ flags: flagsPayload })
            });

            if (response.success) {
                showToast(`Feature flags updated for ${selectedUser.name}`, 'success');
                setUserFlagsModalOpen(false);
                setSelectedUser(null);
            }
        } catch (error) {
            console.error('Failed to save user flags:', error);
            showToast(error.message || 'Failed to save feature flags', 'error');
        } finally {
            setUserFlagsSaving(false);
        }
    };

    // ============================================
    // GLOBAL FLAGS HANDLERS
    // ============================================

    /**
     * Toggle a global feature flag (opens confirmation)
     */
    const handleGlobalFlagToggle = (flagName) => {
        const newEnabled = !globalFlags[flagName]?.enabled;

        // If disabling, check for reason
        if (!newEnabled) {
            const currentReason = globalFlagReasons[flagName] || '';
            if (currentReason.trim().length < 20) {
                showToast(`Please provide a reason (min 20 characters) before disabling ${FLAG_LABELS[flagName]}`, 'warning');
                return;
            }
        }

        // Prepare pending changes for confirmation
        setPendingGlobalChanges({
            [flagName]: {
                enabled: newEnabled,
                reason: newEnabled ? null : globalFlagReasons[flagName]
            }
        });
        setConfirmGlobalModal(true);
    };

    /**
     * Update reason for a global flag
     */
    const handleGlobalReasonChange = (flagName, reason) => {
        setGlobalFlagReasons(prev => ({
            ...prev,
            [flagName]: reason
        }));
    };

    /**
     * Confirm and save global flag changes
     */
    const handleConfirmGlobalChanges = async () => {
        setGlobalFlagsSaving(true);

        try {
            const response = await authFetch('/global-flags', {
                method: 'PUT',
                body: JSON.stringify({ flags: pendingGlobalChanges })
            });

            if (response.success) {
                // Update local state
                Object.entries(pendingGlobalChanges).forEach(([flag, data]) => {
                    setGlobalFlags(prev => ({
                        ...prev,
                        [flag]: {
                            ...prev[flag],
                            enabled: data.enabled,
                            reason: data.reason
                        }
                    }));
                });

                showToast('Global feature flags updated successfully', 'success');
                setConfirmGlobalModal(false);
                setPendingGlobalChanges(null);
            }
        } catch (error) {
            console.error('Failed to save global flags:', error);
            showToast(error.message || 'Failed to save global flags', 'error');
        } finally {
            setGlobalFlagsSaving(false);
        }
    };

    // ============================================
    // LOGOUT HANDLER
    // ============================================
    const handleLogout = () => {
        logout();
        navigate('/admin/login', { replace: true });
    };

    // ============================================
    // RENDER HELPERS
    // ============================================

    /**
     * Format date for display
     */
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    /**
     * Format currency
     */
    const formatCurrency = (amount) => {
        return `Rp ${(amount || 0).toLocaleString('id-ID')}`;
    };

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-gray">
                <Spinner size="large" text="Loading admin panel..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-gray">
            {/* Admin Header */}
            <header className="bg-gradient-to-br from-[#1a2942] to-[#2d4263] text-white py-4 px-6 flex items-center justify-between shadow-md sticky top-0 z-[100] max-md:flex-col max-md:gap-3 max-md:py-3 max-md:px-4">
                <div className="flex items-center gap-3 max-md:flex-col max-md:text-center max-md:gap-1">
                    <h1 className="text-xl font-bold m-0 flex items-center gap-2 text-white">
                        <span className="text-2xl">🛡️</span>
                        Admin Dashboard
                    </h1>
                    <span className="text-[13px] text-white/60 pl-3 border-l border-white/20 max-md:pl-0 max-md:border-l-0">
                        Nimonspedia Administration
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-9 h-9 bg-primary-green rounded-full flex items-center justify-center font-semibold text-base">
                            {admin?.name?.charAt(0) || 'A'}
                        </span>
                        <span className="text-sm font-medium">{admin?.name || 'Admin'}</span>
                    </div>
                    <button
                        className="bg-white/10 text-white border border-white/30 py-2 px-4 rounded-md text-sm font-medium cursor-pointer transition-all hover:bg-white/20 hover:border-white/50"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto p-6 max-md:p-4">
                {/* ============================================ */}
                {/* USER MANAGEMENT SECTION */}
                {/* ============================================ */}
                <section className="bg-white rounded-xl shadow-sm p-6 mb-6 max-md:p-4">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-text-dark m-0">User Management</h2>
                        <span className="bg-background-gray text-text-medium py-1 px-3 rounded-xl text-[13px] font-medium">
                            {totalUsers} users
                        </span>
                    </div>

                    {/* Search and Filter */}
                    <div className="flex gap-3 mb-5 max-md:flex-col">
                        <div className="flex-1 relative max-w-[400px] max-md:max-w-full">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base opacity-50">🔍</span>
                            <input
                                type="text"
                                className="w-full py-2.5 pl-[42px] pr-10 text-sm border-[1.5px] border-border-color rounded-lg outline-none transition-all focus:border-primary-green focus:shadow-[0_0_0_3px_rgba(3,172,14,0.1)]"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-text-light text-white border-none w-5 h-5 rounded-full text-sm cursor-pointer flex items-center justify-center leading-none hover:bg-text-medium"
                                    onClick={() => setSearchTerm('')}
                                    aria-label="Clear search"
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        <select
                            className="py-2.5 px-4 text-sm border-[1.5px] border-border-color rounded-lg bg-white cursor-pointer min-w-[140px] outline-none focus:border-primary-green"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="">All Roles</option>
                            <option value="BUYER">Buyer</option>
                            <option value="SELLER">Seller</option>
                        </select>
                    </div>

                    {/* Users Table */}
                    <div className="overflow-x-auto -mx-6 px-6 max-md:-mx-4 max-md:px-4">
                        <table className="w-full border-collapse min-w-[800px]">
                            <thead>
                                <tr>
                                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-text-medium bg-background-gray border-b border-border-color">ID</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-text-medium bg-background-gray border-b border-border-color">Name</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-text-medium bg-background-gray border-b border-border-color">Email</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-text-medium bg-background-gray border-b border-border-color">Role</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-text-medium bg-background-gray border-b border-border-color">Balance</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-text-medium bg-background-gray border-b border-border-color">Registered</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-text-medium bg-background-gray border-b border-border-color">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usersLoading ? (
                                    // Loading skeleton
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td className="py-5 px-4"><Skeleton width="40px" /></td>
                                            <td className="py-5 px-4"><Skeleton width="120px" /></td>
                                            <td className="py-5 px-4"><Skeleton width="180px" /></td>
                                            <td className="py-5 px-4"><Skeleton width="60px" /></td>
                                            <td className="py-5 px-4"><Skeleton width="100px" /></td>
                                            <td className="py-5 px-4"><Skeleton width="80px" /></td>
                                            <td className="py-5 px-4"><Skeleton width="100px" /></td>
                                        </tr>
                                    ))
                                ) : users.length === 0 ? (
                                    // Empty state
                                    <tr>
                                        <td colSpan="7" className="text-center py-[60px] px-5">
                                            <div className="flex flex-col items-center gap-3">
                                                <span className="text-5xl opacity-30">👤</span>
                                                <p className="text-text-medium m-0">No users found</p>
                                                {(searchTerm || roleFilter) && (
                                                    <button
                                                        className="bg-transparent border-none text-primary-green text-sm cursor-pointer underline"
                                                        onClick={() => {
                                                            setSearchTerm('');
                                                            setRoleFilter('');
                                                        }}
                                                    >
                                                        Clear filters
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    // User rows
                                    users.map(user => (
                                        <tr key={user.user_id} className="hover:bg-background-light">
                                            <td className="py-3.5 px-4 text-sm text-text-dark border-b border-border-light font-semibold text-text-medium">{user.user_id}</td>
                                            <td className="py-3.5 px-4 text-sm text-text-dark border-b border-border-light font-medium">{user.name}</td>
                                            <td className="py-3.5 px-4 text-sm text-text-medium border-b border-border-light">{user.email}</td>
                                            <td className="py-3.5 px-4 text-sm border-b border-border-light">
                                                <span className={`inline-block py-1 px-2.5 rounded-xl text-[11px] font-semibold uppercase tracking-wide ${user.role === 'BUYER'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-sm text-text-dark border-b border-border-light font-mono font-medium">{formatCurrency(user.balance)}</td>
                                            <td className="py-3.5 px-4 text-[13px] text-text-light border-b border-border-light">{formatDate(user.registration_date)}</td>
                                            <td className="py-3.5 px-4 border-b border-border-light">
                                                <button
                                                    className="bg-primary-green text-white border-none py-2 px-3.5 rounded-md text-[13px] font-medium cursor-pointer transition-all hover:bg-primary-green-hover hover:shadow-sm"
                                                    onClick={() => handleManageFlags(user)}
                                                >
                                                    Manage Flags
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </section>

                {/* ============================================ */}
                {/* GLOBAL FEATURE FLAGS SECTION */}
                {/* ============================================ */}
                <section className="bg-white rounded-xl shadow-sm p-6 mb-6 max-md:p-4">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-text-dark m-0">Global Feature Flags</h2>
                    </div>

                    {/* Warning Banner */}
                    <div className="flex items-start gap-3 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-400 rounded-lg p-4 mb-5">
                        <span className="text-2xl shrink-0">⚠️</span>
                        <div>
                            <strong className="block text-orange-800 mb-1">System-wide changes</strong>
                            <p className="text-orange-600 m-0 text-sm">Disabling global flags will affect all users immediately. Use with caution.</p>
                        </div>
                    </div>

                    {/* Global Flags Cards */}
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5 max-md:grid-cols-1">
                        {globalFlagsLoading ? (
                            // Loading skeleton
                            Array.from({ length: 3 }).map((_, index) => (
                                <div key={`flag-skeleton-${index}`} className="border-2 border-border-color rounded-xl p-5 bg-background-gray">
                                    <Skeleton height="120px" />
                                </div>
                            ))
                        ) : (
                            Object.entries(globalFlags).map(([flagName, flagData]) => (
                                <div
                                    key={flagName}
                                    className={`border-2 rounded-xl p-5 transition-all ${flagData.enabled
                                            ? 'border-success-green bg-gradient-to-br from-green-50 to-green-100'
                                            : 'border-error-red bg-gradient-to-br from-red-50 to-red-100'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-base font-semibold text-text-dark m-0">{FLAG_LABELS[flagName] || flagName}</h3>
                                        <span className={`py-1 px-3 rounded-xl text-xs font-bold ${flagData.enabled
                                                ? 'bg-success-green text-white'
                                                : 'bg-error-red text-white'
                                            }`}>
                                            {flagData.enabled ? 'ON' : 'OFF'}
                                        </span>
                                    </div>

                                    <div className="mb-4">
                                        <textarea
                                            className="w-full py-2.5 px-3 text-[13px] border border-border-color rounded-md resize-y font-sans min-h-[60px] focus:outline-none focus:border-primary-green"
                                            placeholder={flagData.enabled ? "Enter reason before disabling (min 20 characters)..." : "Reason for disabling (min 20 characters)..."}
                                            value={globalFlagReasons[flagName] || ''}
                                            onChange={(e) => handleGlobalReasonChange(flagName, e.target.value)}
                                            rows={2}
                                        />
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            className={`py-2.5 px-5 rounded-md text-sm font-semibold cursor-pointer border-none transition-all disabled:opacity-60 disabled:cursor-not-allowed ${flagData.enabled
                                                    ? 'bg-error-red text-white hover:enabled:bg-red-700'
                                                    : 'bg-success-green text-white hover:enabled:bg-primary-green-hover'
                                                }`}
                                            onClick={() => handleGlobalFlagToggle(flagName)}
                                            disabled={globalFlagsSaving}
                                        >
                                            {flagData.enabled ? 'Disable Feature' : 'Enable Feature'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>

            {/* ============================================ */}
            {/* USER FLAGS MODAL */}
            {/* ============================================ */}
            <Modal
                isOpen={userFlagsModalOpen}
                onClose={() => {
                    setUserFlagsModalOpen(false);
                    setSelectedUser(null);
                }}
                title={`Manage Flags - ${selectedUser?.name || ''}`}
                size="medium"
                footer={
                    <div className="flex gap-3 justify-end max-md:flex-col-reverse">
                        <button
                            className="py-2.5 px-5 rounded-md text-sm font-medium cursor-pointer transition-all font-sans bg-background-gray text-text-dark border border-border-color hover:enabled:bg-border-color disabled:opacity-60 disabled:cursor-not-allowed min-w-[100px] max-md:w-full"
                            onClick={() => {
                                setUserFlagsModalOpen(false);
                                setSelectedUser(null);
                            }}
                            disabled={userFlagsSaving}
                        >
                            Cancel
                        </button>
                        <button
                            className="py-2.5 px-5 rounded-md text-sm font-medium cursor-pointer transition-all font-sans bg-primary-green text-white border-none hover:enabled:bg-primary-green-hover disabled:opacity-60 disabled:cursor-not-allowed min-w-[100px] max-md:w-full"
                            onClick={handleSaveUserFlags}
                            disabled={userFlagsLoading || userFlagsSaving}
                        >
                            {userFlagsSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                }
            >
                {userFlagsLoading ? (
                    <div className="flex justify-center py-10">
                        <Spinner size="medium" text="Loading flags..." />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <p className="text-text-medium text-sm m-0 mb-2">
                            Configure feature access for <strong>{selectedUser?.email}</strong>
                        </p>

                        {Object.entries(FLAG_LABELS).map(([flagName, label]) => (
                            <div
                                key={flagName}
                                className={`border border-border-color rounded-lg p-4 transition-all ${!userFlags[flagName]?.enabled ? 'bg-red-50 border-red-200' : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={userFlags[flagName]?.enabled ?? true}
                                            onChange={() => handleUserFlagToggle(flagName)}
                                            className="w-5 h-5 accent-primary-green cursor-pointer"
                                        />
                                        <span className="font-medium text-[15px]">{label}</span>
                                    </label>
                                    <span className={`text-xs font-semibold py-0.5 px-2 rounded ${userFlags[flagName]?.enabled
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                        {userFlags[flagName]?.enabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>

                                {/* Reason textarea when disabled */}
                                {!userFlags[flagName]?.enabled && (
                                    <div className="mt-3 pt-3 border-t border-dashed border-border-color">
                                        <label className="block text-xs font-medium text-text-medium mb-1.5">Reason for disabling (min 10 characters):</label>
                                        <textarea
                                            className="w-full py-2.5 px-3 text-[13px] border border-border-color rounded-md resize-y font-sans focus:outline-none focus:border-primary-green"
                                            placeholder="Enter reason..."
                                            value={flagReasons[flagName] || ''}
                                            onChange={(e) => handleReasonChange(flagName, e.target.value)}
                                            rows={2}
                                        />
                                        {flagReasons[flagName] && flagReasons[flagName].length < 10 && (
                                            <span className="block text-[11px] text-error-red mt-1">
                                                {10 - flagReasons[flagName].length} more characters required
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Modal>

            {/* ============================================ */}
            {/* GLOBAL FLAGS CONFIRMATION MODAL */}
            {/* ============================================ */}
            <Modal
                isOpen={confirmGlobalModal}
                onClose={() => {
                    setConfirmGlobalModal(false);
                    setPendingGlobalChanges(null);
                }}
                title="Confirm Global Flag Change"
                size="small"
                footer={
                    <div className="flex gap-3 justify-end max-md:flex-col-reverse">
                        <button
                            className="py-2.5 px-5 rounded-md text-sm font-medium cursor-pointer transition-all font-sans bg-background-gray text-text-dark border border-border-color hover:enabled:bg-border-color disabled:opacity-60 disabled:cursor-not-allowed min-w-[100px] max-md:w-full"
                            onClick={() => {
                                setConfirmGlobalModal(false);
                                setPendingGlobalChanges(null);
                            }}
                            disabled={globalFlagsSaving}
                        >
                            Cancel
                        </button>
                        <button
                            className="py-2.5 px-5 rounded-md text-sm font-medium cursor-pointer transition-all font-sans bg-error-red text-white border-none hover:enabled:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed min-w-[100px] max-md:w-full"
                            onClick={handleConfirmGlobalChanges}
                            disabled={globalFlagsSaving}
                        >
                            {globalFlagsSaving ? 'Saving...' : 'Confirm Change'}
                        </button>
                    </div>
                }
            >
                <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-400 rounded-lg p-3">
                        <span className="text-xl shrink-0">⚠️</span>
                        <p className="text-sm text-orange-800 m-0 leading-relaxed">
                            This change will affect all users immediately. Are you sure you want to proceed?
                        </p>
                    </div>
                    {pendingGlobalChanges && (
                        <div className="bg-background-gray rounded-lg p-4">
                            {Object.entries(pendingGlobalChanges).map(([flag, data]) => (
                                <p key={flag} className="m-0 text-sm">
                                    <strong>{FLAG_LABELS[flag]}</strong> will be{' '}
                                    <span className={data.enabled ? 'text-success-green font-semibold' : 'text-error-red font-semibold'}>
                                        {data.enabled ? 'ENABLED' : 'DISABLED'}
                                    </span>
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
