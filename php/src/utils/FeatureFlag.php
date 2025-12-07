<?php
/**
 * FeatureFlag - Utility class for checking feature flag status
 * 
 * Provides server-side enforcement of feature flags.
 * Checks both global flags and user-specific flags.
 * 
 * Usage:
 *   FeatureFlag::checkAccess('checkout_enabled', $user_id);
 *   FeatureFlag::requireFeature('checkout_enabled', $user_id);
 */
class FeatureFlag {
    
    // Valid feature flags
    const CHECKOUT_ENABLED = 'checkout_enabled';
    const CHAT_ENABLED = 'chat_enabled';
    const AUCTION_ENABLED = 'auction_enabled';
    
    /**
     * Check if a feature is enabled for a specific user
     * Checks both global flags and user-specific flags
     * 
     * @param string $feature_flag - Feature flag name (e.g., 'checkout_enabled')
     * @param int|null $user_id - Optional user ID for user-specific checks
     * @return array ['enabled' => bool, 'reason' => string|null, 'is_global' => bool]
     */
    public static function checkAccess($feature_flag, $user_id = null) {
        $db = Database::getInstance();
        
        // 1. Check global feature flag first
        $global_query = "SELECT is_enabled, disable_reason 
                         FROM global_feature_flags 
                         WHERE feature_flag = :feature_flag";
        
        $stmt = $db->prepare($global_query);
        $stmt->execute([':feature_flag' => $feature_flag]);
        $global_result = $stmt->fetch();
        
        // If global flag exists and is disabled, return immediately
        if ($global_result && !$global_result['is_enabled']) {
            return [
                'enabled' => false,
                'reason' => 'This feature is currently under maintenance.',
                'is_global' => true
            ];
        }
        
        // 2. If user_id provided, check user-specific flag
        if ($user_id !== null) {
            $user_query = "SELECT access_enabled, disable_reason 
                           FROM user_feature_access 
                           WHERE user_id = :user_id AND feature_flag = :feature_flag";
            
            $stmt = $db->prepare($user_query);
            $stmt->execute([
                ':user_id' => $user_id,
                ':feature_flag' => $feature_flag
            ]);
            $user_result = $stmt->fetch();
            
            // If user has specific restriction
            if ($user_result && !$user_result['access_enabled']) {
                return [
                    'enabled' => false,
                    'reason' => $user_result['disable_reason'] ?: 'This feature has been disabled for your account.',
                    'is_global' => false
                ];
            }
        }
        
        // Feature is enabled
        return [
            'enabled' => true,
            'reason' => null,
            'is_global' => false
        ];
    }
    
    /**
     * Check if feature is enabled - simple boolean version
     * 
     * @param string $feature_flag - Feature flag name
     * @param int|null $user_id - Optional user ID
     * @return bool
     */
    public static function isEnabled($feature_flag, $user_id = null) {
        $result = self::checkAccess($feature_flag, $user_id);
        return $result['enabled'];
    }
    
    /**
     * Require a feature to be enabled - throws error response if disabled
     * Use this in controllers before performing feature operations
     * 
     * @param string $feature_flag - Feature flag name
     * @param int|null $user_id - Optional user ID
     * @return void - Returns nothing if enabled, sends error response if disabled
     */
    public static function requireFeature($feature_flag, $user_id = null) {
        $result = self::checkAccess($feature_flag, $user_id);
        
        if (!$result['enabled']) {
            // Map feature flags to user-friendly names
            $feature_names = [
                'checkout_enabled' => 'Checkout',
                'chat_enabled' => 'Chat',
                'auction_enabled' => 'Auction'
            ];
            
            $feature_name = $feature_names[$feature_flag] ?? $feature_flag;
            
            // Build error message
            $message = $result['is_global'] 
                ? "{$feature_name} is currently unavailable due to maintenance. Please try again later."
                : "{$feature_name} is not available for your account. Reason: {$result['reason']}";
            
            Response::error($message, [
                'feature_disabled' => true,
                'feature' => $feature_flag,
                'is_global' => $result['is_global']
            ], 403);
            exit;
        }
    }
    
    /**
     * Get all feature flags status for a user
     * Useful for frontend to hide/show features
     * 
     * @param int|null $user_id - Optional user ID
     * @return array Associative array of feature flags and their status
     */
    public static function getAllFlags($user_id = null) {
        $flags = [
            self::CHECKOUT_ENABLED,
            self::CHAT_ENABLED,
            self::AUCTION_ENABLED
        ];
        
        $result = [];
        foreach ($flags as $flag) {
            $status = self::checkAccess($flag, $user_id);
            $result[$flag] = [
                'enabled' => $status['enabled'],
                'reason' => $status['reason'],
                'is_global' => $status['is_global']
            ];
        }
        
        return $result;
    }
}
?>
