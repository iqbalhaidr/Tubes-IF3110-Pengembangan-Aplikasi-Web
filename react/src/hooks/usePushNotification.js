import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Converts a VAPID key from a URL-safe base64 string to a Uint8Array.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// A custom hook to manage push notification subscription logic.
function usePushNotification() {
  const [subscription, setSubscription] = useState(null);
  const [permission, setPermission] = useState('default');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing subscription on component mount
  useEffect(() => {
    const checkSubscription = async () => {
      if ('Notification' in window && navigator.serviceWorker) {
        setPermission(Notification.permission);
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setSubscription(sub);
        setLoading(false);
      } else {
        setLoading(false);
      }
    };
    checkSubscription();
  }, []);

  // subscribe
  const subscribeToPush = useCallback(async (userId) => {
    setError(null);
    if (Notification.permission === 'denied') {
        const err = new Error('Permission for notifications was denied. Please enable it in your browser settings.');
        setError(err);
        throw err;
    }
    
    try {
      const reg = await navigator.serviceWorker.ready;
      // Unsubscribe from any existing subscription first to ensure a clean state
      let currentSub = await reg.pushManager.getSubscription();
      if (currentSub) {
        await currentSub.unsubscribe();
      }

      // Get VAPID public key from the backend
      const { data } = await axios.get('/api/node/push/vapid-public-key', { withCredentials: true });
      const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

      // Create a new subscription
      const newSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      // Send the new subscription to the backend to be saved
      await axios.post('/api/node/push/subscribe', { userId, subscription: newSub.toJSON() }, { withCredentials: true });
      
      setSubscription(newSub);
      console.log('Successfully subscribed to push notifications.');
      return newSub;

    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err);
      setError(err);
      throw err;
    }
  }, []);

  // unsubs
  const unsubscribeFromPush = useCallback(async (userId) => {
    if (!subscription) return;
    setError(null);

    try {
      // Unsubscribe on the client
      await subscription.unsubscribe();
      
      // Notify the backend to delete the subscription
      await axios.post('/api/node/push/unsubscribe', { userId, endpoint: subscription.endpoint }, { withCredentials: true });

      setSubscription(null);
      console.log('Successfully unsubscribed from push notifications.');

    } catch (err) {
      console.error('Failed to unsubscribe from push notifications:', err);
      setError(err);
      throw err;
    }
  }, [subscription]);

  return { 
    permission, 
    subscription, 
    subscribeToPush, 
    unsubscribeFromPush,
    error,
    loading 
  };
}

export default usePushNotification;
