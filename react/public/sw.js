self.addEventListener('push', (event) => {
    const data = event.data.json();
    console.log('[Service Worker] Push Received.', data);

    const title = data.title || 'Nimonspedia';
    const options = {
        body: data.body || 'You have a new notification.',
        icon: '/icon.png',
        badge: '/badge.png',
        data: {
            url: data.data?.url || '/'
        }
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click Received.');
    event.notification.close();

    const urlToOpen = event.notification.data.url;

    event.waitUntil(
        clients.matchAll({
            type: 'window'
        }).then((clientList) => {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
