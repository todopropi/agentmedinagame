import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  onSnapshot,
  Firestore
} from 'firebase/firestore';
import { UserProfile, DuelGame, HeadToHeadRecord } from './types';
import { calculateRank } from './data/ranks';
import { DEFAULT_SHIELD_ID } from './data/badges';

// Helper to safely resolve Firebase configuration even if env keys were swapped
function resolveFirebaseConfig() {
  const env = (import.meta as any).env || {};
  const rawValues = [
    env.VITE_FIREBASE_API_KEY,
    env.VITE_FIREBASE_AUTH_DOMAIN,
    env.VITE_FIREBASE_PROJECT_ID,
    env.VITE_FIREBASE_STORAGE_BUCKET,
    env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    env.VITE_FIREBASE_APP_ID
  ].filter(Boolean) as string[];

  const apiKey = rawValues.find(v => v.startsWith('AIza')) || env.VITE_FIREBASE_API_KEY || '';
  const appId = rawValues.find(v => v.startsWith('1:') && v.includes(':web:')) || env.VITE_FIREBASE_APP_ID || '';
  const messagingSenderId = rawValues.find(v => /^\d+$/.test(v)) || env.VITE_FIREBASE_MESSAGING_SENDER_ID || '';
  const authDomain = rawValues.find(v => v.endsWith('.firebaseapp.com')) || env.VITE_FIREBASE_AUTH_DOMAIN || 'agent-medina-game.firebaseapp.com';
  const storageBucket = rawValues.find(v => v.includes('.appspot.com') || v.includes('.firebasestorage.app')) || env.VITE_FIREBASE_STORAGE_BUCKET || 'agent-medina-game.firebasestorage.app';
  const projectId = rawValues.find(v => v === 'agent-medina-game' || (!v.includes('.') && !v.includes(':') && !/^\d+$/.test(v) && !v.startsWith('AIza'))) || env.VITE_FIREBASE_PROJECT_ID || 'agent-medina-game';

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

const firebaseConfig = resolveFirebaseConfig();

export interface UnauthorizedDomainInfo {
  domain: string;
  projectId: string;
}

let unauthorizedDomainAlert: UnauthorizedDomainInfo | null = null;
const alertListeners = new Set<(info: UnauthorizedDomainInfo | null) => void>();

export function getUnauthorizedDomainAlert(): UnauthorizedDomainInfo | null {
  return unauthorizedDomainAlert;
}

export function setUnauthorizedDomainAlert(info: UnauthorizedDomainInfo | null) {
  unauthorizedDomainAlert = info;
  alertListeners.forEach(listener => listener(info));
}

export function subscribeUnauthorizedDomainAlert(listener: (info: UnauthorizedDomainInfo | null) => void): () => void {
  alertListeners.add(listener);
  return () => {
    alertListeners.delete(listener);
  };
}

const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== 'MY_FIREBASE_API_KEY'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.warn('Firebase init warning:', error);
  }
}

// Local Storage Keys
const LOCAL_USER_PREFIX = 'agent_medina_user_';
const LOCAL_GAMES_PREFIX = 'agent_medina_duels_';
const LOCAL_H2H_PREFIX = 'agent_medina_h2h_';
const LOCAL_LEADERBOARD_KEY = 'agent_medina_leaderboard_cache';
const LAST_ACTIVE_UID_KEY = 'agent_medina_last_uid';

export function getStoredLocalUser(uid?: string): UserProfile | null {
  try {
    const targetUid = uid || localStorage.getItem(LAST_ACTIVE_UID_KEY);
    if (!targetUid) return null;
    const raw = localStorage.getItem(LOCAL_USER_PREFIX + targetUid);
    if (!raw) return null;
    const user = JSON.parse(raw) as UserProfile;
    if (user.email && user.email.toLowerCase().trim() === 'opossscar@gmail.com') {
      user.isAdmin = true;
    }
    return user;
  } catch (e) {
    return null;
  }
}

