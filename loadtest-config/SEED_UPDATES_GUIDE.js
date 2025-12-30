/**
 * NIMONSPEDIA SEED DATABASE - UPDATED SCHEMA
 * 
 * This file shows the required changes to seed-database.js to support
 * the full Nimonspedia platform including auctions, orders, and reviews.
 * 
 * KEY CHANGES:
 * 1. Password hashing with bcrypt
 * 2. New seeding functions for auctions, bids, orders, reviews
 * 3. Data validation to prevent inconsistencies
 * 4. Proper foreign key references
 */

const mysql = require('mysql2/promise');
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const config = require('./k6-config.json');

// ============================================
// SECTION 1: CRITICAL FIXES FOR EXISTING CODE
// ============================================

/**
 * FIX 1: Update password hashing
 * 
 * BEFORE (in seedMySQL/seedPostgreSQL):
 * password: '$2y$10$abcdefghijklmnopqrstuv'
 * 
 * AFTER:
 */
async function hashPassword(plainPassword) {
  const saltRounds = 10;
  return await bcrypt.hash(plainPassword, saltRounds);
}

/**
 * FIX 2: Column name mappings in seed functions
 * 
 * When inserting users:
 *   WRONG: cols.user.password
 *   RIGHT: cols.user.password (now maps to 'password_hash')
 * 
 * When inserting categories:
 *   WRONG: cols.category.name (could be 'name')
 *   RIGHT: cols.category.name (now explicitly maps to 'category_name')
 * 
 * The seed script should reference cols.xxx.xxx from config,
 * which now has the correct mappings.
 */

// ============================================
// SECTION 2: NEW SEEDING FUNCTIONS
// ============================================

/**
 * Seed auctions table
 * Requirements:
 * - seller_id must reference valid users with SELLER role
 * - product_id must be valid and belong to seller's store
 * - For SCHEDULED auctions: start_time is future, countdown_end_time is NULL
 * - For ACTIVE auctions: countdown_end_time is NULL (starts on first bid)
 * - For ENDED auctions: has ended_at timestamp
 * - For CANCELLED auctions: has cancelled reason
 */
async function seedAuctionsPostgreSQL(client, storeIds, productIdsByStore, sellerIdsByStore) {
  const schema = config.database.schema;
  const cols = schema.columns.auction;
  const table = schema.tables.auction;
  
  console.log('Seeding auctions...');
  const auctionsCount = config.seeding.auctionsCount || 8000;
  const statusDistribution = [0.6, 0.2, 0.15, 0.05]; // ACTIVE, SCHEDULED, ENDED, CANCELLED
  const statuses = ['ACTIVE', 'SCHEDULED', 'ENDED', 'CANCELLED'];
  
  let auctionIds = [];
  
  for (let i = 1; i <= auctionsCount; i++) {
    // Pick random store and its seller
    const randomStoreIdx = Math.floor(Math.random() * storeIds.length);
    const storeId = storeIds[randomStoreIdx];
    const sellerId = sellerIdsByStore[storeId];
    
    // Pick random product from this store
    const storeProducts = productIdsByStore[storeId] || [];
    if (storeProducts.length === 0) continue;
    
    const productId = storeProducts[Math.floor(Math.random() * storeProducts.length)];
    
    // Determine status with weighted distribution
    const rand = Math.random();
    let status, startedAt, endedAt;
    
    if (rand < statusDistribution[0]) {
      status = 'ACTIVE';
      startedAt = new Date();
      endedAt = null;
    } else if (rand < statusDistribution[0] + statusDistribution[1]) {
      status = 'SCHEDULED';
      startedAt = null;
      endedAt = null;
    } else if (rand < statusDistribution[0] + statusDistribution[1] + statusDistribution[2]) {
      status = 'ENDED';
      startedAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
      endedAt = new Date(Date.now() - 60 * 60 * 1000);
    } else {
      status = 'CANCELLED';
      startedAt = null;
      endedAt = new Date();
    }
    
    const initialBid = Math.floor(Math.random() * (500000 - 50000) + 50000);
    const minIncrement = Math.floor(Math.random() * (50000 - 5000) + 5000);
    const startTime = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    const placeholders = [
      `$1`, `$2`, `$3`, `$4`, `$5`, `$6`, `$7`, `$8`, `$9`, `$10`, `$11`
    ].join(', ');
    
    try {
      const result = await client.query(
        `INSERT INTO ${table} (
          ${cols.productId}, ${cols.sellerId}, ${cols.initialBid}, ${cols.currentBid},
          ${cols.minBidIncrement}, ${cols.status}, ${cols.startTime},
          ${cols.countdownEndTime}, ${cols.startedAt}, ${cols.endedAt}
        ) VALUES (${placeholders})
        RETURNING ${cols.id}`,
        [productId, sellerId, initialBid, initialBid, minIncrement, status, startTime, 
         null, startedAt, endedAt]
      );
      
      if (result.rows.length > 0) {
        auctionIds.push(result.rows[0].id);
      }
    } catch (err) {
      console.error(`Error seeding auction ${i}:`, err.message);
    }
    
    if (i % 1000 === 0) {
      console.log(`  Seeded ${i}/${auctionsCount} auctions...`);
    }
  }
  
  console.log(`✓ Seeded ${auctionIds.length} auctions`);
  return auctionIds;
}

