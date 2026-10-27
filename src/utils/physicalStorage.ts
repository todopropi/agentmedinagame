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
const DELETED_IDS_STORAGE_PREFIX = 'agent_medina_deleted_physical_ids_';

/**
 * Recupera tots els IDs eliminats de l'usuari (tombstones) per evitar que reapareguin
 */
export function getDeletedPhysicalIds(userIdOrEmail?: string, userEmail?: string): string[] {
  const keys = getUserIdentifierKeys(userIdOrEmail, userEmail);
  const deletedSet = new Set<string>();

  try {
    const common = localStorage.getItem('agent_medina_deleted_physical_ids_common');
    if (common) {
      const parsed = JSON.parse(common);
      if (Array.isArray(parsed)) parsed.forEach(id => { if (id) deletedSet.add(String(id)); });
    }
  } catch (e) {}

  for (const k of keys) {
    try {
      const raw = localStorage.getItem(DELETED_IDS_STORAGE_PREFIX + k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(id => { if (id) deletedSet.add(String(id)); });
        }
      }
    } catch (e) {}
  }
  return Array.from(deletedSet);
}

/**
 * Registra un ID com a esborrat a totes les claus locals de l'usuari
 */
export function recordDeletedPhysicalId(recordOrSessionId: string, userIdOrEmail?: string, userEmail?: string): void {
  if (!recordOrSessionId) return;
  const keys = getUserIdentifierKeys(userIdOrEmail, userEmail);
  const current = new Set<string>(getDeletedPhysicalIds(userIdOrEmail, userEmail));
  current.add(String(recordOrSessionId));
  const arr = Array.from(current);
  const json = JSON.stringify(arr);

  try {
    localStorage.setItem('agent_medina_deleted_physical_ids_common', json);
  } catch (e) {}

  for (const k of keys) {
    try {
      localStorage.setItem(DELETED_IDS_STORAGE_PREFIX + k, json);
    } catch (e) {}
  }
}

/**
 * Normalitza i obté totes les claus vàlides associades a l'usuari (UID, email)
 * per evitar qualsevol pèrdua de dades o discrepància entre dispositius (mòbil i ordinador).
 */
export function getUserIdentifierKeys(userIdOrEmail?: string, userEmail?: string): string[] {
  const keys = new Set<string>();

  if (userIdOrEmail && typeof userIdOrEmail === 'string' && userIdOrEmail.trim()) {
    keys.add(userIdOrEmail.trim().toLowerCase());
  }

  if (userEmail && typeof userEmail === 'string' && userEmail.trim()) {
    keys.add(userEmail.trim().toLowerCase());
  }

  // Comprovar si tenim un perfil d'usuari desat a localStorage amb qualsevol clau
  try {
    const raw = localStorage.getItem('agent_medina_user_profile');
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.uid) keys.add(String(u.uid).trim().toLowerCase());
      if (u?.email) keys.add(String(u.email).trim().toLowerCase());
    }
  } catch (e) {}

  try {
    const lastUid = localStorage.getItem('agent_medina_last_uid');
    if (lastUid) {
      keys.add(lastUid.trim().toLowerCase());
      const rawUser = localStorage.getItem('agent_medina_user_' + lastUid);
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u?.uid) keys.add(String(u.uid).trim().toLowerCase());
        if (u?.email) keys.add(String(u.email).trim().toLowerCase());
      }
    }
  } catch (e) {}

  if (keys.size === 0) {
    keys.add('anonymous');
  }

  return Array.from(keys);
}

