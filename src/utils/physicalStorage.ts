import { supabase } from '../../supabase';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface PhysicalScoreRecord {
  id: string;
  userId: string;
  userEmail: string;
  testType: 'PB' | 'CA' | 'CL'; // Press Banca, Circuït Agilitat, Cursa Llançadora
  rawScore: number; // repeticions (PB), segons (CA), palier (CL)
  points: number; // 0 a 10 (graó oficial assolit)
  tier: number; // graó 0-10 de la taula
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:mm'
  notes?: string;
  createdAt: number;
}

export interface PracticeSetDetail {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightKg?: number; // per a press de banca o si s'afegeix llast
}

export interface PracticeSessionRecord {
  id: string;
  userId: string;
  userEmail: string;
  date: string;
  time: string;
  exercisesCompleted: string[];
  totalSets: number;
  feelingsRating: number; // 1 to 5
  feelingsText?: string;
  durationMinutes: number;
  createdAt: number;
  setsDetail?: PracticeSetDetail[];
}

const STORAGE_PREFIX = 'agent_medina_physical_records_';
const PRACTICE_STORAGE_PREFIX = 'agent_medina_practice_records_';

/**
 * Normalitza i obté totes les claus vàlides associades a l'usuari (UID, email)
 * per evitar qualsevol pèrdua de dades o discrepància entre dispositius.
 */
export function getUserIdentifierKeys(userIdOrEmail?: string, userEmail?: string): string[] {
  const keys = new Set<string>();

  if (userIdOrEmail && typeof userIdOrEmail === 'string' && userIdOrEmail.trim()) {
    keys.add(userIdOrEmail.trim().toLowerCase());
  }

  if (userEmail && typeof userEmail === 'string' && userEmail.trim()) {
    keys.add(userEmail.trim().toLowerCase());
  }

  // Comprovar si tenim un perfil d'usuari desat a localStorage
  try {
    const raw = localStorage.getItem('agent_medina_user_profile');
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.uid) keys.add(String(u.uid).trim().toLowerCase());
      if (u?.email) keys.add(String(u.email).trim().toLowerCase());
    }
  } catch (e) {}

  if (keys.size === 0) {
    keys.add('anonymous');
  }

  return Array.from(keys);
}

/**
 * Llegeix els registres físics locals consultant totes les claus de l'usuari
 */
export function getPhysicalRecords(userIdOrEmail: string, userEmail?: string): PhysicalScoreRecord[] {
  const keys = getUserIdentifierKeys(userIdOrEmail, userEmail);
  const recordMap = new Map<string, PhysicalScoreRecord>();

  for (const k of keys) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((r: PhysicalScoreRecord) => {
            if (r && r.id) recordMap.set(r.id, r);
          });
        }
      }
    } catch (e) {
      console.warn('Error llegint registres locals per clau', k, e);
    }
  }

  return Array.from(recordMap.values()).sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Llegeix les sessions de pràctica locals consultant totes les claus de l'usuari
 */
export function getPracticeSessions(userIdOrEmail: string, userEmail?: string): PracticeSessionRecord[] {
  const keys = getUserIdentifierKeys(userIdOrEmail, userEmail);
  const sessionMap = new Map<string, PracticeSessionRecord>();

  for (const k of keys) {
    try {
      const raw = localStorage.getItem(PRACTICE_STORAGE_PREFIX + k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((s: PracticeSessionRecord) => {
            if (s && s.id) sessionMap.set(s.id, s);
          });
        }
      }
    } catch (e) {}
  }

  return Array.from(sessionMap.values()).sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Desa la llista a totes les claus locals de l'usuari
 */
function saveRecordsToAllLocalKeys(keys: string[], records: PhysicalScoreRecord[]) {
  const json = JSON.stringify(records);
  for (const k of keys) {
    try {
      localStorage.setItem(STORAGE_PREFIX + k, json);
    } catch (e) {}
  }
}

function saveSessionsToAllLocalKeys(keys: string[], sessions: PracticeSessionRecord[]) {
  const json = JSON.stringify(sessions);
  for (const k of keys) {
    try {
      localStorage.setItem(PRACTICE_STORAGE_PREFIX + k, json);
    } catch (e) {}
  }
}

