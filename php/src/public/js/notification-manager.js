// Vanilla JS manager for handling Push Notification subscriptions To be used on PHP-rendered pages
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

let pushServiceWorkerRegistration = null;
let currentSubscription = null;
let masterNotificationButton = null;
let notificationStatusText = null;

async function updateButtonState() {
    if (!masterNotificationButton) return;

    const permission = Notification.permission;
    notificationStatusText.textContent = `Browser permission: ${permission}`;

    if (permission === 'denied') {
        masterNotificationButton.textContent = 'Notifications Blocked';
        masterNotificationButton.disabled = true;
        return;
    }

    if (currentSubscription) {
        masterNotificationButton.textContent = 'Disable Notifications';
        masterNotificationButton.disabled = false;
    } else {
        masterNotificationButton.textContent = 'Enable Notifications';
        masterNotificationButton.disabled = false;
    }
}

async function handleMasterButtonClick() {
    masterNotificationButton.disabled = true;

    if (currentSubscription) {
        // Unsubscribe
        try {
            await currentSubscription.unsubscribe();
            await window.api.post('/api/node/push/unsubscribe', { endpoint: currentSubscription.endpoint });
            currentSubscription = null;
            showToast('Notifications disabled.', 'success');
        } catch (err) {
            console.error('Error unsubscribing:', err);
            showToast('Failed to disable notifications.', 'error');
        }
    } else {
        // Subscribe
        try {
            const response = await window.api.get('/api/node/push/vapid-public-key');
            const applicationServerKey = urlBase64ToUint8Array(response.publicKey);
            
            const newSubscription = await pushServiceWorkerRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            });

            await window.api.post('/api/node/push/subscribe', { subscription: newSubscription.toJSON() });
            
            currentSubscription = newSubscription;
            showToast('Notifications enabled!', 'success');
        } catch (err) {
            console.error('Error subscribing:', err);
            showToast('Failed to enable notifications. Please make sure you allow notifications in the browser pop-up.', 'error');
        }
    }
    updateButtonState();
}

async function initializeNotificationManager() {
    masterNotificationButton = document.getElementById('masterNotificationBtn');
    notificationStatusText = document.getElementById('notificationStatusText');

    if (!masterNotificationButton || !notificationStatusText) {
        console.log('Notification manager UI not found on this page.');
        return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        notificationStatusText.textContent = 'Push notifications not supported by this browser.';
        masterNotificationButton.style.display = 'none';
        return;
    }

    try {
        pushServiceWorkerRegistration = await navigator.serviceWorker.ready;
        currentSubscription = await pushServiceWorkerRegistration.pushManager.getSubscription();
        masterNotificationButton.addEventListener('click', handleMasterButtonClick);
        updateButtonState();
    } catch (err) {
        console.error('Service worker not ready:', err);
        notificationStatusText.textContent = 'Could not initialize notification manager.';
    }
}

// Ensure showToast is available or define a fallback
if (typeof showToast === 'undefined') {
    window.showToast = function(message, type = 'success') {
        alert(`(${type}) ${message}`);
    }
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeNotificationManager);
