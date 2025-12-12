/**
 * FeatureGate Component - Conditional Rendering Based on Feature Flags
 * 
 * Wraps content that requires a specific feature to be enabled.
 * Shows a "feature disabled" message if the feature is off.
 * Uses Tailwind CSS for styling.
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
            <div className="min-h-[50vh] flex items-center justify-center">
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
        <div className="min-h-[60vh] flex items-center justify-center py-10 px-5">
            <div className="text-center max-w-[500px]">
                <div className="text-[80px] mb-6 animate-float max-sm:text-[60px]">
                    {info.icon}
                </div>

                {isGlobal && (
                    <span className="inline-block py-1.5 px-4 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 rounded-full text-[13px] font-semibold mb-4">
                        🔧 Under Maintenance
                    </span>
                )}

                <h1 className="text-[28px] font-bold text-text-dark mb-4 max-sm:text-[22px]">
                    {info.name} is Currently Unavailable
                </h1>

                <p className="text-base text-text-medium leading-relaxed mb-8 p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border-l-4 border-amber-400">
                    {reason || `${info.description} is temporarily unavailable. Please try again later.`}
                </p>

                <div className="flex gap-3 justify-center flex-wrap mb-6 max-sm:flex-col">
                    <a
                        href="/"
                        className="py-3 px-6 text-[15px] font-semibold rounded-lg no-underline border-none cursor-pointer transition-all bg-primary-green text-white hover:text-white hover:bg-primary-green-hover hover:-translate-y-0.5 max-sm:w-full"
                    >
                        ← Back to Home
                    </a>
                    <button
                        onClick={() => window.location.reload()}
                        className="py-3 px-6 text-[15px] font-semibold rounded-lg no-underline border-none cursor-pointer transition-all bg-background-gray text-text-dark hover:bg-border-color max-sm:w-full"
                    >
                        Try Again
                    </button>
                </div>

                {isGlobal ? (
                    <p className="text-sm text-text-light m-0">
                        Our team is working on it. Please check back later.
                    </p>
                ) : (
                    <p className="text-sm text-text-light m-0">
                        If you believe this is an error, please contact support.
                    </p>
                )}
            </div>
        </div>
    );
}

// Export FEATURES constant for convenience
export { FEATURES };
