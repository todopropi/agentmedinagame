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

// Firebase Client Configuration
const env = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'agent-medina-game.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'agent-medina-game',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'agent-medina-game.appspot.com',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
};

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

// Local Storage Fallback Keys for Resilient Offline & Preview Play
const LOCAL_USER_KEY = 'agent_medina_current_user_v1';
const LOCAL_GAMES_KEY = 'agent_medina_duels_v1';
const LOCAL_H2H_KEY = 'agent_medina_h2h_v1';
const LOCAL_LEADERBOARD_KEY = 'agent_medina_leaderboard_v1';

// Initial Mock Opponents for Leaderboard & Simulated Matches
const INITIAL_DEMO_LEADERBOARD: UserProfile[] = [
  {
    uid: 'bot_medina_senior',
    email: 'sergent.medina@mossos.cat',
    displayName: 'Agent Medina (Sergent)',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    xp: 6420,
    merits: 2850,
    rank: calculateRank(6420),
    equippedShieldId: 'escut_tedax_nrbq',
    unlockedShieldIds: ['escut_ispc', 'escut_tedax_nrbq', 'escut_brimo'],
    failedQuestionIds: [],
    savedQuestionIds: [],
  },
  {
    uid: 'bot_clara_sots',
    email: 'clara.caporal@mossos.cat',
    displayName: 'Caporala Puig',
    photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    xp: 4980,
    merits: 1940,
    rank: calculateRank(4980),
    equippedShieldId: 'escut_gei',
    unlockedShieldIds: ['escut_ispc', 'escut_gei'],
    failedQuestionIds: [],
    savedQuestionIds: [],
  },
  {
    uid: 'bot_marc_arro',
    email: 'marc.arro@mossos.cat',
    displayName: 'Mosso Marc Rovira',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    xp: 3210,
    merits: 1420,
    rank: calculateRank(3210),
    equippedShieldId: 'escut_arro',
    unlockedShieldIds: ['escut_ispc', 'escut_arro'],
    failedQuestionIds: [],
    savedQuestionIds: [],
  },
  {
    uid: 'bot_nur_gu',
    email: 'nuria.bcn@gu.barcelona.cat',
    displayName: 'Agent Vidal (GU BCN)',
    photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    xp: 1850,
    merits: 890,
    rank: calculateRank(1850),
    equippedShieldId: 'escut_gu_bcn',
    unlockedShieldIds: ['escut_ispc', 'escut_gu_bcn'],
    failedQuestionIds: [],
    savedQuestionIds: [],
  },
];

// Helper to get local user
export function getStoredLocalUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
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
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    // Also sync in local leaderboard list
    const lb = getStoredLeaderboard();
    const idx = lb.findIndex(u => u.uid === user.uid);
    if (idx >= 0) {
      lb[idx] = user;
    } else {
      lb.push(user);
    }
    localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(lb));
  } catch (e) {
    console.error('Local user storage error:', e);
  }
}

export function getStoredLeaderboard(): UserProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(INITIAL_DEMO_LEADERBOARD));
      return INITIAL_DEMO_LEADERBOARD;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_DEMO_LEADERBOARD;
  } catch (e) {
    return INITIAL_DEMO_LEADERBOARD;
  }
}

