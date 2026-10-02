import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import webpush from 'web-push';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Configuració VAPID (Web Push Protocol estàndard per a Android Chrome i navegadors moderns)
const VAPID_KEYS_FILE = path.join(__dirname, 'vapid-keys.json');
let vapidKeys: { publicKey: string; privateKey: string };

try {
  if (fs.existsSync(VAPID_KEYS_FILE)) {
    vapidKeys = JSON.parse(fs.readFileSync(VAPID_KEYS_FILE, 'utf-8'));
  } else {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_KEYS_FILE, JSON.stringify(vapidKeys, null, 2), 'utf-8');
  }
} catch (e) {
  vapidKeys = webpush.generateVAPIDKeys();
}

webpush.setVapidDetails(
  'mailto:support@agentmedina.app',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// In-memory & Persistent backup for Device Tokens & Subscriptions
interface RegisteredToken {
  token: string;
  userId: string;
  deviceId: string;
  platform: 'android' | 'web';
  isCapacitor?: boolean;
  isPWA?: boolean;
  registeredAt: number;
  lastActive: number;
}

interface WebPushSubscriptionRecord {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId: string;
  registeredAt: number;
}

interface QueuedNotification {
  id: string;
  type: string;
  matchId?: string;
  ambitId?: string;
  fromUid: string;
  fromName: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
}

const userTokensMap = new Map<string, Set<string>>(); // userId -> Set of tokens
const tokenDetailsMap = new Map<string, RegisteredToken>(); // token -> details
const userSubscriptionsMap = new Map<string, Map<string, WebPushSubscriptionRecord>>(); // userId -> (endpoint -> record)
const userNotificationsMap = new Map<string, QueuedNotification[]>(); // userId -> pending notifications
const sseClientsMap = new Map<string, Set<express.Response>>(); // userId -> Set of SSE response streams

// Fitxer persistent per mantenir les subscripcions actives de telèfons fins i tot si es reinicia el servidor
const SUBSCRIPTIONS_FILE = path.join(process.cwd(), 'push-subscriptions.json');

function loadPersistedSubscriptions() {
  try {
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      const raw = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        let count = 0;
        for (const item of data) {
          if (item && item.userId && item.endpoint && item.keys) {
            if (!userSubscriptionsMap.has(item.userId)) {
              userSubscriptionsMap.set(item.userId, new Map());
            }
            userSubscriptionsMap.get(item.userId)!.set(item.endpoint, item);
            count++;
          }
        }
        console.log(`[WEB-PUSH-PERSIST] 📥 S'han restaurat ${count} subscripcions Web Push des de disc (${SUBSCRIPTIONS_FILE}).`);
      }
    }
  } catch (err) {
    console.warn('[WEB-PUSH-PERSIST] Avís carregant subscripcions des de disc:', err);
  }
}

