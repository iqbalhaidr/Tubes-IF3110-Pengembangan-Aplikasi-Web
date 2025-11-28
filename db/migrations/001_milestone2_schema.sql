-- Milestone 2 Schema Migration
-- Creates tables for Auctions, Chat, and Push Notifications

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
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES product(product_id),
    CONSTRAINT fk_seller FOREIGN KEY (seller_id) REFERENCES "user"(user_id),
    CONSTRAINT fk_highest_bidder FOREIGN KEY (highest_bidder_id) REFERENCES "user"(user_id),
    CONSTRAINT fk_winner FOREIGN KEY (winner_id) REFERENCES "user"(user_id),
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
    
    -- Constraints
    CONSTRAINT fk_feature_user FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    CONSTRAINT unique_user_feature UNIQUE(user_id, feature_flag)
);

-- Indexes for feature flag queries
CREATE INDEX IF NOT EXISTS idx_feature_user ON user_feature_access(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag ON user_feature_access(feature_flag);
CREATE INDEX IF NOT EXISTS idx_feature_enabled ON user_feature_access(access_enabled);

-- ============================================
-- SEED DEFAULT FEATURE FLAGS
-- ============================================

-- This is commented out since we can't reliably get all user IDs
-- Run manually or through application after users exist:

-- INSERT INTO user_feature_access (user_id, feature_flag, access_enabled)
-- SELECT id as user_id, 'CAN_BID_AUCTION', true FROM "user"
-- ON CONFLICT (user_id, feature_flag) DO NOTHING;
--
-- INSERT INTO user_feature_access (user_id, feature_flag, access_enabled)
-- SELECT id as user_id, 'CAN_CHAT_IN_AUCTION', true FROM "user"
-- ON CONFLICT (user_id, feature_flag) DO NOTHING;
--
-- INSERT INTO user_feature_access (user_id, feature_flag, access_enabled)
-- SELECT id as user_id, 'CAN_USE_PUSH_NOTIFICATIONS', true FROM "user"
-- ON CONFLICT (user_id, feature_flag) DO NOTHING;

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for active auctions with seller info
CREATE OR REPLACE VIEW active_auctions_view AS
SELECT 
    a.id,
    a.product_id,
    a.seller_id,
    u_seller.username as seller_username,
    a.current_bid,
    a.highest_bidder_id,
    u_bidder.username as highest_bidder_username,
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

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE auctions IS 'Stores auction information for products';
COMMENT ON TABLE auction_bids IS 'Records all bids placed in auctions';
COMMENT ON TABLE chat_messages IS 'Stores chat messages exchanged during auctions';
COMMENT ON TABLE push_subscriptions IS 'Stores Web Push API subscriptions for each user';
COMMENT ON TABLE push_preferences IS 'Stores user preferences for push notifications';
COMMENT ON TABLE user_feature_access IS 'Controls feature flags/access for each user';

COMMENT ON COLUMN auctions.countdown_end_time IS 'When the auction countdown expires (15 seconds after last bid)';
COMMENT ON COLUMN auctions.status IS 'Current status: ACTIVE, ENDED, or CANCELLED';
COMMENT ON COLUMN auction_bids.placed_at IS 'Timestamp when bid was placed (used for ordering)';
COMMENT ON COLUMN push_subscriptions.subscription_data IS 'JSON object containing push notification subscription details';

-- ============================================
-- END OF MIGRATION
-- ============================================