// Build standard default user profile
export function createDefaultProfile(uid: string, email: string, displayName: string, photoURL?: string): UserProfile {
  const isAdmin = email.toLowerCase().trim() === 'opossscar@gmail.com';
  return {
    uid,
    email,
    displayName: displayName || email.split('@')[0] || 'Aspirant Medina',
    photoURL: photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}`,
    xp: 100, // welcome bonus
    merits: 150, // initial budget to start shopping
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

// AUTH API
export async function loginWithGoogle(): Promise<UserProfile> {
  if (isFirebaseConfigured && auth && db) {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      
      // Fetch profile from Firestore
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
      const isUnauthorizedDomain = 
        errCode === 'auth/unauthorized-domain' || 
        errMsg.includes('auth/unauthorized-domain') ||
        errMsg.includes('unauthorized-domain');

      if (isUnauthorizedDomain) {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        console.warn(
          `[Firebase Auth] El domini "${currentDomain}" no està autoritzat a Firebase (auth/unauthorized-domain). S'activa la sessió en mode local/preview.`
        );

        setUnauthorizedDomainAlert({
          domain: currentDomain,
          projectId: firebaseConfig.projectId
        });

        // Use resilient local session
        let existing = getStoredLocalUser();
        if (!existing) {
          existing = createDefaultProfile(
            'user_google_' + Math.random().toString(36).substring(2, 9),
            'opossscar@gmail.com',
            'Opositor Mossos (Òscar)',
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
          );
        }
        existing.lastLogin = Date.now();
        saveStoredLocalUser(existing);
        return existing;
      }

      if (errCode === 'auth/popup-closed-by-user' || errCode === 'auth/cancelled-popup-request') {
        throw new Error('S\'ha tancat la finestra d\'inici de sessió.');
      }

      console.warn('Firebase Google Auth fallback to local:', authError);
      let existing = getStoredLocalUser();
      if (!existing) {
        existing = createDefaultProfile(
          'user_google_' + Math.random().toString(36).substring(2, 9),
          'opossscar@gmail.com',
          'Opositor Mossos (Òscar)',
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
        );
      }
      existing.lastLogin = Date.now();
      saveStoredLocalUser(existing);
      return existing;
    }
  }

  // Resilient Simulation Login (e.g. preview mode or before production credentials set)
  let existing = getStoredLocalUser();
  if (!existing) {
    existing = createDefaultProfile(
      'user_google_' + Math.random().toString(36).substring(2, 9),
      'opossscar@gmail.com',
      'Opositor Mossos (Òscar)',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
    );
  }
  existing.lastLogin = Date.now();
  saveStoredLocalUser(existing);
  return existing;
}

export async function loginWithEmailPassword(email: string, pass: string): Promise<UserProfile> {
  if (isFirebaseConfigured && auth && db) {
    try {
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
    } catch (fbError: any) {
      console.warn('Firebase email login error, using resilient session:', fbError);
    }
  }

  // Simulation
  let existing = getStoredLocalUser();
  if (!existing || existing.email !== email) {
    existing = createDefaultProfile(
      'user_email_' + Math.random().toString(36).substring(2, 9),
      email,
      email.split('@')[0]
    );
  }
  existing.lastLogin = Date.now();
  saveStoredLocalUser(existing);
  return existing;
}

export async function registerWithEmailPassword(email: string, pass: string, name: string): Promise<UserProfile> {
  if (isFirebaseConfigured && auth && db) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const newProfile = createDefaultProfile(cred.user.uid, email, name);
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      saveStoredLocalUser(newProfile);
      return newProfile;
    } catch (fbError: any) {
      console.warn('Firebase register notice, using local session:', fbError);
    }
  }

  const newProfile = createDefaultProfile(
    'user_email_' + Math.random().toString(36).substring(2, 9),
    email,
    name
  );
  saveStoredLocalUser(newProfile);
  return newProfile;
}

export async function loginAsGuest(customName?: string): Promise<UserProfile> {
  let existing = getStoredLocalUser();
  if (!existing) {
    existing = createDefaultProfile(
      'user_aspirant_' + Math.random().toString(36).substring(2, 9),
      'opossscar@gmail.com',
      customName || 'Aspirant Medina',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
    );
  }
  existing.lastLogin = Date.now();
  saveStoredLocalUser(existing);
  return existing;
}

export async function logoutUser(): Promise<void> {
  if (isFirebaseConfigured && auth) {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Firebase logout notice:', e);
    }
  }
  localStorage.removeItem(LOCAL_USER_KEY);
}
export const logOutUser = logoutUser;

export function initAuthListener(callback: (user: UserProfile | null) => void): () => void {
  if (isFirebaseConfigured && auth && db) {
    try {
      const unsub = auth.onAuthStateChanged(async (fbUser) => {
        if (fbUser) {
          try {
            const snap = await getDoc(doc(db, 'users', fbUser.uid));
            if (snap.exists()) {
              const prof = snap.data() as UserProfile;
              saveStoredLocalUser(prof);
              callback(prof);
              return;
            }
          } catch (err) {
            console.warn('Error reading user doc on auth change:', err);
          }
          const local = getStoredLocalUser();
          callback(local);
        } else {
          const local = getStoredLocalUser();
          callback(local);
        }
      }, (err) => {
        console.warn('Firebase onAuthStateChanged notice:', err);
        const local = getStoredLocalUser();
        callback(local);
      });
      return unsub;
    } catch (e) {
      console.warn('Firebase auth listener init notice:', e);
    }
  }

  // Fallback listener for local session
  const local = getStoredLocalUser();
  callback(local);
  return () => {};
}