/**
 * Seed auction_bids table
 * Requirements:
 * - bidder_id cannot equal seller_id
 * - bid_amount must be > previous bid + min_bid_increment
 * - Only ACTIVE and ENDED auctions should have bids
 * - placed_at should be chronological
 */
async function seedAuctionBidsPostgreSQL(client, auctionIds) {
  const schema = config.database.schema;
  const cols = schema.columns.auctionBid;
  const table = schema.tables.auctionBid;
  
  console.log('Seeding auction bids...');
  const bidsCount = config.seeding.auctionBidsCount || 15000;
  
  let bidCount = 0;
  
  // Get auction details including seller_id and current bid info
  const auctionsResult = await client.query(
    `SELECT id, seller_id, initial_bid, min_bid_increment, status 
     FROM auctions WHERE status IN ('ACTIVE', 'ENDED')`
  );
  
  const activeAuctions = auctionsResult.rows;
  
  // Get all user IDs for random bidder selection
  const usersResult = await client.query(
    `SELECT user_id FROM "user" WHERE role = 'BUYER' LIMIT 500`
  );
  
  const buyerIds = usersResult.rows.map(r => r.user_id);
  
  if (buyerIds.length === 0) {
    console.warn('  No buyers found in database. Skipping bid seeding.');
    return 0;
  }
  
  for (const auction of activeAuctions) {
    if (bidCount >= bidsCount) break;
    
    // Random number of bids per auction (1-5)
    const numBidsForAuction = Math.floor(Math.random() * 5) + 1;
    let currentBid = auction.initial_bid;
    
    for (let j = 0; j < numBidsForAuction && bidCount < bidsCount; j++) {
      // Pick random bidder who is not the seller
      let bidderId;
      do {
        bidderId = buyerIds[Math.floor(Math.random() * buyerIds.length)];
      } while (bidderId === auction.seller_id);
      
      // Next bid must be higher
      const bidAmount = currentBid + auction.min_bid_increment + Math.floor(Math.random() * 50000);
      const placedAt = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
      
      try {
        await client.query(
          `INSERT INTO ${table} (${cols.auctionId}, ${cols.bidderId}, ${cols.bidAmount}, ${cols.placedAt})
           VALUES ($1, $2, $3, $4)`,
          [auction.id, bidderId, bidAmount, placedAt]
        );
        
        currentBid = bidAmount;
        bidCount++;
      } catch (err) {
        console.error(`Error seeding bid:`, err.message);
      }
    }
  }
  
  console.log(`✓ Seeded ${bidCount} auction bids`);
  return bidCount;
}

/**
 * Seed orders table
 * Requirements:
 * - buyer_id cannot be same as seller_id
 * - Store_id must be valid
 * - total_price > 0
 * - Status distribution: 5% PENDING, 10% WAITING, 40% APPROVED, 30% ON_DELIVERY, 25% RECEIVED
 */
