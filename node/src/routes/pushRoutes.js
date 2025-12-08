import express from 'express';
import pool from '../db.js';
import { verifyPHPSession } from '../websocket-auth.js';
import { sendChatPushNotification } from '../services/pushService.js';

const router = express.Router();

// middleware to authenticate user
const authenticateUser = async (req, res, next) => {
    try {
        const user = await verifyPHPSession(req.headers.cookie);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid or expired session.' });
        }
        req.user = user;
        next();
    } catch (err) {
        console.error('Authentication middleware error:', err);
        return res.status(500).json({ error: 'Authentication failed due to an internal error.' });
    }
};

// Route to provide the VAPID public key to the frontend.
router.get('/vapid-public-key', (req, res) => {
  if (!process.env.VAPID_PUBLIC_KEY) {
      console.error('VAPID_PUBLIC_KEY is not configured in .env file.');
      return res.status(500).json({ error: 'Push notification service is not configured on the server.' });
  }
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post('/subscribe', authenticateUser, async (req, res) => {
  const { subscription } = req.body;
  const userId = req.user.user_id;

  if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return res.status(400).json({ error: 'The subscription object provided is incomplete.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const upsertQuery = `
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (endpoint) DO UPDATE SET
            p256dh_key = EXCLUDED.p256dh_key,
            auth_key = EXCLUDED.auth_key,
            user_id = EXCLUDED.user_id;
    `;
    await client.query(upsertQuery, [
        userId, 
        subscription.endpoint, 
        subscription.keys.p256dh, 
        subscription.keys.auth
    ]);

    await client.query(
      'INSERT INTO push_preferences (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
      [userId]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Subscription saved successfully.' });

  } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error during /subscribe:', err);
      res.status(500).json({ error: 'Failed to save subscription due to a server error.' });
  } finally {
      client.release();
  }
});


router.post('/unsubscribe', authenticateUser, async (req, res) => {
  const { endpoint } = req.body;
  const userId = req.user.user_id;
  
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint is required to unsubscribe.' });
  }
  try {
    const result = await pool.query('DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2', [userId, endpoint]);
    if (result.rowCount > 0) {
        res.json({ success: true, message: 'Unsubscribed successfully.' });
    } else {
        res.status(404).json({ success: false, message: 'Subscription not found.' });
    }
  } catch (err) {
      console.error('Error during /unsubscribe:', err);
      res.status(500).json({ error: 'Failed to unsubscribe due to a server error.' });
  }
});

router.post('/test', authenticateUser, async (req, res) => {
  const userId = req.user.user_id;
  const { message } = req.body;
  
  try {
    const result = await sendChatPushNotification(userId, {
      title: 'Test Notification',
      body: message || 'This is a test notification from Nimonspedia!',
      icon: '/icon.png',
      data: { type: 'test', url: '/' }
    });

    res.json({ success: true, result });
  } catch (err) {
      console.error('Error during /test:', err);
      res.status(500).json({ error: 'Failed to send test notification.' });
  }
});

export default router;