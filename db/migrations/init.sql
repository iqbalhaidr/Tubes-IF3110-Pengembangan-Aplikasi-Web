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

INSERT INTO category (category_name) VALUES ('Electronics'), ('Fashion'), ('Books'), ('Home & Kitchen');

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
-- 3. CHAT SYSTEM
-- ============================================

-- A. CHAT ROOM (Parent)
CREATE TABLE IF NOT EXISTS chat_room (
    store_id INTEGER NOT NULL,
    buyer_id INTEGER NOT NULL,
    last_message_at TIMESTAMP NULL,
    unread_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (store_id, buyer_id),
    FOREIGN KEY (store_id) REFERENCES store(store_id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES "user"(user_id) ON DELETE CASCADE
);

-- B. CHAT MESSAGES (Child)
-- Pastikan ENUM dibuat sebelum tabel yang menggunakannya
DO $$ BEGIN
    CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'item_preview');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE chat_messages (
    message_id SERIAL PRIMARY KEY,
    store_id INT NOT NULL,
    buyer_id INT NOT NULL,
    sender_id INT NOT NULL,
    message_type message_type_enum NOT NULL,
    content TEXT, 
    product_id INT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key ke Chat Room
    CONSTRAINT fk_chat_room FOREIGN KEY (store_id, buyer_id) 
        REFERENCES chat_room(store_id, buyer_id) 
        ON DELETE CASCADE,

    -- Foreign Key ke User
    CONSTRAINT fk_sender FOREIGN KEY (sender_id) 
        REFERENCES "user"(user_id) 
        ON DELETE CASCADE,

    -- Foreign Key ke Product
    CONSTRAINT fk_product_preview FOREIGN KEY (product_id) 
        REFERENCES product(product_id) 
        ON DELETE SET NULL
);

-- Indexes diperbaiki (sesuai nama kolom yang benar)
CREATE INDEX IF NOT EXISTS idx_chat_store ON chat_messages(store_id);
CREATE INDEX IF NOT EXISTS idx_chat_buyer ON chat_messages(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at);

-- ============================================
-- 4. UTILS & ENUMS (Moved up for dependencies)
-- ============================================

DO $$ BEGIN
    CREATE TYPE feature_name_enum AS ENUM ('checkout_enabled', 'chat_enabled', 'auction_enabled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- 5. PUSH NOTIFICATIONS
-- ============================================

CREATE TABLE push_subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_push_sub_user FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE
);

CREATE TABLE push_preferences (
    user_id INT PRIMARY KEY,
    chat_enabled BOOLEAN DEFAULT TRUE,
    auction_enabled BOOLEAN DEFAULT TRUE,
    order_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_push_pref_user FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE
);

CREATE TRIGGER update_push_preferences_timestamp
BEFORE UPDATE ON push_preferences
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ============================================
-- 6. FEATURE FLAGS
-- ============================================

CREATE TABLE user_feature_access (
    access_id SERIAL PRIMARY KEY,
    user_id INT NULL,
    feature_name feature_name_enum NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    reason TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_feature_user FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    CONSTRAINT unique_user_feature_rule UNIQUE NULLS NOT DISTINCT (user_id, feature_name)
);

CREATE TRIGGER update_feature_access_timestamp
BEFORE UPDATE ON user_feature_access
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- Indexes diperbaiki (sesuai nama kolom yang benar)
CREATE INDEX IF NOT EXISTS idx_feature_user ON user_feature_access(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_name ON user_feature_access(feature_name); -- FIX: feature_flag -> feature_name
CREATE INDEX IF NOT EXISTS idx_feature_enabled ON user_feature_access(is_enabled); -- FIX: access_enabled -> is_enabled

-- ============================================
-- 7. VIEWS
-- ============================================

CREATE OR REPLACE VIEW active_auctions_view AS
SELECT 
    a.id,
    a.product_id,
    a.seller_id,
    u_seller.name as seller_username, -- FIX: username -> name
    a.current_bid,
    a.highest_bidder_id,
    u_bidder.name as highest_bidder_username, -- FIX: username -> name
    a.countdown_end_time,
    a.started_at,
    EXTRACT(EPOCH FROM (a.countdown_end_time - CURRENT_TIMESTAMP))::INTEGER as seconds_remaining
FROM auctions a
LEFT JOIN "user" u_seller ON a.seller_id = u_seller.user_id
LEFT JOIN "user" u_bidder ON a.highest_bidder_id = u_bidder.user_id
WHERE a.status = 'ACTIVE'
ORDER BY a.countdown_end_time ASC;

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
-- 8. COMMENTS (Cleaned up)
-- ============================================

COMMENT ON TABLE auctions IS 'Stores auction information for products';
COMMENT ON TABLE auction_bids IS 'Records all bids placed in auctions';
COMMENT ON TABLE chat_messages IS 'Stores chat messages exchanged during auctions';
COMMENT ON TABLE push_subscriptions IS 'Stores Web Push API subscriptions for each user';
COMMENT ON TABLE push_preferences IS 'Stores user preferences for push notifications';
COMMENT ON TABLE user_feature_access IS 'Controls feature flags/access for each user';
COMMENT ON COLUMN auctions.countdown_end_time IS 'When the auction countdown expires (15 seconds after last bid)';