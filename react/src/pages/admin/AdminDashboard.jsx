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
 * @module pages/admin/AdminDashboard
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdminAuth from '../../hooks/useAdminAuth';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import Spinner, { Skeleton } from '../../components/common/Spinner';
import { useToast } from '../../contexts/ToastContext';
import './AdminDashboard.css';

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
            <div className="admin-dashboard-loading">
                <Spinner size="large" text="Loading admin panel..." />
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            {/* Admin Header */}
            <header className="admin-header">
                <div className="header-left">
                    <h1 className="header-title">
                        <span className="header-icon">🛡️</span>
                        Admin Dashboard
                    </h1>
                    <span className="header-subtitle">Nimonspedia Administration</span>
                </div>
                <div className="header-right">
                    <div className="admin-info">
                        <span className="admin-avatar">{admin?.name?.charAt(0) || 'A'}</span>
                        <span className="admin-name">{admin?.name || 'Admin'}</span>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>

            <main className="admin-content">
                {/* ============================================ */}
                {/* USER MANAGEMENT SECTION */}
                {/* ============================================ */}
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title">User Management</h2>
                        <span className="section-badge">{totalUsers} users</span>
                    </div>

                    {/* Search and Filter */}
                    <div className="search-filter-bar">
                        <div className="search-input-wrapper">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    className="search-clear"
                                    onClick={() => setSearchTerm('')}
                                    aria-label="Clear search"
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        <select
                            className="role-filter"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="">All Roles</option>
                            <option value="BUYER">Buyer</option>
                            <option value="SELLER">Seller</option>
                        </select>
                    </div>

                    {/* Users Table */}
                    <div className="table-container">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Balance</th>
                                    <th>Registered</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usersLoading ? (
                                    // Loading skeleton
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <tr key={`skeleton-${index}`} className="skeleton-row">
                                            <td><Skeleton width="40px" /></td>
                                            <td><Skeleton width="120px" /></td>
                                            <td><Skeleton width="180px" /></td>
                                            <td><Skeleton width="60px" /></td>
                                            <td><Skeleton width="100px" /></td>
                                            <td><Skeleton width="80px" /></td>
                                            <td><Skeleton width="100px" /></td>
                                        </tr>
                                    ))
                                ) : users.length === 0 ? (
                                    // Empty state
                                    <tr>
                                        <td colSpan="7" className="empty-state">
                                            <div className="empty-content">
                                                <span className="empty-icon">👤</span>
                                                <p>No users found</p>
                                                {(searchTerm || roleFilter) && (
                                                    <button
                                                        className="clear-filters-btn"
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
                                        <tr key={user.user_id}>
                                            <td className="id-cell">{user.user_id}</td>
                                            <td className="name-cell">{user.name}</td>
                                            <td className="email-cell">{user.email}</td>
                                            <td>
                                                <span className={`role-badge role-${user.role.toLowerCase()}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="balance-cell">{formatCurrency(user.balance)}</td>
                                            <td className="date-cell">{formatDate(user.registration_date)}</td>
                                            <td>
                                                <button
                                                    className="manage-flags-btn"
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
                <section className="dashboard-section global-flags-section">
                    <div className="section-header">
                        <h2 className="section-title">Global Feature Flags</h2>
                    </div>

                    {/* Warning Banner */}
                    <div className="global-warning-banner">
                        <span className="warning-icon">⚠️</span>
                        <div className="warning-content">
                            <strong>System-wide changes</strong>
                            <p>Disabling global flags will affect all users immediately. Use with caution.</p>
                        </div>
                    </div>

                    {/* Global Flags Cards */}
                    <div className="global-flags-grid">
                        {globalFlagsLoading ? (
                            // Loading skeleton
                            Array.from({ length: 3 }).map((_, index) => (
                                <div key={`flag-skeleton-${index}`} className="flag-card skeleton-card">
                                    <Skeleton height="120px" />
                                </div>
                            ))
                        ) : (
                            Object.entries(globalFlags).map(([flagName, flagData]) => (
                                <div
                                    key={flagName}
                                    className={`flag-card ${flagData.enabled ? 'flag-enabled' : 'flag-disabled'}`}
                                >
                                    <div className="flag-header">
                                        <h3 className="flag-name">{FLAG_LABELS[flagName] || flagName}</h3>
                                        <span className={`flag-status ${flagData.enabled ? 'status-on' : 'status-off'}`}>
                                            {flagData.enabled ? 'ON' : 'OFF'}
                                        </span>
                                    </div>

                                    <div className="flag-body">
                                        {!flagData.enabled && (
                                            <textarea
                                                className="flag-reason-input"
                                                placeholder="Reason for disabling (min 20 characters)..."
                                                value={globalFlagReasons[flagName] || ''}
                                                onChange={(e) => handleGlobalReasonChange(flagName, e.target.value)}
                                                rows={2}
                                            />
                                        )}

                                        {flagData.enabled && (
                                            <textarea
                                                className="flag-reason-input"
                                                placeholder="Enter reason before disabling (min 20 characters)..."
                                                value={globalFlagReasons[flagName] || ''}
                                                onChange={(e) => handleGlobalReasonChange(flagName, e.target.value)}
                                                rows={2}
                                            />
                                        )}
                                    </div>

                                    <div className="flag-footer">
                                        <button
                                            className={`flag-toggle-btn ${flagData.enabled ? 'btn-disable' : 'btn-enable'}`}
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
                    <div className="modal-footer-buttons">
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setUserFlagsModalOpen(false);
                                setSelectedUser(null);
                            }}
                            disabled={userFlagsSaving}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSaveUserFlags}
                            disabled={userFlagsLoading || userFlagsSaving}
                        >
                            {userFlagsSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                }
            >
                {userFlagsLoading ? (
                    <div className="modal-loading">
                        <Spinner size="medium" text="Loading flags..." />
                    </div>
                ) : (
                    <div className="user-flags-form">
                        <p className="flags-info">
                            Configure feature access for <strong>{selectedUser?.email}</strong>
                        </p>

                        {Object.entries(FLAG_LABELS).map(([flagName, label]) => (
                            <div
                                key={flagName}
                                className={`flag-form-item ${!userFlags[flagName]?.enabled ? 'flag-item-disabled' : ''}`}
                            >
                                <div className="flag-toggle-row">
                                    <label className="flag-checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={userFlags[flagName]?.enabled ?? true}
                                            onChange={() => handleUserFlagToggle(flagName)}
                                        />
                                        <span className="checkbox-custom"></span>
                                        <span className="flag-label-text">{label}</span>
                                    </label>
                                    <span className={`flag-mini-status ${userFlags[flagName]?.enabled ? 'mini-on' : 'mini-off'}`}>
                                        {userFlags[flagName]?.enabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>

                                {/* Reason textarea when disabled */}
                                {!userFlags[flagName]?.enabled && (
                                    <div className="flag-reason-wrapper">
                                        <label className="reason-label">Reason for disabling (min 10 characters):</label>
                                        <textarea
                                            className="flag-reason-textarea"
                                            placeholder="Enter reason..."
                                            value={flagReasons[flagName] || ''}
                                            onChange={(e) => handleReasonChange(flagName, e.target.value)}
                                            rows={2}
                                        />
                                        {flagReasons[flagName] && flagReasons[flagName].length < 10 && (
                                            <span className="reason-hint">
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
                    <div className="modal-footer-buttons">
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setConfirmGlobalModal(false);
                                setPendingGlobalChanges(null);
                            }}
                            disabled={globalFlagsSaving}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={handleConfirmGlobalChanges}
                            disabled={globalFlagsSaving}
                        >
                            {globalFlagsSaving ? 'Saving...' : 'Confirm Change'}
                        </button>
                    </div>
                }
            >
                <div className="confirm-content">
                    <div className="modal-warning-banner">
                        <span className="warning-icon">⚠️</span>
                        <p className="warning-text">
                            This change will affect all users immediately. Are you sure you want to proceed?
                        </p>
                    </div>
                    {pendingGlobalChanges && (
                        <div className="pending-changes">
                            {Object.entries(pendingGlobalChanges).map(([flag, data]) => (
                                <p key={flag}>
                                    <strong>{FLAG_LABELS[flag]}</strong> will be{' '}
                                    <span className={data.enabled ? 'change-enable' : 'change-disable'}>
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
