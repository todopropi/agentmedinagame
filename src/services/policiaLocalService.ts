import { supabase } from '../../supabase';
import { 
  PLMunicipi, 
  PLTema, 
  PLPregunta, 
  PLUserProgressionRecord, 
  PLExamScore, 
  PLMassiveQuestionInput 
} from '../types/policiaLocal';
import { 
  INITIAL_PL_MUNICIPIS, 
  ALL_SEED_PL_TEMES 
} from '../data/policiaLocalSeedData';

const LOCAL_STORAGE_MUNICIPIS_KEY = 'agent_medina_pl_municipis_cache';
const LOCAL_STORAGE_TEMES_KEY = 'agent_medina_pl_temes_cache';
const LOCAL_STORAGE_QUESTIONS_KEY = 'agent_medina_pl_questions_cache';
const LOCAL_STORAGE_PROGRESS_KEY = 'agent_medina_pl_progress_cache';
const LOCAL_STORAGE_SCORES_KEY = 'agent_medina_pl_exam_scores_cache';
const LOCAL_STORAGE_GLOBAL_ANSWERED_KEY = 'agent_medina_pl_global_answered_ids';

function safeGetStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
  } catch {}
  return null;
}

function safeSetStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
  } catch {}
}

// =========================================================================
// GESTIÓ DE MUNICIPIS
// =========================================================================

export async function fetchPLMunicipis(): Promise<PLMunicipi[]> {
  try {
    const { data, error } = await supabase
      .from('pl_municipis')
      .select('*')
      .order('order_index', { ascending: true });

    if (!error && data && data.length > 0) {
      safeSetStorage(LOCAL_STORAGE_MUNICIPIS_KEY, JSON.stringify(data));
      return data as PLMunicipi[];
    }

    // Si la taula és buida al servidor, fem seeding inicial automàtic a Supabase
    if (!error && (!data || data.length === 0)) {
      try {
        const cleanInitial = INITIAL_PL_MUNICIPIS.map(m => {
          const copy = { ...m };
          delete copy.cultura_weight;
          delete copy.temari_weight;
          return copy;
        });
        await supabase.from('pl_municipis').upsert(cleanInitial);
      } catch (seedErr) {
        console.warn('Seeding pl_municipis exception:', seedErr);
      }
      return INITIAL_PL_MUNICIPIS;
    }
  } catch (err) {
    console.warn('Error fetching pl_municipis from Supabase:', err);
  }

  // Fallback memòria cau local o llavors predefinides
  const cached = safeGetStorage(LOCAL_STORAGE_MUNICIPIS_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }

  return INITIAL_PL_MUNICIPIS;
}

export async function savePLMunicipi(municipi: Partial<PLMunicipi> & { id: string }): Promise<PLMunicipi | null> {
  const payload: Record<string, any> = {
    ...municipi,
    updated_at: new Date().toISOString()
  };

  try {
    let { data, error } = await supabase
      .from('pl_municipis')
      .upsert(payload)
      .select()
      .single();

    // Si les columnes 'cultura_weight' o 'temari_weight' no existeixen a Supabase, reintentar automàticament sense elles
    if (error && (error.message?.includes('cultura_weight') || error.message?.includes('temari_weight') || error.code === 'PGRST204')) {
      const safePayload = { ...payload };
      delete safePayload.cultura_weight;
      delete safePayload.temari_weight;

      const retry = await supabase
        .from('pl_municipis')
        .upsert(safePayload)
        .select()
        .single();

      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.warn('Error saving pl_municipi in Supabase:', error.message);
    } else if (data) {
      // Actualitzar memòria cau local immediatament
      try {
        const cached = await fetchPLMunicipis();
        const merged: PLMunicipi = {
          ...data,
          cultura_weight: municipi.cultura_weight ?? 50,
          temari_weight: municipi.temari_weight ?? 50
        } as PLMunicipi;

        const idx = cached.findIndex(m => m.id === data.id);
        const updated = idx >= 0
          ? cached.map((m, i) => i === idx ? merged : m)
          : [...cached, merged];

        localStorage.setItem(LOCAL_STORAGE_MUNICIPIS_KEY, JSON.stringify(updated));
        return merged;
      } catch {}
      return data as PLMunicipi;
    }
  } catch (err) {
    console.warn('Exception saving pl_municipi:', err);
  }

  // Fallback local per no bloquejar la interfície
  try {
    const cached = await fetchPLMunicipis();
    const idx = cached.findIndex(m => m.id === municipi.id);
    const updated = idx >= 0 
      ? cached.map((m, i) => i === idx ? { ...m, ...payload } : m)
      : [...cached, payload as PLMunicipi];
    localStorage.setItem(LOCAL_STORAGE_MUNICIPIS_KEY, JSON.stringify(updated));
    return payload as PLMunicipi;
  } catch {
    return null;
  }
}

