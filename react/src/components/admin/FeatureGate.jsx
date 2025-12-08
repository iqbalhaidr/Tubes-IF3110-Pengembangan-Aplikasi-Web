/**
 * FeatureGate Component - Conditional Rendering Based on Feature Flags
 * 
 * Wraps content that requires a specific feature to be enabled.
 * Shows a "feature disabled" message if the feature is off.
 * 
 * Usage:
 *   <FeatureGate feature="auction_enabled" fallback={<DisabledPage />}>
 *     <AuctionList />
 *   </FeatureGate>
 * 
 * @module components/common/FeatureGate
 */

import { useFeatureEnabled, FEATURES } from '../../hooks/useFeatureFlags';
import Spinner from './Spinner';
import './FeatureGate.css';

/**
 * Feature gate component
 * 
 * @param {Object} props - Component props
 * @param {string} props.feature - Feature flag name (use FEATURES constant)
 * @param {React.ReactNode} props.children - Content to render if enabled
 * @param {React.ReactNode} props.fallback - Optional custom fallback component
 * @param {number|null} props.userId - Optional user ID for user-specific checks
 */
export default function FeatureGate({
    feature,
    children,
    fallback,
    userId = null
}) {
    // Get user from localStorage if not provided
    const storedUser = userId === null ? JSON.parse(localStorage.getItem('user') || 'null') : null;
    const effectiveUserId = userId || storedUser?.user_id || null;

    const { enabled, loading, reason, isGlobal } = useFeatureEnabled(feature, effectiveUserId);

    // Show loading state
    if (loading) {
        return (
            <div className="feature-gate-loading">
                <Spinner size="medium" text="Loading..." />
            </div>
        );
    }

    // Feature is enabled - render children
    if (enabled) {
        return children;
    }

    // Feature is disabled - show fallback or default disabled message
    if (fallback) {
        return fallback;
    }

    // Default disabled UI
    return <FeatureDisabledPage feature={feature} reason={reason} isGlobal={isGlobal} />;
}

/**
 * Default feature disabled page
 */
function FeatureDisabledPage({ feature, reason, isGlobal }) {
    // Map feature flags to display info
    const featureInfo = {
        'checkout_enabled': { name: 'Checkout', icon: '🛒', description: 'Complete your purchases' },
        'chat_enabled': { name: 'Chat', icon: '💬', description: 'Message other users' },
        'auction_enabled': { name: 'Auction', icon: '🔨', description: 'Browse and bid on auctions' }
    };

    const info = featureInfo[feature] || { name: feature, icon: '🔒', description: 'This feature' };

    return (
        <div className="feature-disabled-page">
            <div className="feature-disabled-content">
                <div className="feature-disabled-icon">{info.icon}</div>

                {isGlobal && (
                    <span className="maintenance-badge">🔧 Under Maintenance</span>
                )}

                <h1 className="feature-disabled-title">
                    {info.name} is Currently Unavailable
                </h1>

                <p className="feature-disabled-description">
                    {reason || `${info.description} is temporarily unavailable. Please try again later.`}
                </p>

                <div className="feature-disabled-actions">
                    <a href="/" className="btn btn-primary">
                        ← Back to Home
                    </a>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn btn-secondary"
                    >
                        Try Again
                    </button>
                </div>

                {isGlobal ? (
                    <p className="feature-disabled-note">
                        Our team is working on it. Please check back later.
                    </p>
                ) : (
                    <p className="feature-disabled-note">
                        If you believe this is an error, please contact support.
                    </p>
                )}
            </div>
        </div>
    );
}

// Export FEATURES constant for convenience
export { FEATURES };
