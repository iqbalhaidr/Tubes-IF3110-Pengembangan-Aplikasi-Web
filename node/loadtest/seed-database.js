import pg from 'pg';
import bcrypt from 'bcrypt';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

let mysql = null;
try {
  const mysqlModule = await import('mysql2/promise');
  mysql = mysqlModule.default;
} catch (e) {
  // mysql2 is optional, only needed for MySQL databases
}

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const config = JSON.parse(readFileSync(join(__dirname, 'k6-config.json'), 'utf-8'));

const SAMPLE_CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home & Living',
  'Sports & Outdoors',
  'Books & Media'
];

const PRODUCT_TEMPLATES = [
  'Laptop', 'Smartphone', 'Headphones', 'Keyboard', 'Mouse',
  'T-Shirt', 'Jeans', 'Shoes', 'Watch', 'Bag',
  'Desk Lamp', 'Chair', 'Table', 'Cushion', 'Rug',
  'Football', 'Basketball', 'Tennis Racket', 'Yoga Mat', 'Dumbbell',
  'Novel', 'Magazine', 'Comic Book', 'Notebook', 'Pen'
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPrice() {
  const prices = [9900, 15000, 25000, 50000, 75000, 100000, 250000, 500000, 1000000];
  return prices[randomInt(0, prices.length - 1)];
}

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

function randomOrderStatus() {
  const statuses = ['PENDING_PAYMENT', 'WAITING_APPROVAL', 'APPROVED', 'RECEIVED'];
  return statuses[randomInt(0, statuses.length - 1)];
}

function randomRating() {
  return randomInt(1, 5);
}

function generateProductDescription(productName) {
  const descriptions = [
    `High quality ${productName}. Carefully selected and packaged.`,
    `Premium ${productName} with excellent condition.`,
    `${productName} - Best value for money in its category.`,
    `Professional grade ${productName}. Highly recommended.`,
    `Brand new ${productName}, sealed and ready to use.`
  ];
  return descriptions[randomInt(0, descriptions.length - 1)];
}

function generateReviewComment(productName) {
  const comments = [
    `Great ${productName}! Exactly as described.`,
    `Very satisfied with this ${productName}.`,
    `${productName} arrived quickly and in perfect condition.`,
    `Excellent quality ${productName} for the price.`,
    `Would recommend this ${productName} to anyone.`,
    `${productName} exceeded my expectations.`,
    `Good value ${productName}. Satisfied with purchase.`
  ];
  return comments[randomInt(0, comments.length - 1)];
}

function generateColumnValue(columnConfig, index, context = {}) {
  if (!columnConfig) return null;

  const { type, value } = columnConfig;

  if (value !== undefined) {
    let processedValue = value;

    if (typeof value === 'string') {
      processedValue = value
        .replace('{index}', index)
        .replace('{random}', Math.random().toString(36).substring(7).toUpperCase());
    }

    switch (type) {
      case 'integer':
        return parseInt(processedValue);
      case 'decimal':
      case 'float':
        return parseFloat(processedValue);
      case 'boolean':
        return processedValue === 'true' || processedValue === true;
      case 'string':
      default:
        return processedValue;
    }
  }

  const customValue = config.seeding.customValues?.[context.table]?.[columnConfig.name];
  if (customValue) {
    switch (customValue.type) {
      case 'random':
        return randomInt(customValue.min, customValue.max);
      case 'boolean':
        return Math.random() < (customValue.trueRatio || 0.5);
      case 'choice':
        return customValue.choices[randomInt(0, customValue.choices.length - 1)];
      default:
        return customValue.value;
    }
  }

  return null;
}

function buildAdditionalColumns(tableName, index, context = {}) {
  const additionalCols = config.database.schema.additionalColumns?.[tableName] || [];

  if (additionalCols.length === 0) {
    return { columns: [], values: [] };
  }

  const columns = [];
  const values = [];

  for (const colConfig of additionalCols) {
    columns.push(colConfig.name);
    values.push(generateColumnValue(colConfig, index, { ...context, table: tableName }));
  }

  return { columns, values };
}

async function connectMySQL() {
  if (!mysql) {
    throw new Error('mysql2 is not installed. Install it with: npm install mysql2');
  }
  return await mysql.createConnection({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
  });
}

async function connectPostgreSQL() {
  const client = new Client({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
  });
  await client.connect();
  return client;
}

async function seedMySQL(connection) {
  const schema = config.database.schema;
  const tables = schema.tables;
  const cols = schema.columns;

  try {
    await connection.beginTransaction();

    const categoryIds = [];
    for (const categoryName of SAMPLE_CATEGORIES) {
      const additionalCategory = buildAdditionalColumns('category', categoryIds.length + 1);
      const categoryColumns = [cols.category.name, ...additionalCategory.columns];
      const placeholders = categoryColumns.map(() => '?').join(', ');

      const [result] = await connection.execute(
        `INSERT INTO ${tables.category} (${categoryColumns.join(', ')}) VALUES (${placeholders})
         ON DUPLICATE KEY UPDATE ${cols.category.name}=${cols.category.name}`,
        [categoryName, ...additionalCategory.values]
      );
      categoryIds.push(result.insertId);
    }

    const [categories] = await connection.execute(
      `SELECT ${cols.category.id} FROM ${tables.category} LIMIT ?`,
      [config.seeding.categoriesCount]
    );
    const actualCategoryIds = categories.map(c => c[cols.category.id]);

    const storeIds = [];
    for (let i = 1; i <= config.seeding.storesCount; i++) {
      const additionalUser = buildAdditionalColumns('user', i);
      const userColumns = [
        cols.user.email, cols.user.password, cols.user.role,
        cols.user.name, cols.user.address, cols.user.balance,
        cols.user.createdAt, cols.user.updatedAt,
        ...additionalUser.columns
      ];
      const userPlaceholders = userColumns.map(() => '?').join(', ');

      const [userResult] = await connection.execute(
        `INSERT INTO ${tables.user} (${userColumns.join(', ')})
         VALUES (${userPlaceholders})
         ON DUPLICATE KEY UPDATE ${cols.user.id}=LAST_INSERT_ID(${cols.user.id})`,
        [
          `seller${i}@test.com`,
          '$2y$10$abcdefghijklmnopqrstuv',
          'SELLER',
          `Seller ${i}`,
          `Address ${i}`,
          0,
          null,
          null,
          ...additionalUser.values
        ].map((v, idx) => {
          if (v === null && (userColumns[idx] === cols.user.createdAt || userColumns[idx] === cols.user.updatedAt)) {
            return connection.raw('NOW()');
          }
          return v;
        })
      );

      const additionalStore = buildAdditionalColumns('store', i);
      const storeColumns = [
        cols.store.userId, cols.store.name, cols.store.description,
        cols.store.logoPath, cols.store.balance,
        cols.store.createdAt, cols.store.updatedAt,
        ...additionalStore.columns
      ];
      const storePlaceholders = storeColumns.map(() => '?').join(', ');

      const [storeResult] = await connection.execute(
        `INSERT INTO ${tables.store} (${storeColumns.join(', ')})
         VALUES (${storePlaceholders})
         ON DUPLICATE KEY UPDATE ${cols.store.id}=LAST_INSERT_ID(${cols.store.id})`,
        [
          userResult.insertId,
          `Store ${i}`,
          `<p>This is store ${i} description</p>`,
          `/images/store${i}.jpg`,
          0,
          null,
          null,
          ...additionalStore.values
        ].map((v, idx) => {
          if (v === null && (storeColumns[idx] === cols.store.createdAt || storeColumns[idx] === cols.store.updatedAt)) {
            return connection.raw('NOW()');
          }
          return v;
        })
      );

      storeIds.push(storeResult.insertId);
    }

    for (let i = 1; i <= config.seeding.productsCount; i++) {
      const storeId = storeIds[randomInt(0, storeIds.length - 1)];
      const productName = `${PRODUCT_TEMPLATES[randomInt(0, PRODUCT_TEMPLATES.length - 1)]} ${i}`;
      const price = randomPrice();
      const stock = randomInt(0, 100);

      const additionalProduct = buildAdditionalColumns('product', i);
      const productColumns = [
        cols.product.storeId, cols.product.name, cols.product.description,
        cols.product.price, cols.product.stock, cols.product.imagePath,
        cols.product.createdAt, cols.product.updatedAt,
        ...additionalProduct.columns
      ];
      const productPlaceholders = productColumns.map(() => '?').join(', ');

      const [productResult] = await connection.execute(
        `INSERT INTO ${tables.product} (${productColumns.join(', ')})
         VALUES (${productPlaceholders})`,
        [
          storeId,
          productName,
          `<p>This is the description for ${productName}</p>`,
          price,
          stock,
          `/images/product${i}.jpg`,
          null,
          null,
          ...additionalProduct.values
        ].map((v, idx) => {
          if (v === null && (productColumns[idx] === cols.product.createdAt || productColumns[idx] === cols.product.updatedAt)) {
            return connection.raw('NOW()');
          }
          return v;
        })
      );

      const categoryId = actualCategoryIds[randomInt(0, actualCategoryIds.length - 1)];
      const additionalCategoryItem = buildAdditionalColumns('categoryItem', i);
      const categoryItemColumns = [
        cols.categoryItem.categoryId, cols.categoryItem.productId,
        ...additionalCategoryItem.columns
      ];
      const categoryItemPlaceholders = categoryItemColumns.map(() => '?').join(', ');

      await connection.execute(
        `INSERT INTO ${tables.categoryItem} (${categoryItemColumns.join(', ')})
         VALUES (${categoryItemPlaceholders})
         ON DUPLICATE KEY UPDATE ${cols.categoryItem.categoryId}=${cols.categoryItem.categoryId}`,
        [categoryId, productResult.insertId, ...additionalCategoryItem.values]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

async function seedPostgreSQL(client) {
  const schema = config.database.schema;
  const tables = schema.tables;
  const cols = schema.columns;

  // Helper to quote identifiers for PostgreSQL
  const quote = (id) => `"${id}"`;

  try {
    await client.query('BEGIN');

    // Seed categories
    for (const categoryName of SAMPLE_CATEGORIES) {
      const additionalCategory = buildAdditionalColumns('category', 1);
      const categoryColumns = [cols.category.name, ...additionalCategory.columns];
      const quotedColumns = categoryColumns.map(quote);
      const placeholders = categoryColumns.map((_, i) => `$${i + 1}`).join(', ');

      await client.query(
        `INSERT INTO "${tables.category}" (${quotedColumns.join(', ')})
         VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        [categoryName, ...additionalCategory.values]
      );
    }

    const categoriesResult = await client.query(
      `SELECT "${cols.category.id}" FROM "${tables.category}" LIMIT $1`,
      [config.seeding.categoriesCount]
    );
    const categoryIds = categoriesResult.rows.map(c => c[cols.category.id]);

    // Create seller users and stores
    const storeIds = [];
    const buyerIds = [];
    for (let i = 1; i <= config.seeding.storesCount; i++) {
      const additionalUser = buildAdditionalColumns('user', i);
      const passwordHash = await hashPassword('password123');
      
      const userColumns = [
        cols.user.email, cols.user.password, cols.user.role,
        cols.user.name, cols.user.address, cols.user.balance,
        cols.user.createdAt, cols.user.updatedAt,
        ...additionalUser.columns
      ];
      const quotedUserColumns = userColumns.map(quote);
      const userPlaceholders = userColumns.map((_, idx) => `$${idx + 1}`).join(', ');

      const userResult = await client.query(
        `INSERT INTO "${tables.user}" (${quotedUserColumns.join(', ')})
         VALUES (${userPlaceholders})
         ON CONFLICT ("${cols.user.email}") DO UPDATE SET "${cols.user.email}" = EXCLUDED."${cols.user.email}"
         RETURNING "${cols.user.id}"`,
        [
          `seller${i}@test.com`,
          passwordHash,
          'SELLER',
          `Seller ${i}`,
          `Jl. Seller No. ${i}`,
          1000000,
          new Date(),
          new Date(),
          ...additionalUser.values
        ]
      );

      const additionalStore = buildAdditionalColumns('store', i);
      const storeColumns = [
        cols.store.userId, cols.store.name, cols.store.description,
        cols.store.logoPath, cols.store.balance,
        cols.store.createdAt, cols.store.updatedAt,
        ...additionalStore.columns
      ];
      const quotedStoreColumns = storeColumns.map(quote);
      const storePlaceholders = storeColumns.map((_, idx) => `$${idx + 1}`).join(', ');

      const storeResult = await client.query(
        `INSERT INTO "${tables.store}" (${quotedStoreColumns.join(', ')})
         VALUES (${storePlaceholders})
         ON CONFLICT ("${cols.store.userId}") DO UPDATE SET "${cols.store.userId}" = EXCLUDED."${cols.store.userId}"
         RETURNING "${cols.store.id}"`,
        [
          userResult.rows[0][cols.user.id],
          `Store ${i}`,
          `<p>This is store ${i} description</p>`,
          `/images/store${i}.jpg`,
          1000000,
          new Date(),
          new Date(),
          ...additionalStore.values
        ]
      );

      storeIds.push(storeResult.rows[0][cols.store.id]);
    }

    // Create buyer users
    for (let i = 1; i <= 50; i++) {
      const additionalUser = buildAdditionalColumns('user', 100 + i);
      const passwordHash = await hashPassword('password123');
      
      const userColumns = [
        cols.user.email, cols.user.password, cols.user.role,
        cols.user.name, cols.user.address, cols.user.balance,
        cols.user.createdAt, cols.user.updatedAt,
        ...additionalUser.columns
      ];
      const quotedUserColumns = userColumns.map(quote);
      const userPlaceholders = userColumns.map((_, idx) => `$${idx + 1}`).join(', ');

      const buyerResult = await client.query(
        `INSERT INTO "${tables.user}" (${quotedUserColumns.join(', ')})
         VALUES (${userPlaceholders})
         ON CONFLICT ("${cols.user.email}") DO UPDATE SET "${cols.user.email}" = EXCLUDED."${cols.user.email}"
         RETURNING "${cols.user.id}"`,
        [
          `buyer${i}@test.com`,
          passwordHash,
          'BUYER',
          `Buyer ${i}`,
          `Jl. Buyer No. ${i}`,
          5000000,
          new Date(),
          new Date(),
          ...additionalUser.values
        ]
      );

      buyerIds.push(buyerResult.rows[0][cols.user.id]);
    }

    // Seed products
    const productIds = [];
    for (let i = 1; i <= config.seeding.productsCount; i++) {
      const storeId = storeIds[randomInt(0, storeIds.length - 1)];
      const productName = `${PRODUCT_TEMPLATES[randomInt(0, PRODUCT_TEMPLATES.length - 1)]} ${i}`;
      const price = randomPrice();
      const stock = randomInt(10, 100);

      const additionalProduct = buildAdditionalColumns('product', i);
      const productColumns = [
        cols.product.storeId, cols.product.name, cols.product.description,
        cols.product.price, cols.product.stock, cols.product.imagePath,
        cols.product.createdAt, cols.product.updatedAt,
        ...additionalProduct.columns
      ];
      const quotedProductColumns = productColumns.map(quote);
      const productPlaceholders = productColumns.map((_, idx) => `$${idx + 1}`).join(', ');

      const productResult = await client.query(
        `INSERT INTO "${tables.product}" (${quotedProductColumns.join(', ')})
         VALUES (${productPlaceholders})
         RETURNING "${cols.product.id}"`,
        [
          storeId,
          productName,
          generateProductDescription(productName),
          price,
          stock,
          `/images/product${i}.jpg`,
          new Date(),
          new Date(),
          ...additionalProduct.values
        ]
      );

      productIds.push(productResult.rows[0][cols.product.id]);

      const categoryId = categoryIds[randomInt(0, categoryIds.length - 1)];
      const additionalCategoryItem = buildAdditionalColumns('categoryItem', i);
      const categoryItemColumns = [
        cols.categoryItem.categoryId, cols.categoryItem.productId,
        ...additionalCategoryItem.columns
      ];
      const quotedCategoryItemColumns = categoryItemColumns.map(quote);
      const categoryItemPlaceholders = categoryItemColumns.map((_, idx) => `$${idx + 1}`).join(', ');

      await client.query(
        `INSERT INTO "${tables.categoryItem}" (${quotedCategoryItemColumns.join(', ')})
         VALUES (${categoryItemPlaceholders})
         ON CONFLICT DO NOTHING`,
        [categoryId, productResult.rows[0][cols.product.id], ...additionalCategoryItem.values]
      );
    }

    // Seed orders
    for (let i = 1; i <= config.seeding.ordersCount; i++) {
      const productId = productIds[randomInt(0, productIds.length - 1)];
      const buyerId = buyerIds[randomInt(0, buyerIds.length - 1)];
      const sellerId = storeIds[randomInt(0, storeIds.length - 1)];
      const status = randomOrderStatus();
      const totalPrice = randomPrice();

      const additionalOrder = buildAdditionalColumns('order', i);
      const orderColumns = [
        cols.order.buyerId, cols.order.sellerId,
        cols.order.totalPrice, cols.order.orderStatus,
        'shipping_address',
        cols.order.createdAt,
        ...additionalOrder.columns
      ];
      const quotedOrderColumns = orderColumns.map(quote);
      const orderPlaceholders = orderColumns.map((_, idx) => `$${idx + 1}`).join(', ');

      const orderResult = await client.query(
        `INSERT INTO "${tables.order}" (${quotedOrderColumns.join(', ')})
         VALUES (${orderPlaceholders})
         RETURNING "${cols.order.id}"`,
        [
          buyerId,
          sellerId,
          totalPrice,
          status,
          `Jl. Delivery No. ${i}`,
          new Date(),
          ...additionalOrder.values
        ]
      );

      // Seed order items for this order
      const additionalOrderItem = buildAdditionalColumns('orderItem', i);
      const quantity = randomInt(1, 3);
      const orderItemColumns = [
        cols.orderItem.orderId, cols.orderItem.productId,
        cols.orderItem.quantity, cols.orderItem.price,
        'subtotal',
        ...additionalOrderItem.columns
      ];
      const quotedOrderItemColumns = orderItemColumns.map(quote);
      const orderItemPlaceholders = orderItemColumns.map((_, idx) => `$${idx + 1}`).join(', ');

      await client.query(
        `INSERT INTO "${tables.orderItem}" (${quotedOrderItemColumns.join(', ')})
         VALUES (${orderItemPlaceholders})`,
        [
          orderResult.rows[0][cols.order.id],
          productId,
          quantity,
          totalPrice,
          quantity * totalPrice,
          ...additionalOrderItem.values
        ]
      );
    }

    // Seed reviews - fetch existing orders first
    const ordersResult = await client.query(
      `SELECT "${cols.order.id}", "${cols.order.buyerId}", "${cols.order.sellerId}" FROM "${tables.order}" LIMIT $1`,
      [config.seeding.ordersCount]
    );
    const orders = ordersResult.rows;

    for (let i = 1; i <= config.seeding.reviewsCount && i <= orders.length; i++) {
      const order = orders[i - 1];
      const orderId = order[cols.order.id];
      const buyerId = order[cols.order.buyerId];
      const storeId = order[cols.order.sellerId];
      
      // Get a product from this store
      const productResult = await client.query(
        `SELECT "${cols.product.id}", "${cols.product.name}" FROM "${tables.product}" WHERE "${cols.product.storeId}" = $1 LIMIT 1`,
        [storeId]
      );
      
      if (productResult.rows.length === 0) continue;
      
      const productId = productResult.rows[0][cols.product.id];
      const productName = productResult.rows[0][cols.product.name];
      const rating = randomRating();

      const additionalReview = buildAdditionalColumns('productReview', i);
      const reviewColumns = [
        cols.productReview.productId, cols.productReview.buyerId,
        cols.productReview.orderId, cols.productReview.storeId,
        cols.productReview.rating, cols.productReview.reviewText,
        cols.productReview.createdAt, cols.productReview.updatedAt,
        ...additionalReview.columns
      ];
      const quotedReviewColumns = reviewColumns.map(quote);
      const reviewPlaceholders = reviewColumns.map((_, idx) => `$${idx + 1}`).join(', ');

      const reviewResult = await client.query(
        `INSERT INTO "${tables.productReview}" (${quotedReviewColumns.join(', ')})
         VALUES (${reviewPlaceholders})
         RETURNING "${cols.productReview.id}"`,
        [
          productId,
          buyerId,
          orderId,
          storeId,
          rating,
          generateReviewComment(productName),
          new Date(),
          new Date(),
          ...additionalReview.values
        ]
      );

      // Seed seller response for some reviews
      if (Math.random() < 0.6) {
        const additionalResponse = buildAdditionalColumns('sellerResponse', i);
        const responseColumns = [
          cols.sellerResponse.reviewId, cols.sellerResponse.storeId,
          cols.sellerResponse.responseText,
          cols.sellerResponse.createdAt, cols.sellerResponse.updatedAt,
          ...additionalResponse.columns
        ];
        const quotedResponseColumns = responseColumns.map(quote);
        const responsePlaceholders = responseColumns.map((_, idx) => `$${idx + 1}`).join(', ');

        const responses = [
          'Thank you for your review! We appreciate your feedback.',
          'We are glad you enjoyed our product. Thank you for shopping with us!',
          'Your satisfaction is our priority. Thank you for choosing us!',
          'We appreciate your business. Please reach out if you need anything else.',
          'Thank you for the kind words! We hope to serve you again soon.'
        ];

        await client.query(
          `INSERT INTO "${tables.sellerResponse}" (${quotedResponseColumns.join(', ')})
           VALUES (${responsePlaceholders})`,
          [
            reviewResult.rows[0][cols.productReview.id],
            storeId,
            responses[randomInt(0, responses.length - 1)],
            new Date(),
            new Date(),
            ...additionalResponse.values
          ]
        );
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function seed() {
  if (!config.seeding.enabled) {
    console.log('Seeding is disabled in config');
    return;
  }

  console.log('Starting database seeding');
  console.log(`  Database: ${config.database.type}`);
  console.log(`  Categories: ${config.seeding.categoriesCount}`);
  console.log(`  Stores: ${config.seeding.storesCount}`);
  console.log(`  Products: ${config.seeding.productsCount}`);
  console.log(`  Orders: ${config.seeding.ordersCount}`);
  console.log(`  Reviews: ${config.seeding.reviewsCount}`);
  console.log('');

  try {
    if (config.database.type === 'mysql' || config.database.type === 'mariadb') {
      const connection = await connectMySQL();
      await seedMySQL(connection);
      await connection.end();
    } else if (config.database.type === 'postgresql') {
      const client = await connectPostgreSQL();
      await seedPostgreSQL(client);
      await client.end();
    } else {
      throw new Error(`Unsupported database type: ${config.database.type}`);
    }

    console.log('');
    console.log('Seeding completed successfully');
    console.log('You can now run the load test with: npm run test');

  } catch (error) {
    console.error('');
    console.error('Seeding failed');
    console.error('Error:', error.message);
    console.error('');
    console.error('Tips:');
    console.error('  - Check if your database is running');
    console.error('  - Verify database credentials in k6-config.json');
    console.error('  - Ensure tables are created (run migrations first)');
    console.error('  - Verify schema configuration matches your database');
    console.error('  - For PostgreSQL, ensure bcrypt is installed: npm install bcrypt');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}

export { seed };