export async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch (e) {
      console.warn('Error loading user profile:', e);
    }
  }
  return getStoredLocalUser();
}

// PROFILE UPDATE API (XP, Merits, Shield, Rank)
export async function syncUserProfileUpdate(updated: Partial<UserProfile> & { uid: string }): Promise<UserProfile> {
  const current = getStoredLocalUser();
  if (!current) throw new Error('No user logged in');

  const merged: UserProfile = { ...current, ...updated };
  
  // Recalculate rank if XP changed
  if (updated.xp !== undefined) {
    merged.rank = calculateRank(merged.xp);
  }

  saveStoredLocalUser(merged);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'users', merged.uid), merged, { merge: true });
    } catch (e) {
      console.warn('Firestore sync failed, saved locally:', e);
    }
  }

  return merged;
}

// DUELS & HEAD-TO-HEAD FIRESTORE / LOCAL ENGINE
export async function getDuelsList(userUid: string): Promise<DuelGame[]> {
  if (isFirebaseConfigured && db) {
    try {
      const qHost = query(collection(db, 'games'), orderBy('lastUpdated', 'desc'), limit(20));
      const snap = await getDocs(qHost);
      const games: DuelGame[] = [];
      snap.forEach(d => {
        const g = d.data() as DuelGame;
        if (g.hostPlayerUid === userUid || g.guestPlayerUid === userUid || g.status === 'waiting') {
          games.push(g);
        }
      });
      return games;
    } catch (e) {
      console.warn('Firestore duels fetch fallback to local:', e);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_GAMES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
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
    } catch (e) {
      console.warn('Firestore create game notice:', e);
    }
  }

  // Store in local storage
  const current = await getDuelsList(user.uid);
  const updated = [newGame, ...current.filter(g => g.id !== gameId)];
  localStorage.setItem(LOCAL_GAMES_KEY, JSON.stringify(updated));

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
        const q = query(collection(db, 'games'), limit(30));
        const qSnap = await getDocs(q);
        qSnap.forEach(d => {
          const g = d.data() as DuelGame;
          if (g.shareCode === gameIdOrCode.toUpperCase() || g.id === gameIdOrCode) {
            foundGame = g;
          }
        });
      }
    } catch (e) {
      console.warn('Firestore join game search notice:', e);
    }
  }

  if (!foundGame) {
    const local = await getDuelsList(guestUser.uid);
    foundGame = local.find(g => g.id === gameIdOrCode || g.shareCode === gameIdOrCode.toUpperCase()) || null;
  }

  if (!foundGame) return null;

  // Join as guest if not yet joined
  if (!foundGame.guestPlayerUid && foundGame.hostPlayerUid !== guestUser.uid) {
    foundGame.guestPlayerUid = guestUser.uid;
    foundGame.guestPlayerName = guestUser.displayName;
    foundGame.guestPlayerAvatar = guestUser.photoURL;
    foundGame.guestPlayerShieldId = guestUser.equippedShieldId;
    foundGame.guestRedStripes = 0;
    foundGame.status = 'active';
    foundGame.consecutiveCorrect[guestUser.uid] = 0;
    foundGame.lastUpdated = Date.now();

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'games', foundGame.id), foundGame, { merge: true });
      } catch (e) {
        console.warn('Firestore update join notice:', e);
      }
    }

    const localList = await getDuelsList(guestUser.uid);
    const updatedList = [foundGame, ...localList.filter(g => g.id !== foundGame!.id)];
    localStorage.setItem(LOCAL_GAMES_KEY, JSON.stringify(updatedList));
  }

  return foundGame;
}

export async function saveDuelGameUpdate(game: DuelGame): Promise<void> {
  game.lastUpdated = Date.now();

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'games', game.id), game, { merge: true });
    } catch (e) {
      console.warn('Firestore game update notice:', e);
    }
  }

  const raw = localStorage.getItem(LOCAL_GAMES_KEY);
  const list: DuelGame[] = raw ? JSON.parse(raw) : [];
  const idx = list.findIndex(g => g.id === game.id);
  if (idx >= 0) {
    list[idx] = game;
  } else {
    list.unshift(game);
  }
  localStorage.setItem(LOCAL_GAMES_KEY, JSON.stringify(list));

  // If game finished, record Head-to-Head
  if (game.status === 'finished' && game.winnerUid && game.guestPlayerUid) {
    await recordHeadToHeadVictory(game.hostPlayerUid, game.hostPlayerName, game.guestPlayerUid, game.guestPlayerName || 'Convidat', game.winnerUid);
  }
}

