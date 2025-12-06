-- ============================================
-- MILESTONE 2: ADMIN FEATURE MIGRATION
-- ============================================
-- This migration adds:
-- 1. Admin table for separate admin authentication
-- 2. Expands user_feature_access with disable reasons
-- 3. Global feature flags table
-- ============================================

-- ============================================
-- ADMIN TABLE
-- ============================================
-- Separate table for admin users (different from buyer/seller)
-- Admin uses JWT authentication instead of PHP sessions

CREATE TABLE IF NOT EXISTS admin (
    admin_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookups during login
CREATE INDEX IF NOT EXISTS idx_admin_email ON admin(email);

-- ============================================
-- EXPAND USER FEATURE ACCESS TABLE
-- ============================================
-- Add columns for tracking who disabled a feature and why

-- Add disable_reason column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_feature_access' AND column_name = 'disable_reason'
    ) THEN
        ALTER TABLE user_feature_access ADD COLUMN disable_reason TEXT;
    END IF;
END $$;

-- Add disabled_at timestamp
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_feature_access' AND column_name = 'disabled_at'
    ) THEN
        ALTER TABLE user_feature_access ADD COLUMN disabled_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add disabled_by admin reference
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_feature_access' AND column_name = 'disabled_by'
    ) THEN
        ALTER TABLE user_feature_access ADD COLUMN disabled_by INTEGER;
    END IF;
END $$;

-- ============================================
-- GLOBAL FEATURE FLAGS TABLE
-- ============================================
-- System-wide feature toggles that affect all users
-- When disabled, features are in "maintenance mode"

CREATE TABLE IF NOT EXISTS global_feature_flags (
    id SERIAL PRIMARY KEY,
    feature_flag VARCHAR(100) UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT true NOT NULL,
    disable_reason TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES admin(admin_id) ON DELETE SET NULL
);

-- Index for faster flag lookups
CREATE INDEX IF NOT EXISTS idx_global_flags_feature ON global_feature_flags(feature_flag);

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert default global flags (only if they don't exist)
INSERT INTO global_feature_flags (feature_flag, is_enabled) 
VALUES 
    ('auction_enabled', true),
    ('chat_enabled', true),
    ('checkout_enabled', true)
ON CONFLICT (feature_flag) DO NOTHING;

-- Insert hardcoded admin account
-- Password: Admin@1234 (bcrypt hashed with cost 10)
-- You can generate new hash with: require('bcryptjs').hashSync('Admin@1234', 10)
INSERT INTO admin (email, password_hash, name)
VALUES (
    'admin@nimonspedia.com',
    '$2a$10$RW.1sjFaZAznCKphltBEg.rQeaUmd1INbbOZ2UnIar2hhLxhhJZxa',
    'Super Admin'
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- VIEW FOR ADMIN DASHBOARD
-- ============================================
-- Combined view for users with their feature flags

CREATE OR REPLACE VIEW admin_user_list_view AS
SELECT 
    u.user_id,
    u.name,
    u.email,
    u.role,
    u.balance,
    u.created_at as registration_date,
    -- Aggregate feature flags as JSON
    COALESCE(
        json_agg(
            json_build_object(
                'feature_flag', ufa.feature_flag,
                'access_enabled', ufa.access_enabled,
                'disable_reason', ufa.disable_reason,
                'disabled_at', ufa.disabled_at
            )
        ) FILTER (WHERE ufa.feature_flag IS NOT NULL),
        '[]'::json
    ) as feature_flags
FROM "user" u
LEFT JOIN user_feature_access ufa ON u.user_id = ufa.user_id
GROUP BY u.user_id, u.name, u.email, u.role, u.balance, u.created_at
ORDER BY u.user_id;
