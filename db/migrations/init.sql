CREATE TYPE user_role AS ENUM ('BUYER', 'SELLER');

CREATE TYPE order_status AS ENUM ('WAITING_APPROVAL', 'APPROVED', 'REJECTED', 'ON_DELIVERY', 'RECEIVED');

CREATE TABLE "user" (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    balance INT DEFAULT 0,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE store (
    store_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    store_name VARCHAR(255) UNIQUE NOT NULL,
    store_description TEXT,
    store_logo_path VARCHAR(255) UNIQUE NOT NULL,
    balance INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_seller FOREIGN KEY(user_id) REFERENCES "user"(user_id) ON DELETE CASCADE
);

CREATE TABLE category (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE product (
    product_id SERIAL PRIMARY KEY,
    store_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    price INT NOT NULL,
    stock INT NOT NULL,
    main_image_path VARCHAR(255),
    search_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    CONSTRAINT fk_store FOREIGN KEY(store_id) REFERENCES store(store_id) ON DELETE CASCADE
);

CREATE TABLE category_item (
    product_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (product_id, category_id),
    CONSTRAINT fk_product FOREIGN KEY(product_id) REFERENCES product(product_id) ON DELETE CASCADE,
    CONSTRAINT fk_category FOREIGN KEY(category_id) REFERENCES category(category_id) ON DELETE CASCADE
);

CREATE TABLE cart_item (
    cart_item_id SERIAL PRIMARY KEY,
    buyer_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_buyer FOREIGN KEY(buyer_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_product FOREIGN KEY(product_id) REFERENCES product(product_id) ON DELETE CASCADE
);

CREATE TABLE "order" (
    order_id SERIAL PRIMARY KEY,
    buyer_id INT NOT NULL,
    store_id INT NOT NULL,
    total_price INT NOT NULL,
    shipping_address TEXT NOT NULL,
    status order_status NOT NULL DEFAULT 'WAITING_APPROVAL',
    reject_reason TEXT,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    delivery_time TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_buyer FOREIGN KEY(buyer_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_store FOREIGN KEY(store_id) REFERENCES store(store_id) ON DELETE CASCADE
);

CREATE TABLE order_item (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price_at_purchase INT NOT NULL,
    subtotal INT NOT NULL,
    CONSTRAINT fk_order FOREIGN KEY(order_id) REFERENCES "order"(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_product_historical FOREIGN KEY(product_id) REFERENCES product(product_id) ON DELETE SET NULL
);

-- ============================================
-- AUCTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS auctions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    seller_id INTEGER NOT NULL,
    
    -- Bid tracking
    initial_bid DECIMAL(15, 2) NOT NULL DEFAULT 0,
    current_bid DECIMAL(15, 2) NOT NULL DEFAULT 0,
    highest_bidder_id INTEGER,
    min_bid_increment DECIMAL(15, 2) DEFAULT 10000,
    
    -- Status and timing
    status VARCHAR(50) DEFAULT 'ACTIVE',
    countdown_end_time TIMESTAMP,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    
    -- Winner information
    winner_id INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE,
    CONSTRAINT fk_seller FOREIGN KEY (seller_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_highest_bidder FOREIGN KEY (highest_bidder_id) REFERENCES "user"(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_winner FOREIGN KEY (winner_id) REFERENCES "user"(user_id) ON DELETE SET NULL,
    CONSTRAINT valid_status CHECK (status IN ('ACTIVE', 'ENDED', 'CANCELLED')),
    CONSTRAINT bid_positive CHECK (current_bid >= 0),
    CONSTRAINT min_increment_positive CHECK (min_bid_increment > 0)
);

-- Indexes for auction queries
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_seller ON auctions(seller_id);
CREATE INDEX IF NOT EXISTS idx_auctions_winner ON auctions(winner_id);
CREATE INDEX IF NOT EXISTS idx_auctions_product ON auctions(product_id);
CREATE INDEX IF NOT EXISTS idx_auctions_countdown ON auctions(countdown_end_time);

-- ============================================
-- AUCTION BIDS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS auction_bids (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER NOT NULL,
    bidder_id INTEGER NOT NULL,
    bid_amount DECIMAL(15, 2) NOT NULL,
    placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_auction FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
    CONSTRAINT fk_bidder FOREIGN KEY (bidder_id) REFERENCES "user"(user_id),
    CONSTRAINT bid_amount_positive CHECK (bid_amount > 0)
);

-- Indexes for bid queries
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction ON auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_bidder ON auction_bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_time ON auction_bids(placed_at);
CREATE INDEX IF NOT EXISTS idx_auction_bids_amount ON auction_bids(bid_amount);

-- ============================================
-- CHAT MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_chat_auction FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_user FOREIGN KEY (user_id) REFERENCES "user"(user_id),
    CONSTRAINT message_not_empty CHECK (LENGTH(message) > 0)
);

-- Indexes for chat queries
CREATE INDEX IF NOT EXISTS idx_chat_auction ON chat_messages(auction_id);
CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_time ON chat_messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_chat_auction_time ON chat_messages(auction_id, sent_at);

-- ============================================
-- PUSH SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    subscription_data JSONB NOT NULL,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_push_user FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE
);

-- Indexes for push notification queries
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscribed ON push_subscriptions(subscribed_at);

-- ============================================
-- PUSH PREFERENCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS push_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    notify_outbid BOOLEAN DEFAULT true,
    notify_auction_ended BOOLEAN DEFAULT true,
    notify_new_message BOOLEAN DEFAULT true,
    notify_order_status BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_pref_user FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE
);

-- ============================================
-- USER FEATURE ACCESS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_feature_access (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    feature_flag VARCHAR(100) NOT NULL,
    access_enabled BOOLEAN DEFAULT true,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    disable_reason TEXT,
    disabled_at TIMESTAMP WITH TIME ZONE,
    disabled_by INTEGER, -- Optional: Add REFERENCES admin(admin_id) if you want strict constraints
    
    -- Constraints
    CONSTRAINT fk_feature_user FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    CONSTRAINT unique_user_feature UNIQUE(user_id, feature_flag)
);

-- Indexes for feature flag queries
CREATE INDEX IF NOT EXISTS idx_feature_user ON user_feature_access(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag ON user_feature_access(feature_flag);
CREATE INDEX IF NOT EXISTS idx_feature_enabled ON user_feature_access(access_enabled);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for active auctions with seller info
CREATE OR REPLACE VIEW active_auctions_view AS
SELECT 
    a.id,
    a.product_id,
    a.seller_id,
    u_seller.name as seller_username,
    a.current_bid,
    a.highest_bidder_id,
    u_bidder.name as highest_bidder_username,
    a.countdown_end_time,
    a.started_at,
    EXTRACT(EPOCH FROM (a.countdown_end_time - CURRENT_TIMESTAMP))::INTEGER as seconds_remaining
FROM auctions a
LEFT JOIN "user" u_seller ON a.seller_id = u_seller.user_id
LEFT JOIN "user" u_bidder ON a.highest_bidder_id = u_bidder.user_id
WHERE a.status = 'ACTIVE'
ORDER BY a.countdown_end_time ASC;

-- View for user's auction history
CREATE OR REPLACE VIEW user_auction_history_view AS
SELECT 
    a.id,
    a.product_id,
    a.seller_id,
    a.current_bid,
    a.status,
    a.winner_id,
    a.ended_at,
    COUNT(DISTINCT ab.bidder_id) as total_bidders,
    MAX(ab.bid_amount) as highest_bid
FROM auctions a
LEFT JOIN auction_bids ab ON a.id = ab.auction_id
GROUP BY a.id;

INSERT INTO category (category_name) VALUES ('Electronics'), ('Fashion'), ('Books'), ('Home & Kitchen');

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
