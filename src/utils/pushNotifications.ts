import { doc, setDoc, updateDoc, collection, onSnapshot, query, where, orderBy, limit, addDoc } from 'firebase/firestore';
import { getFirestoreDb } from '../firebase';
import { InAppNotification, DeviceTokenRecord } from '../types';
import { AudioEngine } from './audio';

const STORAGE_DEVICE_TOKEN_KEY = 'agent_medina_device_token';
const STORAGE_DEVICE_ID_KEY = 'agent_medina_device_id';

export interface DeviceInfo {
  token: string;
  deviceId: string;
  platform: 'android' | 'web';
  isCapacitor: boolean;
  isPWA: boolean;
  permission: NotificationPermission;
}

// Genera o recupera un identificador únic i permanent del dispositiu físic
export function getOrCreateDeviceId(): string {
  try {
    let deviceId = localStorage.getItem(STORAGE_DEVICE_ID_KEY);
    if (!deviceId) {
      const randomPart = Math.random().toString(36).substring(2, 10);
      const timePart = Date.now().toString(36);
      deviceId = `dev_${timePart}_${randomPart}`;
      localStorage.setItem(STORAGE_DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch (e) {
    return `dev_tmp_${Date.now()}`;
  }
}

// Detecta si s'executa com a APK de Capacitor, PWA/WebAPK o navegador web estàndard
export function detectPlatformInfo(): { platform: 'android' | 'web'; isCapacitor: boolean; isPWA: boolean } {
  const isCapacitor = Boolean(
    typeof window !== 'undefined' && 
    ((window as any).Capacitor?.isNativePlatform() || (window as any).Capacitor?.getPlatform?.() === 'android')
  );

  const isAndroidUA = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  const isPWA = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );

  const platform: 'android' | 'web' = (isCapacitor || isAndroidUA) ? 'android' : 'web';

  return {
    platform,
    isCapacitor,
    isPWA
  };
}

// Converteix la clau pública VAPID en format Uint8Array per a PushManager
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Registra el Service Worker de FCM i Web Push
export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
    return registration;
  } catch (error) {
    console.warn('Service Worker registration warning:', error);
    return null;
  }
}

// Registra el dispositiu al servei natiu Web Push (Google Play Services / Android Push VAPID)
export async function subscribeDeviceToWebPush(userId: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    // Assegura el registre del Service Worker
    await registerPushServiceWorker();
    const reg = await navigator.serviceWorker.ready;

    // Obtenir la clau pública VAPID del servidor
    const res = await fetch('/api/push/vapid-public-key');
    if (!res.ok) return false;
    const { publicKey } = await res.json();
    if (!publicKey) return false;

    let subscription = await reg.pushManager.getSubscription();
    const convertedVapidKey = urlBase64ToUint8Array(publicKey);

    if (!subscription) {
      try {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      } catch (subErr) {
        console.warn('Subscription attempt error:', subErr);
      }
    }

    if (subscription) {
      const regRes = await fetch('/api/push/register-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subscription: subscription.toJSON()
        })
      });

      if (!regRes.ok) {
        // Si la clau antiga era invàlida, reintentar subscripció neta
        try {
          await subscription.unsubscribe();
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
          });
          await fetch('/api/push/register-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              subscription: subscription.toJSON()
            })
          });
        } catch (renewErr) {
          console.warn('Renewal error:', renewErr);
        }
      }

      console.log('✅ Web Push (VAPID) enllaçat amb èxit al telèfon per a:', userId);
      return true;
    }
  } catch (error) {
    console.warn('No s\'ha pogut subscriure el dispositiu a Web Push:', error);
  }
  return false;
}