/**
 * Sincronitza tots els registres cap al servidor (Express Server + Supabase + Firebase)
 * amb quàdruple redundància perquè cap dada es perdi al mòbil ni en canviar d'ordinador.
 */
export async function syncPhysicalDataToCloud(
  userId: string,
  userEmail?: string,
  updatedRecords?: PhysicalScoreRecord[],
  updatedSessions?: PracticeSessionRecord[]
): Promise<void> {
  const records = updatedRecords ?? getPhysicalRecords(userId, userEmail);
  const sessions = updatedSessions ?? getPracticeSessions(userId, userEmail);
  const email = (userEmail || 'aspirant@agentmedina.cat').toLowerCase().trim();
  const uid = (userId || email).trim();

  // 1. Sincronització immediata al servidor de Node.js Express de l'aplicació
  try {
    fetch('/api/physical-records/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: uid,
        email,
        records,
        sessions
      })
    }).catch(err => {
      console.warn('[SERVER-SYNC] Fallida en sync al backend local:', err);
    });
  } catch (err) {}

  // 2. Sincronització a Supabase a la taula 'matches' sota l'identificador d'estat persistent
  try {
    const supabaseIds = Array.from(new Set([
      `physical_data_${uid}`,
      `physical_data_${email}`
    ]));

    for (const recordId of supabaseIds) {
      await supabase.from('matches').upsert({
        id: recordId,
        player1_id: uid,
        player2_id: 'physical_records',
        current_turn: uid,
        status: 'active',
        score_p1: records.length,
        score_p2: sessions.length,
        state: {
          userId: uid,
          email,
          records,
          sessions,
          updatedAt: Date.now()
        }
      }, { onConflict: 'id' });
    }
  } catch (err) {
    console.warn('Error sincronitzant físiques a Supabase:', err);
  }

  // 3. Sincronització a Firebase Firestore
  try {
    if (db) {
      const docRef = doc(db, 'physical_records', uid);
      await setDoc(docRef, {
        userId: uid,
        email,
        records,
        sessions,
        updatedAt: Date.now()
      }, { merge: true });
    }
  } catch (err) {
    console.warn('Error sincronitzant físiques a Firebase:', err);
  }
}

/**
 * Descarrega les dades del servidor (Server API + Supabase + Firebase) i actualitza les dades locals
 */