function resolveBestUserIdentifiers(userIdOrEmail?: string, userEmail?: string): { uid: string; email: string } {
  let email = (userEmail || '').trim().toLowerCase();
  let uid = (userIdOrEmail || '').trim();

  if (!email && uid && uid.includes('@')) {
    email = uid.toLowerCase();
  }

  if (!email || !uid) {
    try {
      const lastUid = localStorage.getItem('agent_medina_last_uid');
      if (lastUid && !uid) uid = lastUid.trim();

      const raw = localStorage.getItem('agent_medina_user_profile') || 
                  (lastUid ? localStorage.getItem('agent_medina_user_' + lastUid) : null);
      if (raw) {
        const u = JSON.parse(raw);
        if (!uid && u?.uid) uid = String(u.uid).trim();
        if (!email && u?.email) email = String(u.email).trim().toLowerCase();
      }
    } catch (e) {}
  }

  if (!uid && email) uid = email;
  if (!email && uid) email = uid.includes('@') ? uid.toLowerCase() : `${uid}@agentmedina.cat`;

  return { uid: uid || 'anonymous', email: email || 'aspirant@agentmedina.cat' };
}

/**
 * Llegeix els registres físics locals consultant totes les claus de l'usuari
 * i filtrant qualsevol ID eliminat
 */
export function getPhysicalRecords(userIdOrEmail: string, userEmail?: string): PhysicalScoreRecord[] {
  const keys = getUserIdentifierKeys(userIdOrEmail, userEmail);
  const deletedSet = new Set<string>(getDeletedPhysicalIds(userIdOrEmail, userEmail));
  const recordMap = new Map<string, PhysicalScoreRecord>();

  for (const k of keys) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((r: PhysicalScoreRecord) => {
            if (r && r.id && !deletedSet.has(r.id)) recordMap.set(r.id, r);
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
 * i filtrant qualsevol ID eliminat
 */
export function getPracticeSessions(userIdOrEmail: string, userEmail?: string): PracticeSessionRecord[] {
  const keys = getUserIdentifierKeys(userIdOrEmail, userEmail);
  const deletedSet = new Set<string>(getDeletedPhysicalIds(userIdOrEmail, userEmail));
  const sessionMap = new Map<string, PracticeSessionRecord>();

  for (const k of keys) {
    try {
      const raw = localStorage.getItem(PRACTICE_STORAGE_PREFIX + k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((s: PracticeSessionRecord) => {
            if (s && s.id && !deletedSet.has(s.id)) sessionMap.set(s.id, s);
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
 * amb quàdruple redundància i suport estricte de tombstones (elements eliminats).
 */
export async function syncPhysicalDataToCloud(
  userId: string,
  userEmail?: string,
  updatedRecords?: PhysicalScoreRecord[],
  updatedSessions?: PracticeSessionRecord[],
  additionalDeletedIds?: string[],
  isAuthoritative: boolean = false
): Promise<void> {
  const ids = resolveBestUserIdentifiers(userId, userEmail);
  const uid = ids.uid;
  const email = ids.email;
  const deletedIds = Array.from(new Set([
    ...getDeletedPhysicalIds(uid, email),
    ...(additionalDeletedIds || [])
  ]));
  const deletedSet = new Set<string>(deletedIds);

  const rawRecords = updatedRecords ?? getPhysicalRecords(uid, email);
  const rawSessions = updatedSessions ?? getPracticeSessions(uid, email);

  // Assegurar neteja total d'elements esborrats
  const records = rawRecords.filter(r => r && r.id && !deletedSet.has(r.id));
  const sessions = rawSessions.filter(s => s && s.id && !deletedSet.has(s.id));

  // 1. Sincronització immediata al servidor de Node.js Express de l'aplicació
  try {
    fetch('/api/physical-records/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        userId: uid,
        email,
        records,
        sessions,
        deletedIds,
        authoritative: isAuthoritative
      })
    }).catch(err => {
      console.warn('[SERVER-SYNC] Fallida en sync al backend local:', err);
    });
  } catch (err) {}

  // 2. Sincronització a Supabase (matches: physical_data_* i user_data_*)
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
          deletedIds,
          updatedAt: Date.now()
        }
      }, { onConflict: 'id' });
    }

    // També incrustem les dades físiques dins de user_data_${uid} per a redundància garantida amb el perfil
    const userGameDataIds = Array.from(new Set([`user_data_${uid}`, `user_data_${email}`]));
    for (const ugId of userGameDataIds) {
      const { data: existingData } = await supabase.from('matches').select('state').eq('id', ugId).maybeSingle();
      const prevState = existingData?.state || {};
      await supabase.from('matches').upsert({
        id: ugId,
        player1_id: uid,
        player2_id: 'cloud_sync',
        current_turn: uid,
        status: 'active',
        score_p1: records.length,
        score_p2: sessions.length,
        state: {
          ...prevState,
          physicalRecords: records,
          practiceSessions: sessions,
          physicalDeletedIds: deletedIds,
          physicalUpdatedAt: Date.now()
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
        deletedIds,
        updatedAt: Date.now()
      }, { merge: true });
    }
  } catch (err) {
    console.warn('Error sincronitzant físiques a Firebase:', err);
  }

  // Emetre esdeveniment local per refrescar components
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('physical_records_updated', {
        detail: { records, sessions, userId: uid }
      }));
    } catch (e) {}
  }
}