async function seedOrdersPostgreSQL(client, storeIds, sellerIdsByStore) {
  const schema = config.database.schema;
  const orderCols = schema.columns.order;
  const itemCols = schema.columns.orderItem;
  const orderTable = schema.tables.order;
  const itemTable = schema.tables.orderItem;
  
  console.log('Seeding orders...');
  const ordersCount = config.seeding.ordersCount || 6000;
  const statuses = ['PENDING_PAYMENT', 'WAITING_APPROVAL', 'APPROVED', 'ON_DELIVERY', 'RECEIVED'];
  const statusWeights = [0.05, 0.1, 0.4, 0.3, 0.25];
  
  // Get all buyer IDs
  const buyersResult = await client.query(
    `SELECT user_id FROM "user" WHERE role = 'BUYER'`
  );
  const buyerIds = buyersResult.rows.map(r => r.user_id);
  
  // Get products for random selection
  const productsResult = await client.query(
    `SELECT product_id, price FROM product WHERE stock > 0 LIMIT 5000`
  );
  const products = productsResult.rows;
  
  let orderCount = 0;
  
  for (let i = 1; i <= ordersCount; i++) {
    // Random buyer
    const buyerId = buyerIds[Math.floor(Math.random() * buyerIds.length)];
    
    // Random store (ensure seller != buyer)
    let storeId;
    let sellerId;
    do {
      storeId = storeIds[Math.floor(Math.random() * storeIds.length)];
      sellerId = sellerIdsByStore[storeId];
    } while (sellerId === buyerId);
    
    // Determine status
    const rand = Math.random();
    let status;
    if (rand < statusWeights[0]) status = statuses[0];
    else if (rand < statusWeights[0] + statusWeights[1]) status = statuses[1];
    else if (rand < statusWeights[0] + statusWeights[1] + statusWeights[2]) status = statuses[2];
    else if (rand < statusWeights[0] + statusWeights[1] + statusWeights[2] + statusWeights[3]) status = statuses[3];
    else status = statuses[4];
    
    const shippingAddress = `Address for buyer ${buyerId}`;
    const confirmedAt = status !== 'PENDING_PAYMENT' ? new Date() : null;
    
    try {
      const result = await client.query(
        `INSERT INTO ${orderTable} (${orderCols.buyerId}, ${orderCols.storeId}, 
         ${orderCols.totalPrice}, ${orderCols.shippingAddress}, ${orderCols.status}, 
         ${orderCols.confirmedAt}, ${orderCols.createdAt})
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING ${orderCols.id}`,
        [buyerId, storeId, 0, shippingAddress, status, confirmedAt]
      );
      
      const orderId = result.rows[0].order_id;
      
      // Add 1-3 items to order
      const itemCount = Math.floor(Math.random() * 3) + 1;
      let totalPrice = 0;
      
      for (let j = 0; j < itemCount; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const subtotal = product.price * quantity;
        totalPrice += subtotal;
        
        await client.query(
          `INSERT INTO ${itemTable} (${itemCols.orderId}, ${itemCols.productId}, 
           ${itemCols.quantity}, ${itemCols.priceAtPurchase})
           VALUES ($1, $2, $3, $4)`,
          [orderId, product.product_id, quantity, product.price]
        );
      }
      
      // Update order total price
      await client.query(
        `UPDATE ${orderTable} SET ${orderCols.totalPrice} = $1 WHERE ${orderCols.id} = $2`,
        [totalPrice, orderId]
      );
      
      orderCount++;
    } catch (err) {
      console.error(`Error seeding order ${i}:`, err.message);
    }
    
    if (i % 1000 === 0) {
      console.log(`  Seeded ${i}/${ordersCount} orders...`);
    }
  }
  
  console.log(`✓ Seeded ${orderCount} orders`);
  return orderCount;
}

/**
 * Seed product_review and seller_response tables
 * Requirements:
 * - Reviewer must be a buyer who purchased the product
 * - rating 1-5 with distribution: 10%, 15%, 25%, 30%, 20%
 * - 40% of reviews get seller responses
 */
