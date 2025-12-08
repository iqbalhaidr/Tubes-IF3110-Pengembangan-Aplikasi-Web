import webPush from 'web-push';
import pool from '../db.js';

// Check if VAPID is properly configured
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@nimonspedia.com';
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

let isPushConfigured = false;

// Only configure web-push if VAPID keys are properly set (not placeholder values)
if (VAPID_PUBLIC_KEY &&
  VAPID_PRIVATE_KEY &&
  !VAPID_PUBLIC_KEY.includes('your_vapid') &&
  !VAPID_PRIVATE_KEY.includes('your_vapid')) {
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

// Sends a push notification to a specific user after checking their preferences.

async function sendChatPushNotification(recipientUserId, payload) {
  // Skip if push notifications are not configured
  if (!isPushConfigured) {
    console.log('[Push Service] Push not configured, skipping notification.');
    return { notConfigured: true };
  }

  // Check user's notification preferences
  try {
    const { rows: prefs } = await pool.query(
      'SELECT chat_enabled FROM push_preferences WHERE user_id = $1',
      [recipientUserId]
    );
    if (prefs.length > 0 && !prefs[0].chat_enabled) {
      console.log(`Push notification skipped for user ${recipientUserId} due to their preferences.`);
      return { skipped: true };
    }
  } catch (prefError) {
    console.error(`Error fetching push preferences for user ${recipientUserId}:`, prefError);
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
    console.error(`Error fetching push subscriptions for user ${recipientUserId}:`, subError);
    return { error: 'Failed to fetch subscriptions.' };
  }

  if (!subs.length) {
    console.log(`No push subscriptions found for user ${recipientUserId}.`);
    return { noSubscriptions: true };
  }

  // Send notifications to all subscriptions
  let success = 0, failed = 0;
  await Promise.allSettled(subs.map(async (sub) => {
    try {
      await webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
        JSON.stringify(payload)
      );
      success++;
    } catch (err) {
      failed++;
      console.error(`Failed to send push notification to endpoint for user ${recipientUserId}. Status: ${err.statusCode}`);
      // If subscription is expired or invalid (410 or 404), remove it from the database.
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.log(`Subscription expired for user ${recipientUserId}. Deleting from DB.`);
        try {
          await pool.query('DELETE FROM push_subscriptions WHERE subscription_id = $1', [sub.subscription_id]);
        } catch (deleteError) {
          console.error(`Failed to delete expired subscription ${sub.subscription_id}:`, deleteError);
        }
      }
    }
  }));

  console.log(`Push notification summary for user ${recipientUserId}: ${success} sent, ${failed} failed.`);
  return { success, failed };
}

export { sendChatPushNotification, isPushConfigured };