/**
 * Descarrega les dades del servidor (Server API + Supabase + Firebase) i actualitza les dades locals.
 * Filtra de forma estricta qualsevol registre o sessió que hagi estat eliminada
 * de manera que MAI no pugui reaparèixer en recarregar la pàgina o clicar a sincronitzar.
 */
export async function fetchPhysicalDataFromCloud(
  userId: string,
  userEmail?: string
): Promise<{ records: PhysicalScoreRecord[]; sessions: PracticeSessionRecord[] }> {
  const ids = resolveBestUserIdentifiers(userId, userEmail);
  const normUid = ids.uid;
  const normEmail = ids.email;

  const deletedSet = new Set<string>(getDeletedPhysicalIds(normUid, normEmail));
  const collectedRecords: PhysicalScoreRecord[] = [];
  const collectedSessions: PracticeSessionRecord[] = [];

  // 1. Descarregar des del Servidor Express de l'App
  try {
    const query = new URLSearchParams();
    if (normUid && normUid !== 'anonymous') query.set('userId', normUid);
    if (normEmail && !normEmail.includes('@agentmedina.cat')) query.set('email', normEmail);

    const res = await fetch(`/api/physical-records?${query.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.deletedIds)) {
        json.deletedIds.forEach((id: string) => {
          if (id) {
            deletedSet.add(String(id));
            recordDeletedPhysicalId(id, normUid, normEmail);
          }
        });
      }
      if (Array.isArray(json.records)) {
        json.records.forEach((r: any) => {
          if (r && r.id && !deletedSet.has(r.id)) collectedRecords.push(r);
        });
      }
      if (Array.isArray(json.sessions)) {
        json.sessions.forEach((s: any) => {
          if (s && s.id && !deletedSet.has(s.id)) collectedSessions.push(s);
        });
      }
    }
  } catch (err) {
    console.warn('[SERVER-FETCH] Error recuperant dades del servidor Node:', err);
  }

  // 2. Descarregar des de Supabase (matches: physical_data_* i user_data_*)
  try {
    const candidates = [
      `physical_data_${normUid}`,
      `physical_data_${normEmail}`,
      `user_data_${normUid}`,
      `user_data_${normEmail}`
    ].filter(Boolean);

    for (const candId of candidates) {
      const { data } = await supabase
        .from('matches')
        .select('state')
        .eq('id', candId)
        .maybeSingle();

      const st = data?.state;
      if (st) {
        if (Array.isArray(st.deletedIds)) {
          st.deletedIds.forEach((id: string) => {
            if (id) {
              deletedSet.add(String(id));
              recordDeletedPhysicalId(id, normUid, normEmail);
            }
          });
        }
        if (Array.isArray(st.physicalDeletedIds)) {
          st.physicalDeletedIds.forEach((id: string) => {
            if (id) {
              deletedSet.add(String(id));
              recordDeletedPhysicalId(id, normUid, normEmail);
            }
          });
        }
        if (Array.isArray(st.records)) {
          st.records.forEach((r: any) => { if (r && r.id && !deletedSet.has(r.id)) collectedRecords.push(r); });
        }
        if (Array.isArray(st.physicalRecords)) {
          st.physicalRecords.forEach((r: any) => { if (r && r.id && !deletedSet.has(r.id)) collectedRecords.push(r); });
        }
        if (Array.isArray(st.sessions)) {
          st.sessions.forEach((s: any) => { if (s && s.id && !deletedSet.has(s.id)) collectedSessions.push(s); });
        }
        if (Array.isArray(st.practiceSessions)) {
          st.practiceSessions.forEach((s: any) => { if (s && s.id && !deletedSet.has(s.id)) collectedSessions.push(s); });
        }
      }
    }
  } catch (err) {
    console.warn('Error consultant dades a Supabase:', err);
  }

  // 3. Descarregar des de Firebase Firestore
  if (db && (normUid || normEmail)) {
    const firestoreKeys = [normUid, normEmail].filter(Boolean);
    for (const fKey of firestoreKeys) {
      try {
        const docRef = doc(db, 'physical_records', fKey);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const d = snap.data();
          if (Array.isArray(d?.deletedIds)) {
            d.deletedIds.forEach((id: string) => {
              if (id) {
                deletedSet.add(String(id));
                recordDeletedPhysicalId(id, normUid, normEmail);
              }
            });
          }
          if (d?.records && Array.isArray(d.records)) {
            d.records.forEach((r: any) => { if (r && r.id && !deletedSet.has(r.id)) collectedRecords.push(r); });
          }
          if (d?.sessions && Array.isArray(d.sessions)) {
            d.sessions.forEach((s: any) => { if (s && s.id && !deletedSet.has(s.id)) collectedSessions.push(s); });
          }
        }
      } catch (err) {
        console.warn('Error consultant dades a Firebase:', err);
      }
    }
  }

  // 4. Fusionar TOTS els registres (locals + tots els del núvol) sense duplicats i SENSE elements eliminats
  const localRecords = getPhysicalRecords(normUid, normEmail);
  const recordMap = new Map<string, PhysicalScoreRecord>();

  collectedRecords.forEach(r => {
    if (r && r.id && !deletedSet.has(r.id)) recordMap.set(r.id, r);
  });
  localRecords.forEach(r => {
    if (r && r.id && !deletedSet.has(r.id)) {
      const prev = recordMap.get(r.id);
      if (!prev || (r.createdAt || 0) >= (prev.createdAt || 0)) {
        recordMap.set(r.id, r);
      }
    }
  });

  const mergedRecords = Array.from(recordMap.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  // 5. Fusionar TOTES les sessions de pràctica filtrant eliminades
  const localSessions = getPracticeSessions(normUid, normEmail);
  const sessionMap = new Map<string, PracticeSessionRecord>();

  collectedSessions.forEach(s => {
    if (s && s.id && !deletedSet.has(s.id)) sessionMap.set(s.id, s);
  });
  localSessions.forEach(s => {
    if (s && s.id && !deletedSet.has(s.id)) {
      const prev = sessionMap.get(s.id);
      if (!prev || (s.createdAt || 0) >= (prev.createdAt || 0)) {
        sessionMap.set(s.id, s);
      }
    }
  });

  const mergedSessions = Array.from(sessionMap.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  // 6. Desar a totes les claus locals de l'usuari
  const keys = getUserIdentifierKeys(normUid, normEmail);
  saveRecordsToAllLocalKeys(keys, mergedRecords);
  saveSessionsToAllLocalKeys(keys, mergedSessions);

  // 7. Sincronitzar de tornada a totes les bases de dades per assegurar que el núvol estigui net
  syncPhysicalDataToCloud(normUid, normEmail, mergedRecords, mergedSessions, Array.from(deletedSet), true).catch(console.warn);

  // Notificar canvi a la interfície
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('physical_records_updated', {
        detail: { records: mergedRecords, sessions: mergedSessions }
      }));
    } catch (e) {}
  }

  return { records: mergedRecords, sessions: mergedSessions };
}

/**
 * Força una sincronització bidireccional completa garantint que cap element esborrat no ressusciti
 * i retorna el total de registres i sessions vàlids sincronitzats.
 */
export async function forceSyncAllPhysicalData(
  userId: string,
  userEmail?: string
): Promise<{ recordsCount: number; sessionsCount: number; success: boolean }> {
  try {
    const ids = resolveBestUserIdentifiers(userId, userEmail);
    const deletedIds = getDeletedPhysicalIds(ids.uid, ids.email);

    // 1. Purga immediata local dels registres esborrats
    const currentRecords = getPhysicalRecords(ids.uid, ids.email);
    const currentSessions = getPracticeSessions(ids.uid, ids.email);
    const keys = getUserIdentifierKeys(ids.uid, ids.email);
    saveRecordsToAllLocalKeys(keys, currentRecords);
    saveSessionsToAllLocalKeys(keys, currentSessions);

    // 2. Descarregar des del núvol filtrant tombstones i afegint nous tombstones que el servidor tingui
    const result = await fetchPhysicalDataFromCloud(userId, userEmail);

    // 3. Sincronitzar de forma autoritativa
    await syncPhysicalDataToCloud(userId, userEmail, result.records, result.sessions, deletedIds, true);

    return {
      recordsCount: result.records.length,
      sessionsCount: result.sessions.length,
      success: true
    };
  } catch (err) {
    console.warn('forceSyncAllPhysicalData error:', err);
    return { recordsCount: 0, sessionsCount: 0, success: false };
  }
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
 * esborrant-lo del servidor Express, de Supabase i de Firebase i registrant un tombstone
 * permanent perquè no pugui ressuscitar mai en recarregar o sincronitzar.
 */
export function deletePhysicalRecord(userIdOrEmail: string, recordId: string, userEmail?: string): boolean {
  try {
    const normEmail = (userEmail || '').toLowerCase().trim();
    const normUid = (userIdOrEmail || '').trim();
    const keys = getUserIdentifierKeys(normUid, normEmail);

    // 1. Registrar tombstone perquè cap recàrrega ni consulta al núvol el torni a afegir
    recordDeletedPhysicalId(recordId, normUid, normEmail);

    const records = getPhysicalRecords(normUid, normEmail);
    const filtered = records.filter(r => r.id !== recordId);
    saveRecordsToAllLocalKeys(keys, filtered);

    // 2. Crida immediata al servidor per esborrar
    try {
      fetch(`/api/physical-records/${encodeURIComponent(recordId)}?userId=${encodeURIComponent(normUid)}&email=${encodeURIComponent(normEmail)}`, {
        method: 'DELETE'
      }).catch(console.warn);
    } catch (e) {}

    // 3. Sincronitzar de forma autoritativa a totes les bases de dades amb la tombstone
    syncPhysicalDataToCloud(normUid, normEmail, filtered, undefined, [recordId], true).catch(console.warn);

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
 * Elimina una sessió de pràctica de forma definitiva i la sincronitza a totes les capes
 * registrant el tombstone perquè mai no pugui ressuscitar.
 */
export function deletePracticeSession(userIdOrEmail: string, sessionId: string, userEmail?: string): boolean {
  try {
    const normEmail = (userEmail || '').toLowerCase().trim();
    const normUid = (userIdOrEmail || '').trim();
    const keys = getUserIdentifierKeys(normUid, normEmail);

    // 1. Registrar tombstone
    recordDeletedPhysicalId(sessionId, normUid, normEmail);

    const sessions = getPracticeSessions(normUid, normEmail);
    const filtered = sessions.filter(s => s.id !== sessionId);
    saveSessionsToAllLocalKeys(keys, filtered);

    // 2. Crida immediata al servidor per esborrar
    try {
      fetch(`/api/physical-records/${encodeURIComponent(sessionId)}?userId=${encodeURIComponent(normUid)}&email=${encodeURIComponent(normEmail)}`, {
        method: 'DELETE'
      }).catch(console.warn);
    } catch (e) {}

    // 3. Sincronitzar de forma autoritativa al servidor, Supabase i Firebase
    syncPhysicalDataToCloud(normUid, normEmail, undefined, filtered, [sessionId], true).catch(console.warn);

    return true;
  } catch (e) {
    console.warn('Error eliminant sessió de pràctica:', e);
    return false;
  }
}

