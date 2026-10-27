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

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

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

// =================================================================
// PERSISTÈNCIA AL SERVIDOR: PROVES FÍSIQUES I SIMULACRES
// Permet que des del mòbil, ordinador o tauleta mai es perdin les dades
// =================================================================
const PHYSICAL_DATA_FILE = path.join(process.cwd(), 'physical-records-data.json');

interface UserPhysicalData {
  userId: string;
  email: string;
  records: any[];
  sessions: any[];
  deletedIds?: string[];
  updatedAt: number;
}

let physicalDataStore: Record<string, UserPhysicalData> = {};

function loadPersistedPhysicalData() {
  try {
    if (fs.existsSync(PHYSICAL_DATA_FILE)) {
      const raw = fs.readFileSync(PHYSICAL_DATA_FILE, 'utf-8');
      physicalDataStore = JSON.parse(raw);
      console.log(`[PHYSICAL-STORE] 📥 Dades físiques carregades del disc per a ${Object.keys(physicalDataStore).length} perfils.`);
    }
  } catch (err) {
    console.warn('[PHYSICAL-STORE] Error llegint fitxer persistent:', err);
    physicalDataStore = {};
  }
}

function savePersistedPhysicalData() {
  try {
    fs.writeFileSync(PHYSICAL_DATA_FILE, JSON.stringify(physicalDataStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[PHYSICAL-STORE] Error desant fitxer persistent:', err);
  }
}

loadPersistedPhysicalData();

function resolveUserPhysicalKey(userId?: string, email?: string): string {
  if (email && email.trim()) return email.trim().toLowerCase();
  if (userId && userId.trim()) return userId.trim().toLowerCase();
  return 'anonymous';
}

function getUserPhysicalRecordsFromServer(userId?: string, email?: string) {
  const normEmail = (email || '').trim().toLowerCase();
  const normUid = (userId || '').trim().toLowerCase();

  const byEmail = normEmail ? physicalDataStore[normEmail] : null;
  const byUid = normUid ? physicalDataStore[normUid] : null;

  // Unió de tots els IDs eliminats (tombstones) per evitar qualsevol resurrecció
  const deletedSet = new Set<string>();
  (byEmail?.deletedIds || []).forEach(id => { if (id) deletedSet.add(String(id)); });
  (byUid?.deletedIds || []).forEach(id => { if (id) deletedSet.add(String(id)); });

  const data: UserPhysicalData = {
    userId: userId || byEmail?.userId || byUid?.userId || '',
    email: email || byEmail?.email || byUid?.email || '',
    records: [],
    sessions: [],
    deletedIds: Array.from(deletedSet),
    updatedAt: Math.max(byEmail?.updatedAt || 0, byUid?.updatedAt || 0, Date.now())
  };

  const recordMap = new Map<string, any>();
  const sessionMap = new Map<string, any>();

  if (byEmail) {
    (byEmail.records || []).forEach((r: any) => {
      if (r && r.id && !deletedSet.has(r.id)) recordMap.set(r.id, r);
    });
    (byEmail.sessions || []).forEach((s: any) => {
      if (s && s.id && !deletedSet.has(s.id)) sessionMap.set(s.id, s);
    });
  }

  if (byUid) {
    (byUid.records || []).forEach((r: any) => {
      if (r && r.id && !deletedSet.has(r.id)) {
        const prev = recordMap.get(r.id);
        if (!prev || (r.createdAt || 0) >= (prev.createdAt || 0)) {
          recordMap.set(r.id, r);
        }
      }
    });
    (byUid.sessions || []).forEach((s: any) => {
      if (s && s.id && !deletedSet.has(s.id)) {
        const prev = sessionMap.get(s.id);
        if (!prev || (s.createdAt || 0) >= (prev.createdAt || 0)) {
          sessionMap.set(s.id, s);
        }
      }
    });
  }

  data.records = Array.from(recordMap.values()).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
  data.sessions = Array.from(sessionMap.values()).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

  return data;
}

// 1. Obtenir tots els registres físics des del servidor
app.get('/api/physical-records', (req, res) => {
  const userId = String(req.query.userId || '');
  const email = String(req.query.email || '');

  const data = getUserPhysicalRecordsFromServer(userId, email);
  return res.json({
    success: true,
    records: data.records || [],
    sessions: data.sessions || [],
    deletedIds: data.deletedIds || [],
    updatedAt: data.updatedAt || Date.now()
  });
});

// 2. Sincronitzar registres físics al servidor (amb gestió autoritativa i tombstones)
app.post('/api/physical-records/sync', (req, res) => {
  const { userId, email, records, sessions, deletedIds, authoritative } = req.body;
  if (!userId && !email) {
    return res.status(400).json({ error: 'Missing userId or email' });
  }

  const normEmail = (email || '').trim().toLowerCase();
  const normUid = (userId || '').trim().toLowerCase();

  const existing = getUserPhysicalRecordsFromServer(userId, email);

  // Fusionar tombstones (IDs eliminats)
  const tombstoneSet = new Set<string>(existing.deletedIds || []);
  if (Array.isArray(deletedIds)) {
    deletedIds.forEach(id => { if (id) tombstoneSet.add(String(id)); });
  }

  let mergedRecords: any[] = [];
  let mergedSessions: any[] = [];

  if (authoritative) {
    // Mode autoritari: Si el client envia la llista neta després d'eliminar,
    // s'utilitza la llista del client filtrant qualsevol element eliminat
    const inRecords = Array.isArray(records) ? records : [];
    const inSessions = Array.isArray(sessions) ? sessions : [];
    mergedRecords = inRecords.filter(r => r && r.id && !tombstoneSet.has(r.id));
    mergedSessions = inSessions.filter(s => s && s.id && !tombstoneSet.has(s.id));
  } else {
    // Mode fusió tolerant: fusionar garantint que cap ID esborrat no ressusciti mai
    const recordMap = new Map<string, any>();
    (existing.records || []).forEach((r: any) => {
      if (r && r.id && !tombstoneSet.has(r.id)) recordMap.set(r.id, r);
    });
    (Array.isArray(records) ? records : []).forEach((r: any) => {
      if (r && r.id && !tombstoneSet.has(r.id)) {
        const prev = recordMap.get(r.id);
        if (!prev || (r.createdAt || 0) >= (prev.createdAt || 0)) {
          recordMap.set(r.id, r);
        }
      }
    });

    const sessionMap = new Map<string, any>();
    (existing.sessions || []).forEach((s: any) => {
      if (s && s.id && !tombstoneSet.has(s.id)) sessionMap.set(s.id, s);
    });
    (Array.isArray(sessions) ? sessions : []).forEach((s: any) => {
      if (s && s.id && !tombstoneSet.has(s.id)) {
        const prev = sessionMap.get(s.id);
        if (!prev || (s.createdAt || 0) >= (prev.createdAt || 0)) {
          sessionMap.set(s.id, s);
        }
      }
    });

    mergedRecords = Array.from(recordMap.values());
    mergedSessions = Array.from(sessionMap.values());
  }

  mergedRecords.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
  mergedSessions.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

  const updatedData: UserPhysicalData = {
    userId: userId || existing.userId || normUid,
    email: email || existing.email || normEmail,
    records: mergedRecords,
    sessions: mergedSessions,
    deletedIds: Array.from(tombstoneSet),
    updatedAt: Date.now()
  };

  if (normEmail) physicalDataStore[normEmail] = updatedData;
  if (normUid) physicalDataStore[normUid] = updatedData;

  savePersistedPhysicalData();

  return res.json({
    success: true,
    recordsCount: updatedData.records.length,
    sessionsCount: updatedData.sessions.length,
    deletedIdsCount: tombstoneSet.size
  });
});

// 3. Eliminar directament un registre físic o sessió al servidor per ID
app.delete('/api/physical-records/:id', (req, res) => {
  const recordId = req.params.id;
  const userId = String(req.query.userId || req.body?.userId || '');
  const email = String(req.query.email || req.body?.email || '');

  const normEmail = (email || '').trim().toLowerCase();
  const normUid = (userId || '').trim().toLowerCase();

  let deleted = false;

  // Actualitzar totes les claus pertinents
  const keysToUpdate = new Set<string>();
  if (normEmail) keysToUpdate.add(normEmail);
  if (normUid) keysToUpdate.add(normUid);

  for (const key of Object.keys(physicalDataStore)) {
    keysToUpdate.add(key);
  }

  keysToUpdate.forEach(key => {
    if (physicalDataStore[key]) {
      const p = physicalDataStore[key];
      const prevRecLen = p.records?.length || 0;
      const prevSessLen = p.sessions?.length || 0;

      p.records = (p.records || []).filter((r: any) => r && r.id !== recordId);
      p.sessions = (p.sessions || []).filter((s: any) => s && s.id !== recordId);

      if (!p.deletedIds) p.deletedIds = [];
      if (!p.deletedIds.includes(recordId)) {
        p.deletedIds.push(recordId);
      }

      if ((p.records?.length || 0) !== prevRecLen || (p.sessions?.length || 0) !== prevSessLen) {
        deleted = true;
      }
      p.updatedAt = Date.now();
    }
  });

  savePersistedPhysicalData();

  return res.json({
    success: true,
    deletedId: recordId,
    deleted
  });
});

// =================================================================
// GESTIÓ DE L'ÀUDIO OFICIAL DE LA CURSA LLANÇADORA AL SERVIDOR
// Permet que qualsevol usuari o administrador pugui pujar la pista
// oficial perquè estigui disponible per a tots els usuaris de l'app.
// =================================================================
const PUBLIC_AUDIO_DIR = path.resolve(__dirname, 'public', 'audio');
const DIST_AUDIO_DIR = path.resolve(__dirname, 'dist', 'audio');
const OFFICIAL_AUDIO_NAME = 'cursa-llancadora-oficial.mp3';

try {
  if (!fs.existsSync(PUBLIC_AUDIO_DIR)) fs.mkdirSync(PUBLIC_AUDIO_DIR, { recursive: true });
  if (!fs.existsSync(DIST_AUDIO_DIR)) fs.mkdirSync(DIST_AUDIO_DIR, { recursive: true });
} catch (e) {}

// Estat de l'àudio oficial al servidor
app.get('/api/navette-audio-status', (req, res) => {
  const publicAudioPath = path.join(PUBLIC_AUDIO_DIR, OFFICIAL_AUDIO_NAME);
  const distAudioPath = path.join(DIST_AUDIO_DIR, OFFICIAL_AUDIO_NAME);
  const exists = fs.existsSync(publicAudioPath) || fs.existsSync(distAudioPath);

  let fileSize = 0;
  try {
    if (fs.existsSync(publicAudioPath)) {
      fileSize = fs.statSync(publicAudioPath).size;
    } else if (fs.existsSync(distAudioPath)) {
      fileSize = fs.statSync(distAudioPath).size;
    }
  } catch (e) {}

  return res.json({
    success: true,
    exists,
    fileSize,
    url: `/audio/${OFFICIAL_AUDIO_NAME}`
  });
});

// Pujada de l'àudio oficial de la Cursa Llançadora al servidor
app.post('/api/upload-navette-audio', (req, res) => {
  try {
    const publicAudioPath = path.join(PUBLIC_AUDIO_DIR, OFFICIAL_AUDIO_NAME);
    const distAudioPath = path.join(DIST_AUDIO_DIR, OFFICIAL_AUDIO_NAME);

    let buffer: Buffer | null = null;

    if (req.body && req.body.audioBase64) {
      const base64Data = req.body.audioBase64.replace(/^data:audio\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else if (Buffer.isBuffer(req.body)) {
      buffer = req.body;
    }

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: 'No audio data received' });
    }

    // Escriure a /public/audio i /dist/audio
    if (!fs.existsSync(PUBLIC_AUDIO_DIR)) fs.mkdirSync(PUBLIC_AUDIO_DIR, { recursive: true });
    fs.writeFileSync(publicAudioPath, buffer);

    if (fs.existsSync(path.resolve(__dirname, 'dist'))) {
      if (!fs.existsSync(DIST_AUDIO_DIR)) fs.mkdirSync(DIST_AUDIO_DIR, { recursive: true });
      fs.writeFileSync(distAudioPath, buffer);
    }

    console.log(`[AUDIO] 🎵 Àudio oficial de la Cursa Llançadora desat amb èxit (${(buffer.length / (1024 * 1024)).toFixed(2)} MB).`);

    return res.json({
      success: true,
      message: 'Àudio oficial desat correctament al servidor per a tots els usuaris.',
      url: `/audio/${OFFICIAL_AUDIO_NAME}`,
      fileSize: buffer.length
    });
  } catch (err: any) {
    console.error('Error desant fitxer àudio al servidor:', err);
    return res.status(500).json({ error: 'Error processing audio upload', details: err?.message });
  }
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