export function saveStoredLocalUser(user: UserProfile) {
  try {
    if (!user || !user.uid) return;
    localStorage.setItem(LAST_ACTIVE_UID_KEY, user.uid);
    localStorage.setItem(LOCAL_USER_PREFIX + user.uid, JSON.stringify(user));
  } catch (e) {
    console.error('Local user storage error:', e);
  }
}

export function getStoredLeaderboard(): UserProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function createDefaultProfile(uid: string, email: string, displayName: string, photoURL?: string): UserProfile {
  const isAdmin = email.toLowerCase().trim() === 'opossscar@gmail.com';
  return {
    uid,
    email,
    displayName: displayName || email.split('@')[0] || 'Aspirant Medina',
    photoURL: photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}`,
    xp: 100,
    merits: 25,
    rank: calculateRank(100),
    equippedShieldId: DEFAULT_SHIELD_ID,
    unlockedShieldIds: [DEFAULT_SHIELD_ID],
    failedQuestionIds: [],
    savedQuestionIds: [],
    isAdmin,
    createdAt: Date.now(),
    lastLogin: Date.now(),
  };
}

export async function loginWithGoogle(): Promise<UserProfile> {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error('Firebase no està configurat amb claus vàlides.');
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;
    
    const userDocRef = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      data.lastLogin = Date.now();
      await updateDoc(userDocRef, { lastLogin: Date.now() });
      saveStoredLocalUser(data);
      return data;
    } else {
      const newProfile = createDefaultProfile(
        fbUser.uid, 
        fbUser.email || 'aspirant@agentmedina.cat', 
        fbUser.displayName || 'Aspirant', 
        fbUser.photoURL || undefined
      );
      await setDoc(userDocRef, newProfile);
      saveStoredLocalUser(newProfile);
      return newProfile;
    }
  } catch (authError: any) {
    const errCode = authError?.code || '';
    const errMsg = String(authError?.message || '');
    if (errCode === 'auth/unauthorized-domain' || errMsg.includes('unauthorized-domain')) {
      const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      setUnauthorizedDomainAlert({ domain: currentDomain, projectId: firebaseConfig.projectId });
      throw new Error(`El domini "${currentDomain}" no està autoritzat.`);
    }
    if (errCode === 'auth/popup-closed-by-user') {
      throw new Error('S\'ha tancat la finestra d\'inici de sessió.');
    }
    throw new Error(authError?.message || 'Error en iniciar sessió.');
  }
}

export async function loginWithEmailPassword(email: string, pass: string): Promise<UserProfile> {
  if (!isFirebaseConfigured || !auth || !db) throw new Error('Firebase no està configurat.');
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  const userDocRef = doc(db, 'users', cred.user.uid);
  const snap = await getDoc(userDocRef);
  if (snap.exists()) {
    const data = snap.data() as UserProfile;
    saveStoredLocalUser(data);
    return data;
  } else {
    const newProf = createDefaultProfile(cred.user.uid, email, email.split('@')[0]);
    await setDoc(userDocRef, newProf);
    saveStoredLocalUser(newProf);
    return newProf;
  }
}

export async function registerWithEmailPassword(email: string, pass: string, name: string): Promise<UserProfile> {
  if (!isFirebaseConfigured || !auth || !db) throw new Error('Firebase no està configurat.');
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const newProfile = createDefaultProfile(cred.user.uid, email, name);
  await setDoc(doc(db, 'users', cred.user.uid), newProfile);
  saveStoredLocalUser(newProfile);
  return newProfile;
}

export async function loginAsGuest(customName?: string): Promise<UserProfile> {
  const uid = 'guest_' + Math.random().toString(36).substring(2, 9);
  const name = customName?.trim() || 'Aspirant Medina';
  const newProfile = createDefaultProfile(
    uid,
    `${name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'aspirant'}@oposicio.cat`,
    name,
    `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}`
  );
  newProfile.lastLogin = Date.now();
  saveStoredLocalUser(newProfile);
  return newProfile;
}

export async function logoutUser(): Promise<void> {
  if (isFirebaseConfigured && auth) {
    try { await fbSignOut(auth); } catch (e) {}
  }
  const currentUid = localStorage.getItem(LAST_ACTIVE_UID_KEY);
  if (currentUid) localStorage.removeItem(LOCAL_USER_PREFIX + currentUid);
  localStorage.removeItem(LAST_ACTIVE_UID_KEY);
}
export const logOutUser = logoutUser;

export function initAuthListener(callback: (user: UserProfile | null) => void): () => void {
  if (isFirebaseConfigured && auth && db) {
    try {
      return auth.onAuthStateChanged(async (fbUser) => {
        if (fbUser) {
          try {
            const snap = await getDoc(doc(db, 'users', fbUser.uid));
            if (snap.exists()) {
              const prof = snap.data() as UserProfile;
              saveStoredLocalUser(prof);
              callback(prof);
              return;
            }
          } catch (err) {}
          const newProf = createDefaultProfile(
            fbUser.uid,
            fbUser.email || 'aspirant@agentmedina.cat',
            fbUser.displayName || 'Aspirant',
            fbUser.photoURL || undefined
          );
          saveStoredLocalUser(newProf);
          callback(newProf);
        } else {
          callback(null);
        }
      }, () => callback(null));
    } catch (e) {
      callback(null);
    }
  }
  callback(null);
  return () => {};
}

export async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const prof = snap.data() as UserProfile;
        saveStoredLocalUser(prof);
        return prof;
      }
    } catch (e) {}
  }
  return getStoredLocalUser(uid);
}

export async function syncUserProfileUpdate(updated: Partial<UserProfile> & { uid: string }): Promise<UserProfile> {
  const current = getStoredLocalUser(updated.uid);
  if (!current) throw new Error('No user logged in');

  const merged: UserProfile = { ...current, ...updated };
  if (updated.xp !== undefined) {
    merged.rank = calculateRank(merged.xp);
  }

  saveStoredLocalUser(merged);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'users', merged.uid), merged, { merge: true });
    } catch (e) {}
  }

  return merged;
}

export async function getDuelsList(userUid: string): Promise<DuelGame[]> {
  const raw = localStorage.getItem(LOCAL_GAMES_PREFIX + userUid);
  const localGames: DuelGame[] = raw ? JSON.parse(raw) : [];

  if (isFirebaseConfigured && db) {
    try {
      const qHost = query(collection(db, 'games'), orderBy('lastUpdated', 'desc'), limit(50));
      const snap = await getDocs(qHost);
      const fsGames: DuelGame[] = [];
      snap.forEach(d => {
        const g = d.data() as DuelGame;
        if (g.hostPlayerUid === userUid || g.guestPlayerUid === userUid || g.status === 'waiting') {
          fsGames.push(g);
        }
      });
      const map = new Map<string, DuelGame>();
      localGames.forEach(g => map.set(g.id, g));
      fsGames.forEach(g => map.set(g.id, g));
      const result = Array.from(map.values()).sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
      localStorage.setItem(LOCAL_GAMES_PREFIX + userUid, JSON.stringify(result));
      return result;
    } catch (e) {}
  }

  return localGames;
}

export async function createDuelGame(user: UserProfile): Promise<DuelGame> {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const gameId = 'duel_' + Date.now() + '_' + code;
  
  const newGame: DuelGame = {
    id: gameId,
    hostPlayerUid: user.uid,
    hostPlayerName: user.displayName,
    hostPlayerAvatar: user.photoURL,
    hostPlayerShieldId: user.equippedShieldId,
    hostRedStripes: 0,
    guestRedStripes: 0,
    currentTurnUid: user.uid,
    status: 'waiting',
    consecutiveCorrect: { [user.uid]: 0 },
    lastUpdated: Date.now(),
    shareCode: code,
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'games', gameId), newGame);
    } catch (e) {}
  }

  const current = await getDuelsList(user.uid);
  const updated = [newGame, ...current.filter(g => g.id !== gameId)];
  localStorage.setItem(LOCAL_GAMES_PREFIX + user.uid, JSON.stringify(updated));

  return newGame;
}

export async function joinDuelGame(gameIdOrCode: string, guestUser: UserProfile): Promise<DuelGame | null> {
  let foundGame: DuelGame | null = null;

  if (isFirebaseConfigured && db) {
    try {
      const docSnap = await getDoc(doc(db, 'games', gameIdOrCode));
      if (docSnap.exists()) {
        foundGame = docSnap.data() as DuelGame;
      } else {
        const q = query(collection(db, 'games'), limit(50));
        const qSnap = await getDocs(q);
        qSnap.forEach(d => {
          const g = d.data() as DuelGame;
          if (g.shareCode === gameIdOrCode.toUpperCase() || g.id === gameIdOrCode) {
            foundGame = g;
          }
        });
      }
    } catch (e) {}
  }

  if (!foundGame) {
    const local = await getDuelsList(guestUser.uid);
    foundGame = local.find(g => g.id === gameIdOrCode || g.shareCode === gameIdOrCode.toUpperCase()) || null;
  }

  if (!foundGame) return null;

  if (!foundGame.guestPlayerUid && foundGame.hostPlayerUid !== guestUser.uid) {
    foundGame.guestPlayerUid = guestUser.uid;
    foundGame.guestPlayerName = guestUser.displayName;
    foundGame.guestPlayerAvatar = guestUser.photoURL;
    foundGame.guestPlayerShieldId = guestUser.equippedShieldId;
    foundGame.guestRedStripes = 0;
    foundGame.status = 'active';
    if (!foundGame.consecutiveCorrect) foundGame.consecutiveCorrect = {};
    foundGame.consecutiveCorrect[guestUser.uid] = 0;
    foundGame.lastUpdated = Date.now();

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'games', foundGame.id), foundGame, { merge: true });
      } catch (e) {}
    }

    const localList = await getDuelsList(guestUser.uid);
    const updatedList = [foundGame, ...localList.filter(g => g.id !== foundGame!.id)];
    localStorage.setItem(LOCAL_GAMES_PREFIX + guestUser.uid, JSON.stringify(updatedList));
  }

  return foundGame;
}

export async function saveDuelGameUpdate(game: DuelGame): Promise<void> {
  game.lastUpdated = Date.now();

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'games', game.id), game, { merge: true });
    } catch (e) {}
  }

  if (game.hostPlayerUid) {
    const rawHost = localStorage.getItem(LOCAL_GAMES_PREFIX + game.hostPlayerUid);
    const listHost: DuelGame[] = rawHost ? JSON.parse(rawHost) : [];
    const idx = listHost.findIndex(g => g.id === game.id);
    if (idx >= 0) listHost[idx] = game; else listHost.unshift(game);
    localStorage.setItem(LOCAL_GAMES_PREFIX + game.hostPlayerUid, JSON.stringify(listHost));
  }

  if (game.guestPlayerUid) {
    const rawGuest = localStorage.getItem(LOCAL_GAMES_PREFIX + game.guestPlayerUid);
    const listGuest: DuelGame[] = rawGuest ? JSON.parse(rawGuest) : [];
    const idx = listGuest.findIndex(g => g.id === game.id);
    if (idx >= 0) listGuest[idx] = game; else listGuest.unshift(game);
    localStorage.setItem(LOCAL_GAMES_PREFIX + game.guestPlayerUid, JSON.stringify(listGuest));
  }

  if (game.status === 'finished' && game.winnerUid && game.guestPlayerUid) {
    await recordHeadToHeadVictory(game.hostPlayerUid, game.hostPlayerName, game.guestPlayerUid, game.guestPlayerName || 'Convidat', game.winnerUid);
  }
}

export async function getHeadToHeadRecords(userUid: string): Promise<HeadToHeadRecord[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'headToHead'), limit(50));
      const snap = await getDocs(q);
      const list: HeadToHeadRecord[] = [];
      snap.forEach(d => {
        const r = d.data() as HeadToHeadRecord;
        if (r.player1Uid === userUid || r.player2Uid === userUid) {
          list.push(r);
        }
      });
      localStorage.setItem(LOCAL_H2H_PREFIX + userUid, JSON.stringify(list));
      return list;
    } catch (e) {}
  }

  try {
    const raw = localStorage.getItem(LOCAL_H2H_PREFIX + userUid);
    const list: HeadToHeadRecord[] = raw ? JSON.parse(raw) : [];
    return list.filter(r => r.player1Uid === userUid || r.player2Uid === userUid);
  } catch (e) {
    return [];
  }
}

export async function recordHeadToHeadVictory(p1Uid: string, p1Name: string, p2Uid: string, p2Name: string, winnerUid: string) {
  const pairId = [p1Uid, p2Uid].sort().join('_vs_');
  
  let rec: HeadToHeadRecord = {
    player1Uid: p1Uid,
    player1Name: p1Name,
    player1Wins: winnerUid === p1Uid ? 1 : 0,
    player2Uid: p2Uid,
    player2Name: p2Name,
    player2Wins: winnerUid === p2Uid ? 1 : 0,
    lastMatchTimestamp: Date.now(),
  };

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'headToHead', pairId));
      if (snap.exists()) {
        const existing = snap.data() as HeadToHeadRecord;
        if (winnerUid === existing.player1Uid) existing.player1Wins++;
        if (winnerUid === existing.player2Uid) existing.player2Wins++;
        existing.lastMatchTimestamp = Date.now();
        rec = existing;
      }
      await setDoc(doc(db, 'headToHead', pairId), rec, { merge: true });
    } catch (e) {}
  }

  for (const uid of [p1Uid, p2Uid]) {
    const raw = localStorage.getItem(LOCAL_H2H_PREFIX + uid);
    const list: HeadToHeadRecord[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex(r => (r.player1Uid === p1Uid && r.player2Uid === p2Uid) || (r.player1Uid === p2Uid && r.player2Uid === p1Uid));
    if (idx >= 0) list[idx] = rec; else list.push(rec);
    localStorage.setItem(LOCAL_H2H_PREFIX + uid, JSON.stringify(list));
  }
}

export async function getAllRegisteredUsers(currentUserUid?: string): Promise<UserProfile[]> {
  const usersMap = new Map<string, UserProfile>();

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'users'), limit(100));
      const snap = await getDocs(q);
      snap.forEach(d => {
        const u = d.data() as UserProfile;
        if (u && u.uid) {
          const isOnline = u.lastLogin ? Date.now() - u.lastLogin < 5 * 60 * 1000 : false;
          usersMap.set(u.uid, { ...u, isOnline });
        }
      });
      const realUsers = Array.from(usersMap.values()).sort((a, b) => (b.xp || 0) - (a.xp || 0));
      localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(realUsers));
    } catch (e) {}
  }

  if (usersMap.size === 0) {
    try {
      const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
      if (raw) {
        const parsed: UserProfile[] = JSON.parse(raw);
        for (const u of parsed) {
          if (u && u.uid) {
            usersMap.set(u.uid, {
              ...u,
              isOnline: u.lastLogin ? Date.now() - u.lastLogin < 5 * 60 * 1000 : false
            });
          }
        }
      }
    } catch (e) {}
  }

  const list = Array.from(usersMap.values());
  return list;
}

export async function getActiveUsers(currentUserUid?: string): Promise<UserProfile[]> {
  const users = await getAllRegisteredUsers(currentUserUid);
  return users.filter(u => u.isOnline);
}

export async function getAllUsersList(): Promise<UserProfile[]> {
  return getAllRegisteredUsers();
}

export async function searchUsers(searchTerm: string, currentUserUid?: string): Promise<UserProfile[]> {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return [];
  const users = await getAllRegisteredUsers(currentUserUid);
  return users.filter(u => 
    (u.displayName && u.displayName.toLowerCase().includes(term)) ||
    (u.email && u.email.toLowerCase().includes(term))
  );
}

export async function createDirectChallengeGame(currentUser: UserProfile, targetUser: UserProfile): Promise<DuelGame> {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const gameId = 'duel_' + Date.now() + '_' + code;
  
  const newGame: DuelGame = {
    id: gameId,
    hostPlayerUid: currentUser.uid,
    hostPlayerName: currentUser.displayName,
    hostPlayerAvatar: currentUser.photoURL,
    hostPlayerShieldId: currentUser.equippedShieldId,
    guestPlayerUid: targetUser.uid,
    guestPlayerName: targetUser.displayName,
    guestPlayerAvatar: targetUser.photoURL,
    guestPlayerShieldId: targetUser.equippedShieldId,
    hostRedStripes: 0,
    guestRedStripes: 0,
    currentTurnUid: currentUser.uid,
    status: 'active',
    consecutiveCorrect: { [currentUser.uid]: 0, [targetUser.uid]: 0 },
    lastUpdated: Date.now(),
    shareCode: code,
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'games', gameId), newGame);
    } catch (e) {}
  }

  const current = await getDuelsList(currentUser.uid);
  const updated = [newGame, ...current.filter(g => g.id !== gameId)];
  localStorage.setItem(LOCAL_GAMES_PREFIX + currentUser.uid, JSON.stringify(updated));

  return newGame;
}

// FUNCIONES DE TIEMPO REAL
export function subscribeToUsers(
  currentUserUid: string | undefined, 
  onUsersUpdate: (users: UserProfile[]) => void
): () => void {
  if (!isFirebaseConfigured || !db) {
    onUsersUpdate([]);
    return () => {};
  }

  const q = query(collection(db, 'users'), limit(100));

  return onSnapshot(q, (snapshot) => {
    const users: UserProfile[] = [];
    const now = Date.now();

    snapshot.forEach((docSnap) => {
      const u = docSnap.data() as UserProfile;
      if (u && u.uid) {
        const isOnline = u.lastLogin ? (now - u.lastLogin) < 5 * 60 * 1000 : false;
        users.push({ ...u, isOnline });
      }
    });

    users.sort((a, b) => (b.xp || 0) - (a.xp || 0));

    localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(users));
    onUsersUpdate(users);
  }, (error) => {
    console.warn("Error en el listener de usuarios:", error);
  });
}

export function startOnlinePresence(uid: string): () => void {
  if (!isFirebaseConfigured || !db || !uid) return () => {};

  const updatePresence = async () => {
    try {
      await updateDoc(doc(db, 'users', uid), { lastLogin: Date.now() });
    } catch (e) {}
  };

  updatePresence();
  const intervalId = setInterval(updatePresence, 2 * 60 * 1000);
  return () => clearInterval(intervalId);
}

export function subscribeToMyChallenges(currentUserUid: string, onChallengeReceived: (game: DuelGame) => void): () => void {
  if (!isFirebaseConfigured || !db || !currentUserUid) return () => {};

  const q = query(collection(db, 'games'), limit(50));

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added" || change.type === "modified") {
        const game = change.doc.data() as DuelGame;
        if (game.guestPlayerUid === currentUserUid && (game.status === 'waiting' || game.status === 'active')) {
          onChallengeReceived(game);
        }
      }
    });
  });
}