// Firebase Cloud Messaging & Web Push Service Worker for Agent Medina Game

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listener for background push notifications from FCM / Web Push (when app is closed or background)
self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload = {
        title: '⚔️ Torn de Duel - Agent Medina',
        body: event.data.text() || '¡Es tu turno en la partida!'
      };
    }
  }

  const notificationTitle = payload.notification?.title || payload.title || '⚔️ Torn de Duel - Agent Medina';
  const notificationOptions = {
    body: payload.notification?.body || payload.body || '¡Es tu turno en la partida!',
    icon: payload.notification?.icon || payload.icon || '/app-logo-192.png',
    badge: '/app-logo-192.png',
    vibrate: [300, 100, 300, 100, 300],
    tag: payload.data?.tag || payload.tag || `duel_${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: {
      url: payload.data?.url || payload.url || '/?tab=duels',
      matchId: payload.data?.matchId || payload.matchId,
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'play_turn',
        title: 'Jugar Torn Ara ⚔️'
      },
      {
        action: 'dismiss',
        title: 'Més tard'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

// Message listener from foreground pages to trigger OS tray notifications reliably on Android
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        body: options?.body || '',
        icon: options?.icon || '/app-logo-192.png',
        badge: '/app-logo-192.png',
        vibrate: [250, 100, 250],
        tag: options?.tag || `agent_medina_${Date.now()}`,
        renotify: true,
        requireInteraction: true,
        data: options?.data || { url: '/?tab=duels' }
      })
    );
  }
});

// Click listener to refocus or open the match from notification bar
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/?tab=duels';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            matchId: event.notification.data?.matchId
          });
          return;
        }
      }
      // If not open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