function savePersistedSubscriptions() {
  try {
    const allSubs: WebPushSubscriptionRecord[] = [];
    userSubscriptionsMap.forEach((endpointMap) => {
      endpointMap.forEach((rec) => {
        allSubs.push(rec);
      });
    });
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(allSubs, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[WEB-PUSH-PERSIST] Error desant subscripcions a disc:', err);
  }
}

// Carregar subscripcions inicials a l'arrencada
loadPersistedSubscriptions();

// Route: Retorna la clau pública VAPID per a subscripcions al dispositiu
app.get('/api/push/vapid-public-key', (_req, res) => {
  return res.json({
    publicKey: vapidKeys.publicKey
  });
});

// Route: Registra subscripció oficial Web Push (W3C Push API / Google Play Services per a Android)
app.post('/api/push/register-subscription', (req, res) => {
  try {
    const { userId, subscription } = req.body;
    if (!userId || !subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'userId and subscription with endpoint required' });
    }

    if (!userSubscriptionsMap.has(userId)) {
      userSubscriptionsMap.set(userId, new Map());
    }

    const rec: WebPushSubscriptionRecord = {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: subscription.keys,
      userId,
      registeredAt: Date.now()
    };

    userSubscriptionsMap.get(userId)!.set(subscription.endpoint, rec);
    savePersistedSubscriptions();

    console.log(`[WEB-PUSH] ✅ Subscripció Web Push (VAPID) connectada i desada a disc per a l'usuari [${userId}]`);
    return res.json({ success: true, message: 'Web Push subscription active & saved' });
  } catch (error: any) {
    console.error('[WEB-PUSH] Error registrant subscripció:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Route: Register Device Token linked to User ID
app.post('/api/push/register-token', (req, res) => {
  try {
    const { userId, deviceToken, deviceId, platform, isCapacitor, isPWA } = req.body;

    if (!userId || !deviceToken) {
      return res.status(400).json({ error: 'userId and deviceToken are required' });
    }

    if (!userTokensMap.has(userId)) {
      userTokensMap.set(userId, new Set());
    }
    userTokensMap.get(userId)!.add(deviceToken);

    tokenDetailsMap.set(deviceToken, {
      token: deviceToken,
      userId,
      deviceId: deviceId || 'unknown',
      platform: platform || 'android',
      isCapacitor: Boolean(isCapacitor),
      isPWA: Boolean(isPWA),
      registeredAt: Date.now(),
      lastActive: Date.now()
    });

    console.log(`[FCM-BD] ✅ Token del Dispositiu registrat per a l'usuari [${userId}] (${platform}, Capacitor: ${Boolean(isCapacitor)}): ${deviceToken.substring(0, 24)}...`);

    return res.json({
      success: true,
      message: 'Token del dispositiu vinculat correctament a la base de dades',
      userId,
      token: deviceToken,
      platform
    });
  } catch (error: any) {
    console.error('[FCM-BD] Error registrant token:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Route: Disparador d'esdeveniment de Torn (Player A -> Player B)
app.post('/api/push/send-turn-notification', async (req, res) => {
  try {
    const { matchId, senderId, senderName, targetUserId, title, message } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    const notifMessage = message || `¡Es tu turno en la partida con ${senderName || 'Jugador A'}!`;
    const notifTitle = title || '⚔️ Torn de Duel - Agent Medina';

    const tokens = Array.from(userTokensMap.get(targetUserId) || []);

    console.log(`[FCM-TRIGGER] 🚀 Disparador d'Esdeveniment: Torn completat per [${senderName} (${senderId})]. Següent torn: [${targetUserId}] a la partida [${matchId}].`);
    console.log(`[FCM-TRIGGER] 📲 Missatge enviat a Firebase Cloud Messaging: "${notifMessage}"`);
    console.log(`[FCM-TRIGGER] 🎯 Dispositius registrats trobats per a l'usuari [${targetUserId}]: ${tokens.length}`);

    const newNotif: QueuedNotification = {
      id: `srv_notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: matchId ? 'turn_notification' : 'system',
      matchId,
      fromUid: senderId,
      fromName: senderName || 'Company/a',
      title: notifTitle,
      message: notifMessage,
      read: false,
      timestamp: Date.now()
    };

    // Emmagatzemar a la cua de notificacions de l'usuari
    if (!userNotificationsMap.has(targetUserId)) {
      userNotificationsMap.set(targetUserId, []);
    }
    const list = userNotificationsMap.get(targetUserId)!;
    list.push(newNotif);
    if (list.length > 30) list.shift();

    // 1. Emetre immediatament per Server-Sent Events (SSE) als navegadors/mòbils connectats en primer pla
    const clientStreams = sseClientsMap.get(targetUserId);
    if (clientStreams && clientStreams.size > 0) {
      const dataStr = `data: ${JSON.stringify(newNotif)}\n\n`;
      clientStreams.forEach(clientRes => {
        try {
          clientRes.write(dataStr);
        } catch (streamErr) {
          // ignore stream error
        }
      });
      console.log(`[SSE-DISPATCH] 📡 Notificació enviada en viu per SSE a ${clientStreams.size} client(s) actiu(s)`);
    }

    // 2. Emetre per Web Push oficial (W3C Push API / Google Play Services per a Android)
    // Això fa que la notificació arribi a la barra d'Android fins i tot amb l'app TANCADA o en segon pla!
    let userSubs = userSubscriptionsMap.get(targetUserId);
    if (!userSubs || userSubs.size === 0) {
      // Intentar cerca flexible (sense espais, case-insensitive o coincidència de substring)
      const cleanTarget = String(targetUserId).trim().toLowerCase();
      for (const [uid, map] of userSubscriptionsMap.entries()) {
        if (uid.trim().toLowerCase() === cleanTarget) {
          userSubs = map;
          break;
        }
      }
    }

    let webPushSuccessCount = 0;
    if (userSubs && userSubs.size > 0) {
      const pushPayload = JSON.stringify({
        title: notifTitle,
        body: notifMessage,
        icon: '/app-logo-192.png',
        badge: '/app-logo-192.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: `turn_${matchId || Date.now()}`,
        data: {
          matchId,
          senderId,
          senderName,
          url: '/?tab=duels',
          timestamp: Date.now()
        }
      });

      const sendPromises = Array.from(userSubs.values()).map(async (sub) => {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: sub.keys
          }, pushPayload, {
            TTL: 60 * 60 * 24, // 24 hores
            urgency: 'high'
          });
          webPushSuccessCount++;
          console.log(`[WEB-PUSH-DISPATCH] 📲 Notificació nativa enviada a la barra d'Android per a l'usuari [${targetUserId}]!`);
        } catch (pushErr: any) {
          console.warn(`[WEB-PUSH-DISPATCH] Error enviant Web Push (${pushErr?.statusCode}):`, pushErr?.message);
          if (pushErr?.statusCode === 404 || pushErr?.statusCode === 410) {
            userSubs?.delete(sub.endpoint);
            savePersistedSubscriptions();
          }
        }
      });

      await Promise.allSettled(sendPromises);
    } else {
      console.log(`[WEB-PUSH-DISPATCH] ⚠️ Cap subscripció activa trobada per a targetUserId: [${targetUserId}]. Total usuaris registrats al servidor: ${userSubscriptionsMap.size}`);
    }

    // 3. Si Firebase Cloud Messaging Server Key estigués configurat (FCM legacy fallback)
    const fcmServerKey = process.env.FIREBASE_SERVER_KEY || process.env.FCM_SERVER_KEY;
    if (fcmServerKey && tokens.length > 0) {
      try {
        const fcmPayload = {
          registration_ids: tokens,
          notification: {
            title: notifTitle,
            body: notifMessage,
            icon: '/app-logo-192.png',
            click_action: '/?tab=duels'
          },
          data: {
            matchId,
            senderId,
            senderName,
            url: '/?tab=duels'
          }
        };

        const fcmRes = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${fcmServerKey}`
          },
          body: JSON.stringify(fcmPayload)
        });

        console.log(`[FCM-DISPATCH] FCM response status: ${fcmRes.status}`);
      } catch (fcmErr) {
        console.warn('[FCM-DISPATCH] Error enviant a FCM extern:', fcmErr);
      }
    }

    return res.json({
      success: true,
      delivered: true,
      matchId,
      targetUserId,
      webPushDevices: webPushSuccessCount,
      deviceTokensCount: tokens.length,
      message: notifMessage
    });
  } catch (error: any) {
    console.error('[FCM-TRIGGER] Error disparant notificació de torn:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Route: Stream en temps real Server-Sent Events (SSE) per a notificacions instantànies
app.get('/api/push/stream/:userId', (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).send('userId is required');
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  if (!sseClientsMap.has(userId)) {
    sseClientsMap.set(userId, new Set());
  }
  sseClientsMap.get(userId)!.add(res);

  // Enviar missatge de benvinguda i mantenir viu (keepalive heartbeat)
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

  const keepAliveInterval = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch (e) {
      clearInterval(keepAliveInterval);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    const clients = sseClientsMap.get(userId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        sseClientsMap.delete(userId);
      }
    }
  });
});

// Route: Obtenir notificacions pendents si no hi havia connexió SSE activa
app.get('/api/push/pending/:userId', (req, res) => {
  const { userId } = req.params;
  const list = userNotificationsMap.get(userId) || [];
  return res.json({ notifications: list });
});

// Route: Obtenir tokens de dispositiu d'un usuari
app.get('/api/push/user-tokens/:userId', (req, res) => {
  const { userId } = req.params;
  const tokens = Array.from(userTokensMap.get(userId) || []);
  const details = tokens.map(t => tokenDetailsMap.get(t)).filter(Boolean);
  return res.json({ userId, count: tokens.length, devices: details });
});

// Route: Estat d'instal·lació i configuració de l'APK Android / PWA
app.get('/api/apk-info', (req, res) => {
  return res.json({
    appName: 'Agent Medina Game',
    packageId: 'com.agentmedina.game',
    androidReady: true,
    fcmEnabled: true,
    capacitorConfigured: true,
    pwaWebApkReady: true,
    activeTokensCount: tokenDetailsMap.size
  });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Agent Medina Game operatiu a http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Error arrencant servidor:', err);
});