// HEAD TO HEAD (VS HISTORY)
export async function getHeadToHeadRecords(userUid: string): Promise<HeadToHeadRecord[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'headToHead'), limit(20));
      const snap = await getDocs(q);
      const list: HeadToHeadRecord[] = [];
      snap.forEach(d => {
        const r = d.data() as HeadToHeadRecord;
        if (r.player1Uid === userUid || r.player2Uid === userUid) {
          list.push(r);
        }
      });
      return list;
    } catch (e) {
      console.warn('Firestore H2H fallback:', e);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_H2H_KEY);
    const list: HeadToHeadRecord[] = raw ? JSON.parse(raw) : [];
    return list.filter(r => r.player1Uid === userUid || r.player2Uid === userUid);
  } catch (e) {
    return [];
  }
}

export async function recordHeadToHeadVictory(p1Uid: string, p1Name: string, p2Uid: string, p2Name: string, winnerUid: string) {
  const pairId = [p1Uid, p2Uid].sort().join('_vs_');
  const raw = localStorage.getItem(LOCAL_H2H_KEY);
  const list: HeadToHeadRecord[] = raw ? JSON.parse(raw) : [];
  
  let rec = list.find(r => (r.player1Uid === p1Uid && r.player2Uid === p2Uid) || (r.player1Uid === p2Uid && r.player2Uid === p1Uid));
  
  if (!rec) {
    rec = {
      player1Uid: p1Uid,
      player1Name: p1Name,
      player1Wins: winnerUid === p1Uid ? 1 : 0,
      player2Uid: p2Uid,
      player2Name: p2Name,
      player2Wins: winnerUid === p2Uid ? 1 : 0,
      lastMatchTimestamp: Date.now(),
    };
    list.push(rec);
  } else {
    if (winnerUid === rec.player1Uid) rec.player1Wins++;
    if (winnerUid === rec.player2Uid) rec.player2Wins++;
    rec.lastMatchTimestamp = Date.now();
  }

  localStorage.setItem(LOCAL_H2H_KEY, JSON.stringify(list));

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'headToHead', pairId), rec, { merge: true });
    } catch (e) {
      console.warn('Firestore H2H sync notice:', e);
    }
  }
}

// REGISTERED & ONLINE USERS API
export async function getAllRegisteredUsers(currentUserUid?: string): Promise<UserProfile[]> {
  const usersMap = new Map<string, UserProfile>();

  // Add initial demo users first
  for (const u of INITIAL_DEMO_LEADERBOARD) {
    usersMap.set(u.uid, { ...u, isOnline: true });
  }

  // Add users from local leaderboard storage
  try {
    const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    if (raw) {
      const parsed: UserProfile[] = JSON.parse(raw);
      for (const u of parsed) {
        if (u && u.uid) {
          usersMap.set(u.uid, {
            ...u,
            isOnline: u.lastLogin ? Date.now() - u.lastLogin < 15 * 60 * 1000 : false
          });
        }
      }
    }
  } catch (e) {
    console.warn('Local users fetch notice:', e);
  }

  // Fetch registered users from Firestore
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'users'), limit(50));
      const snap = await getDocs(q);
      snap.forEach(d => {
        const u = d.data() as UserProfile;
        if (u && u.uid) {
          const isOnline = u.lastLogin ? Date.now() - u.lastLogin < 15 * 60 * 1000 : false;
          usersMap.set(u.uid, { ...u, isOnline });
        }
      });
    } catch (e) {
      console.warn('Firestore users fetch notice:', e);
    }
  }

  // Filter out current user if passed
  const list = Array.from(usersMap.values());
  if (currentUserUid) {
    return list.filter(u => u.uid !== currentUserUid);
  }
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
    } catch (e) {
      console.warn('Firestore direct challenge notice:', e);
    }
  }

  const current = await getDuelsList(currentUser.uid);
  const updated = [newGame, ...current.filter(g => g.id !== gameId)];
  localStorage.setItem(LOCAL_GAMES_KEY, JSON.stringify(updated));

  return newGame;
}