export async function deletePLMunicipi(id: string): Promise<boolean> {
  try {
    // Esborrem preguntes i temes vinculats per evitar violacions de foreign key
    await supabase.from('pl_preguntes').delete().eq('municipi_id', id);
    await supabase.from('pl_temes').delete().eq('municipi_id', id);

    const { error } = await supabase
      .from('pl_municipis')
      .delete()
      .eq('id', id);

    if (error) console.warn('Error deleting pl_municipi:', error.message);
  } catch (err) {
    console.warn('Exception deleting pl_municipi:', err);
  }

  try {
    const cached = await fetchPLMunicipis();
    const updated = cached.filter(m => m.id !== id);
    safeSetStorage(LOCAL_STORAGE_MUNICIPIS_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

// =========================================================================
// GESTIÓ DE TEMES
// =========================================================================

export async function fetchPLTemes(): Promise<PLTema[]> {
  try {
    const { data, error } = await supabase
      .from('pl_temes')
      .select('*')
      .order('num', { ascending: true });

    if (!error && data && data.length > 0) {
      safeSetStorage(LOCAL_STORAGE_TEMES_KEY, JSON.stringify(data));
      return data as PLTema[];
    }

    // Seeding inicial de temes si la taula és buida
    if (!error && (!data || data.length === 0)) {
      try {
        // Inserció per blocs per no saturar
        for (let i = 0; i < ALL_SEED_PL_TEMES.length; i += 40) {
          const chunk = ALL_SEED_PL_TEMES.slice(i, i + 40);
          await supabase.from('pl_temes').upsert(chunk);
        }
      } catch (seedErr) {
        console.warn('Seeding pl_temes exception:', seedErr);
      }
      return ALL_SEED_PL_TEMES;
    }
  } catch (err) {
    console.warn('Error fetching pl_temes from Supabase:', err);
  }

  const cached = safeGetStorage(LOCAL_STORAGE_TEMES_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }

  return ALL_SEED_PL_TEMES;
}

export async function savePLTema(tema: Partial<PLTema> & { id: string }): Promise<PLTema | null> {
  const payload = {
    ...tema,
    municipi_id: (tema.scope === 'comu' || tema.scope === 'cultura_general' || !tema.municipi_id) ? null : tema.municipi_id
  };

  try {
    const { data, error } = await supabase
      .from('pl_temes')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.warn('Error saving pl_tema in Supabase:', error.message);
    } else if (data) {
      try {
        const cached = await fetchPLTemes();
        const idx = cached.findIndex(t => t.id === data.id);
        const updated = idx >= 0
          ? cached.map((t, i) => i === idx ? (data as PLTema) : t)
          : [...cached, data as PLTema];
        localStorage.setItem(LOCAL_STORAGE_TEMES_KEY, JSON.stringify(updated));
      } catch {}
      return data as PLTema;
    }
  } catch (err) {
    console.warn('Exception saving pl_tema:', err);
  }

  try {
    const cached = await fetchPLTemes();
    const idx = cached.findIndex(t => t.id === tema.id);
    const updated = idx >= 0
      ? cached.map((t, i) => i === idx ? { ...t, ...payload } : t)
      : [...cached, payload as PLTema];
    localStorage.setItem(LOCAL_STORAGE_TEMES_KEY, JSON.stringify(updated));
    return payload as PLTema;
  } catch {
    return null;
  }
}

export async function deletePLTema(id: string): Promise<boolean> {
  try {
    // Esborrem primer preguntes vinculades a aquest tema per seguretat
    await supabase.from('pl_preguntes').delete().eq('tema_id', id);

    const { error } = await supabase
      .from('pl_temes')
      .delete()
      .eq('id', id);

    if (error) console.warn('Error deleting pl_tema:', error.message);
  } catch (err) {
    console.warn('Exception deleting pl_tema:', err);
  }

  try {
    const cached = await fetchPLTemes();
    const updated = cached.filter(t => t.id !== id);
    safeSetStorage(LOCAL_STORAGE_TEMES_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

// =========================================================================
// GESTIÓ DE PREGUNTES I BANC DE PREGUNTES
// =========================================================================

export async function fetchPLPreguntes(temaId?: string, municipiId?: string): Promise<PLPregunta[]> {
  try {
    let query = supabase.from('pl_preguntes').select('*');
    if (temaId) {
      query = query.eq('tema_id', temaId);
    }
    if (municipiId) {
      query = query.eq('municipi_id', municipiId);
    }

    const { data, error } = await query;
    if (!error && data) {
      return data as PLPregunta[];
    }
  } catch (err) {
    console.warn('Error fetching pl_preguntes from Supabase:', err);
  }

  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
    if (cached) {
      let list = JSON.parse(cached) as PLPregunta[];
      if (temaId) list = list.filter(q => q.tema_id === temaId);
      if (municipiId) list = list.filter(q => q.municipi_id === municipiId);
      return list;
    }
  } catch {}

  return [];
}

export async function fetchAllPLPreguntes(): Promise<PLPregunta[]> {
  try {
    const { data, error } = await supabase.from('pl_preguntes').select('*');
    if (!error && data) {
      localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(data));
      return data as PLPregunta[];
    }
  } catch (err) {
    console.warn('Error fetching all pl_preguntes:', err);
  }

  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}

  return [];
}

export async function savePLPregunta(pregunta: PLPregunta): Promise<PLPregunta | null> {
  const payload = {
    ...pregunta,
    municipi_id: pregunta.municipi_id ? pregunta.municipi_id : null
  };

  try {
    const { data, error } = await supabase
      .from('pl_preguntes')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.warn('Error saving pl_pregunta in Supabase:', error.message);
    } else if (data) {
      try {
        const cached = await fetchAllPLPreguntes();
        const updated = [...cached.filter(q => q.id !== data.id), data as PLPregunta];
        localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(updated));
      } catch {}
      return data as PLPregunta;
    }
  } catch (err) {
    console.warn('Exception saving pl_pregunta:', err);
  }

  return null;
}

