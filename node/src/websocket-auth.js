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
    console.log('[WebSocket Auth] Verifying session. Full cookie header:', rawCookieHeader);
    const sessionName = process.env.SESSION_NAME || 'NIMONSPEDIA_SESSION';
    const sessionId = getCookie(rawCookieHeader, sessionName);
    
    if (!sessionId) {
        console.log(`[WebSocket Auth] Could not find cookie with name '${sessionName}'.`);
        return null;
    }
    console.log(`[WebSocket Auth] Found session ID: ${sessionId}`);

    const redisKey = `PHPREDIS_SESSION:${sessionId}`;
    console.log(`[WebSocket Auth] Constructed Redis key: ${redisKey}`);
    
    const sessionData = await redisClient.get(redisKey);

    if (!sessionData) {
        console.log(`[WebSocket Auth] Session data NOT FOUND in Redis for key: ${redisKey}`);
        return null;
    }
    console.log(`[WebSocket Auth] Found session data in Redis: ${sessionData}`);

    const userId = parseUserIdFromPHPSession(sessionData);

    if (!userId) {
        console.log(`[WebSocket Auth] Could not parse user_id from session data.`);
        return null;
    }
    console.log(`[WebSocket Auth] Parsed user_id: ${userId}`);

    // fetch user details from PostgreSQL
    const { rows } = await pool.query('SELECT user_id, name, email, role FROM "user" WHERE user_id = $1', [userId]);

    if (rows.length === 0) {
        console.log(`[WebSocket Auth] User with ID ${userId} not found in PostgreSQL.`);
        return null;
    }

    console.log(`[WebSocket Auth] Successfully verified user: ID ${rows[0].user_id}`);
    return rows[0];

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
    next();
  } catch (err) {
    next(new Error('Authentication error: ' + err.message));
  }
};