export async function fetchPhysicalDataFromCloud(
  userId: string,
  userEmail?: string
): Promise<{ records: PhysicalScoreRecord[]; sessions: PracticeSessionRecord[] }> {
  const normEmail = (userEmail || '').trim().toLowerCase();
  const normUid = (userId || '').trim();

  let serverRecords: PhysicalScoreRecord[] = [];
  let serverSessions: PracticeSessionRecord[] = [];
  let receivedFromServer = false;

  // 1. Descarregar des del Servidor Express de l'App
  try {
    const query = new URLSearchParams();
    if (normUid) query.set('userId', normUid);
    if (normEmail) query.set('email', normEmail);

    const res = await fetch(`/api/physical-records?${query.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.records)) {
        serverRecords = json.records;
        receivedFromServer = true;
      }
      if (Array.isArray(json.sessions)) {
        serverSessions = json.sessions;
        receivedFromServer = true;
      }
    }
  } catch (err) {
    console.warn('[SERVER-FETCH] Error recuperant dades del servidor Node:', err);
  }

  // 2. Descarregar des de Supabase si al servidor estava buit o per seguretat
  let supabaseRecords: PhysicalScoreRecord[] = [];
  let supabaseSessions: PracticeSessionRecord[] = [];
  try {
    const candidates = [`physical_data_${normUid}`, `physical_data_${normEmail}`].filter(Boolean);
    for (const candId of candidates) {
      const { data } = await supabase
        .from('matches')
        .select('state')
        .eq('id', candId)
        .maybeSingle();

      if (data?.state?.records && Array.isArray(data.state.records) && data.state.records.length > 0) {
        supabaseRecords = data.state.records;
      }
      if (data?.state?.sessions && Array.isArray(data.state.sessions) && data.state.sessions.length > 0) {
        supabaseSessions = data.state.sessions;
      }
      if (supabaseRecords.length > 0) break;
    }
  } catch (err) {
    console.warn('Error consultant dades a Supabase:', err);
  }

  // 3. Descarregar des de Firebase Firestore
  let firebaseRecords: PhysicalScoreRecord[] = [];
  let firebaseSessions: PracticeSessionRecord[] = [];
  if (db && normUid) {
    try {
      const docRef = doc(db, 'physical_records', normUid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const d = snap.data();
        if (d?.records && Array.isArray(d.records)) firebaseRecords = d.records;
        if (d?.sessions && Array.isArray(d.sessions)) firebaseSessions = d.sessions;
      }
    } catch (err) {
      console.warn('Error consultant dades a Firebase:', err);
    }
  }

  // Prioritat de fonts al núvol: si el servidor ha tornat dades o Supabase o Firebase
  const cloudRecords = serverRecords.length > 0 
    ? serverRecords 
    : (supabaseRecords.length > 0 ? supabaseRecords : firebaseRecords);

  const cloudSessions = serverSessions.length > 0 
    ? serverSessions 
    : (supabaseSessions.length > 0 ? supabaseSessions : firebaseSessions);

  // Fusionar amb locals
  const localRecords = getPhysicalRecords(normUid, normEmail);
  const recordMap = new Map<string, PhysicalScoreRecord>();

  // Si hi ha dades al núvol, afegir-les
  cloudRecords.forEach(r => { if (r && r.id) recordMap.set(r.id, r); });
  // Afegir també les locals per si l'usuari en va crear sense connexió
  localRecords.forEach(r => { if (r && r.id) recordMap.set(r.id, r); });

  const mergedRecords = Array.from(recordMap.values()).sort((a, b) => b.createdAt - a.createdAt);

  const localSessions = getPracticeSessions(normUid, normEmail);
  const sessionMap = new Map<string, PracticeSessionRecord>();
  cloudSessions.forEach(s => { if (s && s.id) sessionMap.set(s.id, s); });
  localSessions.forEach(s => { if (s && s.id) sessionMap.set(s.id, s); });
  const mergedSessions = Array.from(sessionMap.values()).sort((a, b) => b.createdAt - a.createdAt);

  // Desar a totes les claus locals de l'usuari
  const keys = getUserIdentifierKeys(normUid, normEmail);
  saveRecordsToAllLocalKeys(keys, mergedRecords);
  saveSessionsToAllLocalKeys(keys, mergedSessions);

  // Si el servidor local no tenia les dades actualitzades, sincronitzar-les
  if (!receivedFromServer || serverRecords.length < mergedRecords.length) {
    syncPhysicalDataToCloud(normUid, normEmail, mergedRecords, mergedSessions).catch(console.warn);
  }

  return { records: mergedRecords, sessions: mergedSessions };
}

/**
 * Desa un nou registre físic i el sincronitza automàticament a totes les capes (Local, Servidor, Supabase, Firebase)
 */
export function savePhysicalRecord(
  userIdOrEmail: string,
  record: Omit<PhysicalScoreRecord, 'id' | 'createdAt'>,
  userEmail?: string
): PhysicalScoreRecord {
  const normEmail = (record.userEmail || userEmail || '').toLowerCase().trim();
  const normUid = (record.userId || userIdOrEmail || normEmail).trim();
  const keys = getUserIdentifierKeys(normUid, normEmail);

  const records = getPhysicalRecords(normUid, normEmail);
  const newRecord: PhysicalScoreRecord = {
    ...record,
    userId: normUid,
    userEmail: normEmail || 'aspirant@agentmedina.cat',
    id: 'phys_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    createdAt: Date.now()
  };

  records.unshift(newRecord);
  saveRecordsToAllLocalKeys(keys, records);

  // Sincronitzar amb el servidor al núvol sense bloquejar
  syncPhysicalDataToCloud(normUid, normEmail, records).catch(console.warn);

  return newRecord;
}

/**
 * Elimina un registre de forma directa i el sincronitza immediatament al servidor
 * esborrant-lo del servidor Express, de Supabase i de Firebase.
 */
export function deletePhysicalRecord(userIdOrEmail: string, recordId: string, userEmail?: string): boolean {
  try {
    const normEmail = (userEmail || '').toLowerCase().trim();
    const normUid = (userIdOrEmail || '').trim();
    const keys = getUserIdentifierKeys(normUid, normEmail);

    const records = getPhysicalRecords(normUid, normEmail);
    const filtered = records.filter(r => r.id !== recordId);
    saveRecordsToAllLocalKeys(keys, filtered);

    // 1. Crida immediata al servidor per esborrar
    try {
      fetch(`/api/physical-records/${encodeURIComponent(recordId)}?userId=${encodeURIComponent(normUid)}&email=${encodeURIComponent(normEmail)}`, {
        method: 'DELETE'
      }).catch(console.warn);
    } catch (e) {}

    // 2. Sincronitzar l'estat actualitzat al servidor, Supabase i Firebase
    syncPhysicalDataToCloud(normUid, normEmail, filtered).catch(console.warn);

    return true;
  } catch (e) {
    console.warn('Error eliminant registre físic:', e);
    return false;
  }
}

/**
 * Calcula les millors marques oficials de l'usuari
 */
export function getBestScores(userIdOrEmail: string, userEmail?: string): {
  pb: PhysicalScoreRecord | null;
  ca: PhysicalScoreRecord | null;
  cl: PhysicalScoreRecord | null;
} {
  const records = getPhysicalRecords(userIdOrEmail, userEmail);
  
  let bestPB: PhysicalScoreRecord | null = null;
  let bestCA: PhysicalScoreRecord | null = null;
  let bestCL: PhysicalScoreRecord | null = null;

  for (const r of records) {
    if (r.testType === 'PB') {
      if (!bestPB || r.points > bestPB.points || (r.points === bestPB.points && r.rawScore > bestPB.rawScore)) {
        bestPB = r;
      }
    } else if (r.testType === 'CA') {
      if (!bestCA || r.points > bestCA.points || (r.points === bestCA.points && r.rawScore < bestCA.rawScore)) {
        bestCA = r;
      }
    } else if (r.testType === 'CL') {
      if (!bestCL || r.points > bestCL.points || (r.points === bestCL.points && r.rawScore > bestCL.rawScore)) {
        bestCL = r;
      }
    }
  }

  return { pb: bestPB, ca: bestCA, cl: bestCL };
}

/**
 * Desa una sessió de pràctica
 */
export function savePracticeSession(
  userIdOrEmail: string,
  session: Omit<PracticeSessionRecord, 'id' | 'createdAt'>,
  userEmail?: string
): PracticeSessionRecord {
  const normEmail = (session.userEmail || userEmail || '').toLowerCase().trim();
  const normUid = (session.userId || userIdOrEmail || normEmail).trim();
  const keys = getUserIdentifierKeys(normUid, normEmail);

  const sessions = getPracticeSessions(normUid, normEmail);
  const newSession: PracticeSessionRecord = {
    ...session,
    userId: normUid,
    userEmail: normEmail || 'aspirant@agentmedina.cat',
    id: 'pract_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    createdAt: Date.now()
  };

  sessions.unshift(newSession);
  saveSessionsToAllLocalKeys(keys, sessions);

  syncPhysicalDataToCloud(normUid, normEmail, undefined, sessions).catch(console.warn);

  return newSession;
}

/**
 * Elimina una sessió de pràctica
 */
export function deletePracticeSession(userIdOrEmail: string, sessionId: string, userEmail?: string): boolean {
  try {
    const normEmail = (userEmail || '').toLowerCase().trim();
    const normUid = (userIdOrEmail || '').trim();
    const keys = getUserIdentifierKeys(normUid, normEmail);

    const sessions = getPracticeSessions(normUid, normEmail);
    const filtered = sessions.filter(s => s.id !== sessionId);
    saveSessionsToAllLocalKeys(keys, filtered);

    // Sincronitzar l'estat actualitzat al servidor, Supabase i Firebase
    syncPhysicalDataToCloud(normUid, normEmail, undefined, filtered).catch(console.warn);

    return true;
  } catch (e) {
    console.warn('Error eliminant sessió de pràctica:', e);
    return false;
  }
}