// Sol·licita permís de notificacions i obté / genera el Device Token de Firebase / Push
export async function requestPushPermissionAndToken(userId?: string): Promise<DeviceInfo> {
  const { platform, isCapacitor, isPWA } = detectPlatformInfo();
  const deviceId = getOrCreateDeviceId();
  let permission: NotificationPermission = 'default';

  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'default') {
        permission = await Notification.requestPermission();
      } else {
        permission = Notification.permission;
      }
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
    }
  }

  // Registra Service Worker en segon pla
  registerPushServiceWorker().catch(console.warn);

  // Si el permís s'ha concedit i tenim usuari, subscriure automàticament a Web Push natiu
  if (permission === 'granted' && userId) {
    subscribeDeviceToWebPush(userId).catch(console.warn);
  }

  // Genera / recupera el Device Token (Token FCM / identificador de dispositiu)
  let existingToken = localStorage.getItem(STORAGE_DEVICE_TOKEN_KEY);
  if (!existingToken) {
    const prefix = platform === 'android' ? (isCapacitor ? 'fcm_apk_android' : 'fcm_pwa_android') : 'fcm_web';
    existingToken = `${prefix}_${deviceId}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem(STORAGE_DEVICE_TOKEN_KEY, existingToken);
  }

  const info: DeviceInfo = {
    token: existingToken,
    deviceId,
    platform,
    isCapacitor,
    isPWA,
    permission
  };

  // Si tenim ID d'usuari, guardar-lo a la base de dades
  if (userId) {
    await registerDeviceTokenInDatabase(userId, info);
  }

  return info;
}

// Desa i vincula el Token del Dispositiu a la base de dades (Firestore & Backend)
export async function registerDeviceTokenInDatabase(userId: string, deviceInfo: DeviceInfo): Promise<boolean> {
  if (!userId) return false;

  const db = getFirestoreDb();
  const token = deviceInfo.token;
  const platform = deviceInfo.platform;

  try {
    // 1. Guardar a Firestore a la col·lecció 'users/{userId}' i subcol·lecció de dispositius
    if (db) {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        deviceToken: token,
        devicePlatform: platform,
        lastTokenSync: Date.now()
      }, { merge: true });

      const deviceRef = doc(db, 'users', userId, 'devices', deviceInfo.deviceId);
      await setDoc(deviceRef, {
        token,
        deviceId: deviceInfo.deviceId,
        platform,
        isCapacitor: deviceInfo.isCapacitor,
        isPWA: deviceInfo.isPWA,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        lastActive: Date.now(),
        updatedAt: Date.now()
      }, { merge: true });

      // Col·lecció global de cerca ràpida de tokens
      const globalTokenRef = doc(db, 'device_tokens', token);
      await setDoc(globalTokenRef, {
        token,
        userId,
        platform,
        updatedAt: Date.now()
      }, { merge: true });
    }

    // 2. Notificar al backend via API
    try {
      await fetch('/api/push/register-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          deviceToken: token,
          deviceId: deviceInfo.deviceId,
          platform,
          isCapacitor: deviceInfo.isCapacitor,
          isPWA: deviceInfo.isPWA
        })
      });
    } catch (apiErr) {
      // Backend api opcional si offline
    }

    return true;
  } catch (error) {
    console.warn('Error saving device token to database:', error);
    return false;
  }
}

// Disparador de l'Esdeveniment:
// Quan el Jugador A respon la seva pregunta, es detecta el Jugador B (rival) i s'envia l'ordre a Firebase / FCM
export async function triggerTurnPushNotification(params: {
  matchId: string;
  senderUid: string;
  senderName: string;
  targetUid: string;
  customMessage?: string;
  isSelfTest?: boolean;
}): Promise<{ success: boolean; message: string }> {
  const { matchId, senderUid, senderName, targetUid, customMessage, isSelfTest } = params;

  // Si el rival o l'emissor és un bot d'entrenament IA, no s'envia FCM
  if (!targetUid || targetUid.startsWith('bot_') || (senderUid && senderUid.startsWith('bot_')) || (!isSelfTest && targetUid === senderUid)) {
    return { success: true, message: 'Bot rival o IA, no requereix FCM extern' };
  }

  const notificationMessage = customMessage || `És el teu torn a la partida amb ${senderName}!`;
  const notificationTitle = `⚔️ Torn de Duel - ${senderName}`;

  const db = getFirestoreDb();
  const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const notifData: InAppNotification = {
    id: notifId,
    type: 'turn_notification',
    matchId,
    fromUid: senderUid,
    fromName: senderName,
    title: notificationTitle,
    message: notificationMessage,
    read: false,
    timestamp: Date.now()
  };

  try {
    // 1. Guardar a Firestore sota l'usuari objectiu (Jugador B)
    if (db) {
      try {
        const userNotifsRef = doc(db, 'users', targetUid, 'notifications', notifId);
        await setDoc(userNotifsRef, notifData);

        // Col·lecció global de cues per a Cloud Functions / FCM Dispatcher
        const queueRef = doc(db, 'fcm_push_queue', notifId);
        await setDoc(queueRef, {
          ...notifData,
          targetUid,
          status: 'pending',
          createdAt: Date.now()
        });
      } catch (fsErr) {
        console.warn('Firestore notification save warning:', fsErr);
      }
    }

    // 2. Enviar ordre al backend express /api/push/send-turn-notification (que emet per SSE i FCM)
    try {
      const response = await fetch('/api/push/send-turn-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          senderId: senderUid,
          senderName,
          targetUserId: targetUid,
          title: notificationTitle,
          message: notificationMessage
        })
      });
      if (response.ok) {
        return { success: true, message: notificationMessage };
      }
    } catch (e) {
      // Backend pot estar arrencant o xarxa local
    }

    return { success: true, message: notificationMessage };
  } catch (error: any) {
    console.warn('Error triggering push notification:', error);
    return { success: false, message: error?.message || 'Error disparant notificació' };
  }
}

// Subscripció en temps real a notificacions d'un usuari (combinació Firestore + Server-Sent Events backend)
export function subscribeToUserNotifications(
  userId: string,
  onNewNotification: (notif: InAppNotification) => void
): () => void {
  if (!userId) return () => {};

  // Auto-subscriure a Web Push natiu (VAPID) en cas de tenir permisos concedits
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    subscribeDeviceToWebPush(userId).catch(console.warn);
  }

  const seenIds = new Set<string>();
  const db = getFirestoreDb();
  let unsubFirestore: (() => void) | null = null;

  // 1. Canal Firestore Snapshot (si Firebase està actiu)
  if (db) {
    let initialLoad = true;
    try {
      const notifsCol = collection(db, 'users', userId, 'notifications');
      const q = query(notifsCol, limit(20));

      unsubFirestore = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data() as InAppNotification;
            if (!seenIds.has(data.id)) {
              seenIds.add(data.id);
              if (!initialLoad && !data.read) {
                AudioEngine.playNotification();
                // Si l'usuari té l'app en primer pla, l'alerta in-app (Toast) ja s'encarrega d'avisar-lo sense duplicar a la barra d'Android
                onNewNotification(data);
              }
            }
          }
        });
        initialLoad = false;
      }, (err) => {
        console.warn('Notifications snapshot warning:', err);
      });
    } catch (e) {
      // Firestore fallback
    }
  }

  // 2. Canal Server-Sent Events (SSE) directe per a lliurament immediat a través del backend
  let eventSource: EventSource | null = null;
  try {
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      eventSource = new EventSource(`/api/push/stream/${encodeURIComponent(userId)}`);
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.id && !seenIds.has(parsed.id)) {
            seenIds.add(parsed.id);
            AudioEngine.playNotification();
            // L'usuari té la pestanya oberta: mostrem l'avís in-app Toast sense duplicar la notificació del Service Worker
            onNewNotification(parsed);
          }
        } catch (parseErr) {
          // ignore heartbeat / invalid json
        }
      };
      eventSource.onerror = () => {
        // En cas de desconnexió temporal, l'EventSource del navegador reconnecta automàticament
      };
    }
  } catch (sseErr) {
    console.warn('SSE subscription warning:', sseErr);
  }

  return () => {
    if (unsubFirestore) unsubFirestore();
    if (eventSource) eventSource.close();
  };
}

// Mostra la notificació al telèfon mòbil (Android) o navegador Web
export async function showNativePushAlert(title: string, body: string, matchId?: string) {
  if (typeof window === 'undefined') return;

  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const options: any = {
    body,
    icon: '/app-logo-192.png',
    badge: '/app-logo-192.png',
    tag: `agent_medina_${Date.now()}`,
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true,
    data: { matchId, url: '/?tab=duels' }
  };

  // 1. Mostrar mitjançant el Service Worker (mètode natiu i obligatori per a Android)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return;
      }
    } catch (e) {
      console.warn('showNotification through ready SW failed:', e);
    }

    try {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          options
        });
        return;
      }
    } catch (pmErr) {
      console.warn('postMessage to SW failed:', pmErr);
    }
  }

  // 2. Fallback per a escriptori (on new Notification no llença error)
  try {
    new Notification(title, options);
  } catch (err) {
    // Expected on Android Chrome when outside SW
  }
}

// Disparador per avís de derrota i motivació per a la revenja
export async function triggerDefeatRevengeNotification(params: {
  matchId: string;
  senderUid: string;
  senderName: string;
  targetUid: string;
}): Promise<{ success: boolean; message: string }> {
  const { matchId, senderUid, senderName, targetUid } = params;
  if (!targetUid || targetUid.startsWith('bot_')) {
    return { success: false, message: 'Target is a bot' };
  }

  const title = '⚔️ Duel Finalitzat - Agent Medina';
  const message = `¡Ha finalitzat la partida amb ${senderName}! Demana la revenja immediata per recuperar l'escut.`;

  const db = getFirestoreDb();
  const notifId = `notif_defeat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const notifData: InAppNotification = {
    id: notifId,
    type: 'defeat_revenge',
    matchId,
    fromUid: senderUid,
    fromName: senderName,
    title,
    message,
    read: false,
    timestamp: Date.now()
  };

  try {
    if (db) {
      const userNotifsRef = doc(db, 'users', targetUid, 'notifications', notifId);
      await setDoc(userNotifsRef, notifData);

      const queueRef = doc(db, 'fcm_push_queue', notifId);
      await setDoc(queueRef, {
        ...notifData,
        targetUid,
        status: 'pending',
        createdAt: Date.now()
      });
    }

    try {
      await fetch('/api/push/send-turn-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          senderId: senderUid,
          senderName,
          targetUserId: targetUid,
          title,
          message
        })
      });
    } catch (e) {
      // Backend fallback
    }

    return { success: true, message };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Error disparant notificació de derrota' };
  }
}

// Disparador per avís d'avançament a l'Oca (quan un/a company/a t'avança en caselles)
export async function triggerOcaOvertakeNotification(params: {
  senderUid: string;
  senderName: string;
  targetUid: string;
  ambitId: string;
  ambitName: string;
}): Promise<{ success: boolean; message: string }> {
  const { senderUid, senderName, targetUid, ambitId, ambitName } = params;
  if (!targetUid || targetUid.startsWith('bot_')) {
    return { success: false, message: 'Target is a bot' };
  }

  const title = `🎲 Tauler Àmbit ${ambitId} - Agent Medina`;
  const message = `¡Un/a company/a (${senderName}) t'ha avançat al Tauler de l'Àmbit ${ambitName}! Entra a tirar el dau i recuperar la teva posició.`;

  const db = getFirestoreDb();
  const notifId = `notif_overtake_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const notifData: InAppNotification = {
    id: notifId,
    type: 'oca_overtake',
    ambitId,
    fromUid: senderUid,
    fromName: senderName,
    title,
    message,
    read: false,
    timestamp: Date.now()
  };

  try {
    if (db) {
      const userNotifsRef = doc(db, 'users', targetUid, 'notifications', notifId);
      await setDoc(userNotifsRef, notifData);

      const queueRef = doc(db, 'fcm_push_queue', notifId);
      await setDoc(queueRef, {
        ...notifData,
        targetUid,
        status: 'pending',
        createdAt: Date.now()
      });
    }

    try {
      await fetch('/api/push/send-turn-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: senderUid,
          senderName,
          targetUserId: targetUid,
          title,
          message
        })
      });
    } catch (e) {
      // Backend fallback
    }

    return { success: true, message };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Error disparant avançament a l\'Oca' };
  }
}

// Envia una notificació de prova al propi dispositiu per verificar que funciona
export async function sendTestNotificationToSelf(user: { uid: string; displayName: string }) {
  AudioEngine.playNotification();
  const testMessage = `¡Notificació d'Agent Medina rebuda correctament al teu dispositiu!`;
  
  // Assegurar subscripció activa de Web Push al dispositiu abans del tret
  await subscribeDeviceToWebPush(user.uid).catch(console.warn);

  // Mostrar alerta nativa immediata al centre de notificacions del sistema operatiu
  await showNativePushAlert('🔔 Notificació de Prova - Agent Medina', testMessage);

  return triggerTurnPushNotification({
    matchId: 'test_match_' + Date.now(),
    senderUid: user.uid,
    senderName: user.displayName || 'Agent Medina',
    targetUid: user.uid,
    customMessage: testMessage,
    isSelfTest: true
  });
}
