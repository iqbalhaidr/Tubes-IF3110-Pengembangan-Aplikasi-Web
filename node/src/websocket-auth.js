import pool from './db.js';
import { createClient } from 'redis';

// Create and connect the Redis client
const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`
});

redisClient.on('error', (err) => console.error('[Redis Client Error]', err));

// connect to the client before using it
redisClient.connect();

const parseUserIdFromPHPSession = (sessionData) => {
    if (!sessionData) return null;
    const match = sessionData.match(/user_id\|i:(\d+);/);
    return match ? parseInt(match[1], 10) : null;
};

// Extracts a specific cookie value from a cookie header string.

const getCookie = (cookieHeader, cookieName) => {
    if (!cookieHeader) return null;
    const name = cookieName + "=";
    const decodedCookie = decodeURIComponent(cookieHeader);
    const ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return null;
}


// Verify PHP session from Redis and get user data from PostgreSQL

export const verifyPHPSession = async (rawCookieHeader) => {
  try {
    const sessionName = process.env.SESSION_NAME || 'NIMONSPEDIA_SESSION';
    const sessionId = getCookie(rawCookieHeader, sessionName);
    
    if (!sessionId) {
        console.log('[WebSocket Auth] No session ID found in cookie.');
        return null;
    }

    const redisKey = `PHPREDIS_SESSION:${sessionId}`;
    const sessionData = await redisClient.get(redisKey);

    if (!sessionData) {
        console.log(`[WebSocket Auth] Session data not found in Redis for key: ${redisKey}`);
        return null;
    }

    const userId = parseUserIdFromPHPSession(sessionData);

    if (!userId) {
        console.log(`[WebSocket Auth] Could not parse userId from session data: ${sessionData}`);
        return null;
    }

    // fetch user details from PostgreSQL
    const { rows } = await pool.query('SELECT user_id, name, email, role FROM "user" WHERE user_id = $1', [userId]);

    if (rows.length === 0) {
        console.log(`[WebSocket Auth] User with ID ${userId} not found in PostgreSQL.`);
        return null;
    }

    const user = rows[0];

    // If user is a seller, fetch store_id
    if (user.role === 'SELLER') {
        const storeResult = await pool.query('SELECT store_id FROM store WHERE seller_id = $1 LIMIT 1', [userId]);
        if (storeResult.rows.length > 0) {
            user.store_id = storeResult.rows[0].store_id;
        }
    }

    console.log(`[WebSocket Auth] Successfully verified user: ID ${user.user_id}`);
    return user;

  } catch (error) {
    console.error('[WebSocket Auth Error]', error);
    return null;
  }
};

// Middleware to authenticate WebSocket connections
export const socketAuthMiddleware = async (socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie;
  
  if (!cookieHeader) {
    return next(new Error('Authentication error: No cookie transmitted.'));
  }

  try {
    const user = await verifyPHPSession(cookieHeader);
    if (!user) {
      return next(new Error('Authentication error: Invalid session.'));
    }
    
    socket.userId = user.user_id;
    socket.userRole = user.role;
    socket.username = user.name;
    next();
  } catch (err) {
    next(new Error('Authentication error: ' + err.message));
  }
};