export async function deletePLPregunta(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('pl_preguntes')
      .delete()
      .eq('id', id);

    if (error) console.warn('Error deleting pl_pregunta:', error.message);
    return !error;
  } catch {
    return false;
  }
}

/**
 * IMPORTACIÓ MASSIVA DE PREGUNTES EN FORMAT JSON
 * Suporta el format exacte facilitat per l'usuari:
 * {
 *   "id": "...",
 *   "ambit": "...",
 *   "seccio": "...",
 *   "pregunta": "...",
 *   "opcions": ["A", "B", "C", "D"],
 *   "resposta": 0,
 *   "explicacio": "...",
 *   "tema": "..."
 * }
 */
export async function importMassivePLPreguntes(
  rawInput: any,
  targetTemaId?: string,
  targetMunicipiId?: string,
  allTemes: PLTema[] = []
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    let items: any[] = [];
    if (Array.isArray(rawInput)) {
      items = rawInput;
    } else if (typeof rawInput === 'object' && rawInput !== null) {
      items = [rawInput];
    } else if (typeof rawInput === 'string') {
      const parsed = JSON.parse(rawInput);
      items = Array.isArray(parsed) ? parsed : [parsed];
    }

    if (!items.length) {
      return { success: false, count: 0, error: 'No s’han trobat preguntes vàlides al JSON.' };
    }

    const formattedList: PLPregunta[] = [];

    for (const item of items) {
      const questionText = (item.pregunta || item.question || '').toString().trim();
      const optionsArr = item.opcions || item.options;
      if (!questionText || !Array.isArray(optionsArr) || optionsArr.length < 2) {
        continue; // Ometre items mal formats
      }

      let assignedTemaId = targetTemaId || item.tema_id || '';

      // Si no s'ha especificat un tema concret, intentar detectar-lo pel títol o codi
      if (!assignedTemaId && (item.tema || item.code)) {
        const searchStr = (item.tema || item.code).toLowerCase();
        const matched = allTemes.find(t => 
          t.title.toLowerCase().includes(searchStr) || 
          t.code.toLowerCase().includes(searchStr) ||
          searchStr.includes(t.code.toLowerCase())
        );
        if (matched) assignedTemaId = matched.id;
      }

      // Si encara no té tema assignat, fer fallback al primer tema disponible o buit
      if (!assignedTemaId && allTemes.length > 0) {
        assignedTemaId = allTemes[0].id;
      }

      const qId = item.id || `pl_q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const correctAnswer = typeof item.resposta === 'number' 
        ? item.resposta 
        : (typeof item.correct_answer === 'number' ? item.correct_answer : 0);

      formattedList.push({
        id: qId,
        tema_id: assignedTemaId,
        municipi_id: targetMunicipiId || item.municipi_id || null,
        question: questionText,
        options: optionsArr.map((opt: any) => String(opt)),
        correct_answer: correctAnswer,
        explanation: item.explicacio || item.explanation || '',
        ambit: item.ambit || null,
        seccio: item.seccio || null,
        categoria: item.categoria || null
      });
    }

    if (!formattedList.length) {
      return { success: false, count: 0, error: 'Cap pregunta tenia el format mínim necessari (pregunta i opcions).' };
    }

    // Inserció en blocs a Supabase
    const CHUNK_SIZE = 50;
    for (let i = 0; i < formattedList.length; i += CHUNK_SIZE) {
      const chunk = formattedList.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase.from('pl_preguntes').upsert(chunk);
      if (error) {
        console.warn('Error batch upserting pl_preguntes:', error.message);
      }
    }

    // Actualitzar memòria cau local
    try {
      const existing = await fetchAllPLPreguntes();
      const existingMap = new Map(existing.map(q => [q.id, q]));
      formattedList.forEach(q => existingMap.set(q.id, q));
      localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(Array.from(existingMap.values())));
    } catch {}

    return { success: true, count: formattedList.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message || 'Error processant el JSON.' };
  }
}

// =========================================================================
// PROGRÉS D'USUARI I REGLA DE NO REPETICIÓ GLOBAL
// =========================================================================

export function getGlobalAnsweredQuestionIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_GLOBAL_ANSWERED_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

export function saveGlobalAnsweredQuestionId(questionId: string) {
  try {
    const set = getGlobalAnsweredQuestionIds();
    set.add(questionId);
    localStorage.setItem(LOCAL_STORAGE_GLOBAL_ANSWERED_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export async function fetchPLUserProgress(userId: string): Promise<Record<string, PLUserProgressionRecord>> {
  const result: Record<string, PLUserProgressionRecord> = {};
  if (!userId) return result;

  try {
    const { data, error } = await supabase
      .from('pl_user_progression')
      .select('*')
      .eq('user_id', userId);

    if (!error && data) {
      data.forEach((row: any) => {
        result[row.tema_id] = {
          user_id: row.user_id,
          municipi_id: row.municipi_id,
          tema_id: row.tema_id,
          answered_questions: Array.isArray(row.answered_questions) ? row.answered_questions : [],
          failed_questions: Array.isArray(row.failed_questions) ? row.failed_questions : [],
          correct_count: Number(row.correct_count) || 0,
          total_attempts: Number(row.total_attempts) || 0,
          updated_at: row.updated_at
        };
      });
      localStorage.setItem(`${LOCAL_STORAGE_PROGRESS_KEY}_${userId}`, JSON.stringify(result));
      return result;
    }
  } catch (err) {
    console.warn('Error fetching pl_user_progression:', err);
  }

  try {
    const cached = localStorage.getItem(`${LOCAL_STORAGE_PROGRESS_KEY}_${userId}`);
    if (cached) return JSON.parse(cached);
  } catch {}

  return result;
}

export async function recordPLUserAnswer(
  userId: string,
  questionId: string,
  temaId: string,
  municipiId: string | null,
  isCorrect: boolean
): Promise<void> {
  // 1. Guardar a la llista global de preguntes resoltes (així compta a tots els municipis on estigui la pregunta)
  saveGlobalAnsweredQuestionId(questionId);

  if (!userId) return;

  try {
    // 2. Obtenir progrés actual
    const allProgress = await fetchPLUserProgress(userId);
    const current = allProgress[temaId] || {
      user_id: userId,
      municipi_id: municipiId,
      tema_id: temaId,
      answered_questions: [],
      failed_questions: [],
      correct_count: 0,
      total_attempts: 0
    };

    const answeredSet = new Set(current.answered_questions);
    answeredSet.add(questionId);

    const failedSet = new Set(current.failed_questions);
    if (!isCorrect) {
      failedSet.add(questionId);
    } else {
      failedSet.delete(questionId); // Si la resol correctament, surt del sac d'errors
    }

    const updatedRecord: PLUserProgressionRecord = {
      id: `${userId}_${temaId}`,
      user_id: userId,
      municipi_id: municipiId,
      tema_id: temaId,
      answered_questions: Array.from(answeredSet),
      failed_questions: Array.from(failedSet),
      correct_count: current.correct_count + (isCorrect ? 1 : 0),
      total_attempts: current.total_attempts + 1,
      updated_at: new Date().toISOString()
    };

    // Guardar a Supabase
    await supabase.from('pl_user_progression').upsert(updatedRecord);

    // Guardar a local
    allProgress[temaId] = updatedRecord;
    localStorage.setItem(`${LOCAL_STORAGE_PROGRESS_KEY}_${userId}`, JSON.stringify(allProgress));
  } catch (err) {
    console.warn('Error recording PL user answer:', err);
  }
}

// =========================================================================
// NOTES D'EXAMEN OFICIAL PER MUNICIPI
// =========================================================================

export async function fetchPLExamScores(userId: string): Promise<Record<string, PLExamScore>> {
  const result: Record<string, PLExamScore> = {};
  if (!userId) return result;

  try {
    const { data, error } = await supabase
      .from('pl_exam_scores')
      .select('*')
      .eq('user_id', userId);

    if (!error && data) {
      data.forEach((row: any) => {
        result[row.municipi_id] = row as PLExamScore;
      });
      localStorage.setItem(`${LOCAL_STORAGE_SCORES_KEY}_${userId}`, JSON.stringify(result));
      return result;
    }
  } catch (err) {
    console.warn('Error fetching pl_exam_scores:', err);
  }

  try {
    const cached = localStorage.getItem(`${LOCAL_STORAGE_SCORES_KEY}_${userId}`);
    if (cached) return JSON.parse(cached);
  } catch {}

  return result;
}

export async function savePLExamScore(score: PLExamScore): Promise<PLExamScore | null> {
  try {
    const { data, error } = await supabase
      .from('pl_exam_scores')
      .upsert(score)
      .select()
      .single();

    if (error) {
      console.warn('Error saving pl_exam_score:', error.message);
    } else if (data) {
      return data as PLExamScore;
    }
  } catch (err) {
    console.warn('Exception saving pl_exam_score:', err);
  }

  // Guardar localment
  try {
    const scores = await fetchPLExamScores(score.user_id);
    scores[score.municipi_id] = score;
    localStorage.setItem(`${LOCAL_STORAGE_SCORES_KEY}_${score.user_id}`, JSON.stringify(scores));
    return score;
  } catch {
    return null;
  }
}
