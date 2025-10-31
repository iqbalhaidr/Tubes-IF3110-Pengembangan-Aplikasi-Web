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
    store_logo_path VARCHAR(255),
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