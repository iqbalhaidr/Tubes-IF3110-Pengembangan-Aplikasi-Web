import webPush from 'web-push';
import pool from '../db.js';

// --- VAPID Configuration ---
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@nimonspedia.com';
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

let isPushConfigured = false;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && !VAPID_PUBLIC_KEY.includes('your_vapid')) {
  try {
    webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    isPushConfigured = true;
    console.log('[Push Service] VAPID configured successfully');
  } catch (error) {
    console.warn('[Push Service] Failed to configure VAPID:', error.message);
  }
} else {
  console.warn('[Push Service] VAPID not configured. Push notifications disabled.');
}

// A safelist of valid feature flags and their corresponding column names
const validFeatureFlags = {
    'chat_enabled': 'chat_enabled',
    'auction_enabled': 'auction_enabled',
    'order_enabled': 'order_enabled'
};


// Sends a push notification to a specific user after checking their preferences for a given feature.

async function sendPushNotification(recipientUserId, payload, featureFlag) {
  if (!isPushConfigured) {
    return { status: 'skipped', reason: 'Push service not configured' };
  }

  const preferenceColumn = validFeatureFlags[featureFlag];
  if (!preferenceColumn) {
    console.error(`[Push Service] Invalid feature flag "${featureFlag}" provided.`);
    return { status: 'error', reason: `Invalid feature flag: ${featureFlag}` };
  }

  // Check user's notification preferences for the specific feature
  try {
    // build the query to check the preference column
    const preferenceQuery = `SELECT ${preferenceColumn} FROM push_preferences WHERE user_id = $1`;
    const { rows: prefs } = await pool.query(preferenceQuery, [recipientUserId]);
    
    // If user has a preference entry and the specific flag is false, skip sending
    if (prefs.length > 0 && !prefs[0][preferenceColumn]) {
      console.log(`[Push Service] Skipped for user ${recipientUserId}: "${featureFlag}" disabled in preferences.`);
      return { status: 'skipped', reason: 'User preference disabled' };
    }
  } catch (prefError) {
    console.error(`[Push Service] Error fetching preferences for user ${recipientUserId}:`, prefError);
    // Continue, assuming default is enabled if preference check fails
  }

  // Get all valid subscriptions for the user
  let subs;
  try {
    const { rows } = await pool.query(
      'SELECT subscription_id, endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE user_id = $1',
      [recipientUserId]
    );
    subs = rows;
  } catch (subError) {
    console.error(`[Push Service] Error fetching subscriptions for user ${recipientUserId}:`, subError);
    return { status: 'error', reason: 'Failed to fetch subscriptions.' };
  }

  if (subs.length === 0) {
    return { status: 'skipped', reason: 'No subscriptions found' };
  }

  // Send notifications to all subscriptions
  const results = await Promise.allSettled(subs.map(async (sub) => {
    try {
      await webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
        JSON.stringify(payload)
      );
      return { success: true };
    } catch (err) {
      console.error(`[Push Service] Failed to send notification to user ${recipientUserId}. Status: ${err.statusCode}`);
      // If subscription is expired or invalid (410 or 404), remove it from the database.
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.log(`[Push Service] Deleting expired subscription for user ${recipientUserId}.`);
        await pool.query('DELETE FROM push_subscriptions WHERE subscription_id = $1', [sub.subscription_id]);
      }
      return { success: false, error: err };
    }
  }));
  
  const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failedCount = results.length - successCount;

  console.log(`[Push Service] Summary for user ${recipientUserId}: ${successCount} sent, ${failedCount} failed.`);
  return { status: 'completed', success: successCount, failed: failedCount };
}

async function sendChatPushNotification(recipientUserId, payload) {
    return sendPushNotification(recipientUserId, payload, 'chat_enabled');
}

export { sendPushNotification, sendChatPushNotification, isPushConfigured };