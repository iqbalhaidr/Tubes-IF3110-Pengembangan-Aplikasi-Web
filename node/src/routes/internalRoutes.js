import express from 'express';
import { sendPushNotification } from '../services/pushService.js';

const router = express.Router();

const internalOnly = (req, res, next) => {
    const remoteIp = req.socket.remoteAddress;
    if (remoteIp === '::1' || remoteIp === '127.0.0.1' || remoteIp.includes('172.') || remoteIp.includes('192.168.')) {
        next();
    } else {
        console.warn(`[INTERNAL API] Denied access from external IP: ${remoteIp}`);
        res.status(403).json({ error: 'Forbidden: Access denied.' });
    }
};

router.use(internalOnly);

router.post('/send-notification', async (req, res) => {
    const { userId, featureFlag, payload } = req.body;

    if (!userId || !featureFlag || !payload) {
        return res.status(400).json({ error: 'Missing required fields: userId, featureFlag, payload' });
    }

    try {
        const result = await sendPushNotification(userId, payload, featureFlag);
        res.status(200).json({ success: true, result });
    } catch (error) {
        console.error('[INTERNAL API] Error sending notification:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

export default router;