async function seedReviewsPostgreSQL(client) {
  const schema = config.database.schema;
  const reviewCols = schema.columns.productReview;
  const responseCols = schema.columns.sellerResponse;
  const reviewTable = schema.tables.productReview;
  const responseTable = schema.tables.sellerResponse;
  
  console.log('Seeding product reviews...');
  const reviewsCount = config.seeding.reviewsCount || 4000;
  const ratings = [1, 2, 3, 4, 5];
  const ratingWeights = [0.1, 0.15, 0.25, 0.3, 0.2];
  const responseTexts = [
    'Thank you for your feedback!',
    'We appreciate your purchase and review.',
    'Thanks for shopping with us!',
    'Your satisfaction is important to us.',
    'We hope you enjoy your purchase!'
  ];
  
  // Get order items to find buyers who purchased products
  const orderItemsResult = await client.query(
    `SELECT DISTINCT oi.product_id, o.buyer_id 
     FROM order_item oi 
     JOIN "order" o ON oi.order_id = o.order_id 
     WHERE o.status = 'RECEIVED'
     LIMIT ${reviewsCount}`
  );
  
  const validReviews = orderItemsResult.rows;
  let reviewCount = 0;
  let responseCount = 0;
  
  for (const item of validReviews) {
    if (reviewCount >= reviewsCount) break;
    
    // Determine rating
    const rand = Math.random();
    let rating;
    if (rand < ratingWeights[0]) rating = ratings[0];
    else if (rand < ratingWeights[0] + ratingWeights[1]) rating = ratings[1];
    else if (rand < ratingWeights[0] + ratingWeights[1] + ratingWeights[2]) rating = ratings[2];
    else if (rand < ratingWeights[0] + ratingWeights[1] + ratingWeights[2] + ratingWeights[3]) rating = ratings[3];
    else rating = ratings[4];
    
    const reviewText = `Review text for product ${item.product_id}. Rating: ${rating} stars.`;
    
    try {
      const result = await client.query(
        `INSERT INTO ${reviewTable} (${reviewCols.productId}, ${reviewCols.buyerId}, 
         ${reviewCols.rating}, ${reviewCols.reviewText}, ${reviewCols.helpfulCount})
         VALUES ($1, $2, $3, $4, 0)
         RETURNING ${reviewCols.id}`,
        [item.product_id, item.buyer_id, rating, reviewText]
      );
      
      const reviewId = result.rows[0].review_id;
      
      // 40% chance of seller response
      if (Math.random() < 0.4) {
        const responseText = responseTexts[Math.floor(Math.random() * responseTexts.length)];
        try {
          await client.query(
            `INSERT INTO ${responseTable} (${responseCols.reviewId}, ${responseCols.responseText})
             VALUES ($1, $2)`,
            [reviewId, responseText]
          );
          responseCount++;
        } catch (err) {
          console.error(`Error adding seller response:`, err.message);
        }
      }
      
      reviewCount++;
    } catch (err) {
      console.error(`Error seeding review:`, err.message);
    }
  }
  
  console.log(`✓ Seeded ${reviewCount} reviews and ${responseCount} responses`);
  return { reviewCount, responseCount };
}

// ============================================
// SECTION 3: ORCHESTRATION
// ============================================

/**
 * Main seeding orchestration
 * Order:
 * 1. Truncate all tables
 * 2. Seed categories
 * 3. Seed users (buyers + sellers)
 * 4. Seed stores
 * 5. Seed products
 * 6. Seed category items
 * 7. Seed auctions
 * 8. Seed auction bids
 * 9. Seed orders
 * 10. Seed order items
 * 11. Seed reviews
 */
async function fullSeedPostgreSQL() {
  const client = new Client({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
  });
  
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // 1. Truncate all tables
    console.log('\nTruncating tables...');
    await client.query('TRUNCATE TABLE auctions CASCADE');
    await client.query('TRUNCATE TABLE auction_bids CASCADE');
    await client.query('TRUNCATE TABLE "order" CASCADE');
    await client.query('TRUNCATE TABLE order_item CASCADE');
    await client.query('TRUNCATE TABLE product_review CASCADE');
    await client.query('TRUNCATE TABLE seller_response CASCADE');
    await client.query('TRUNCATE TABLE category_item CASCADE');
    await client.query('TRUNCATE TABLE product CASCADE');
    await client.query('TRUNCATE TABLE store CASCADE');
    await client.query('TRUNCATE TABLE "user" CASCADE');
    
    // Continue with existing seed logic...
    // (seed categories, users, stores, products, category_items)
    
    // Then add new seeds:
    // const storeIds = [...]; // from previous seeding
    // const productIdsByStore = {...}; // map of store -> product ids
    // const sellerIdsByStore = {...}; // map of store -> seller id
    
    // await seedAuctionsPostgreSQL(client, storeIds, productIdsByStore, sellerIdsByStore);
    // await seedAuctionBidsPostgreSQL(client, auctionIds);
    // await seedOrdersPostgreSQL(client, storeIds, sellerIdsByStore);
    // await seedReviewsPostgreSQL(client);
    
    console.log('\n✓ Database seeding complete!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  fullSeedPostgreSQL().catch(console.error);
}

module.exports = {
  hashPassword,
  seedAuctionsPostgreSQL,
  seedAuctionBidsPostgreSQL,
  seedOrdersPostgreSQL,
  seedReviewsPostgreSQL
};
