// Database connection pool for Node.js backend
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('error', (err) => {
  console.error('[Database Pool Error]', err);
});

pool.on('connect', () => {
  console.log('[Database] Connected successfully');
});

// Named export for compatibility
export { pool };
export default pool;
