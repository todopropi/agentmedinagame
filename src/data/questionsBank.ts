import { Question, QuestionAmbit } from '../types';
import { CAMI_REAL_QUESTIONS } from './camiRealQuestions';
import { 
  syncSupabaseCustomQuestions, 
  fetchSupabaseCustomQuestions,
  deleteSupabaseCustomQuestion,
  subscribeToCustomQuestions,
  fetchQuestionsFromSupabaseTable
} from '../../supabase';

// Banc de preguntes oficial i dinàmic en memòria
export let QUESTIONS_BANK: Question[] = [...CAMI_REAL_QUESTIONS];

// Cache de sessió per a velocitat instantània sense re-descarregar constantment
if (typeof window !== 'undefined') {
  try {
    const cached = sessionStorage.getItem('agent_medina_cloud_questions');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Combinar preservant sempre les preguntes oficials del Camí a l'ISPC
        const map = new Map<string, Question>();
        CAMI_REAL_QUESTIONS.forEach(q => map.set(q.id, q));
        parsed.forEach((q: Question) => map.set(q.id, q));
        QUESTIONS_BANK = Array.from(map.values());
        (window as any).bancoPreguntes = QUESTIONS_BANK;
      }
    }
  } catch (e) {
    // ignore
  }
}

// Oients per notificar components quan les preguntes s'actualitzen des de Supabase
type QuestionsListener = (questions: Question[]) => void;
const listeners = new Set<QuestionsListener>();

export function onQuestionsUpdated(cb: QuestionsListener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function notifyListeners() {
  listeners.forEach(cb => {
    try {
      cb(QUESTIONS_BANK);
    } catch (e) {
      console.warn('Listener error in questionsBank:', e);
    }
  });
}

export function getQuestionsByAmbit(ambit: QuestionAmbit | string): Question[] {
  if (ambit === 'ISPC') {
    return QUESTIONS_BANK;
  }
  return QUESTIONS_BANK.filter(q => q.ambit === ambit);
}

/**
 * Seleccionador Intel·ligent de Preguntes (Anti-repetició + Repàs Espaiat):
 * 1. Prioritat 1 (80% probabilitat): Preguntes VÍRGENS (que l'opositor encara no ha vist).
 * 2. Prioritat 2 (20% probabilitat): Preguntes del SAC DE FALLADES o repàs de consolidació.
 * 3. Si ja ha vist el 100% de les preguntes de l'àmbit: Modo Mestratge (cicle de reforç prioritzant les més fallades).
 */
export function selectSmartQuestion(
  candidates: Question[],
  userProgress?: {
    answeredQuestionIds?: string[];
    failedQuestionIds?: string[];
    questionMistakesCount?: Record<string, number>;
  }
): Question | null {
  if (!candidates || candidates.length === 0) return null;

  const answeredSet = new Set(userProgress?.answeredQuestionIds || []);
  const failedSet = new Set(userProgress?.failedQuestionIds || []);

  const unseenQuestions = candidates.filter(q => !answeredSet.has(q.id));
  const failedQuestions = candidates.filter(q => failedSet.has(q.id));

  // 1. Si queden preguntes noves (vírgens):
  if (unseenQuestions.length > 0) {
    // 80% de probabilitat de donar una pregunta nova, 20% de repàs d'una fallada (si en té)
    const shouldReview = failedQuestions.length > 0 && Math.random() < 0.20;

    if (shouldReview) {
      return failedQuestions[Math.floor(Math.random() * failedQuestions.length)];
    }
    return unseenQuestions[Math.floor(Math.random() * unseenQuestions.length)];
  }

  // 2. Si ja ha vist TOTES les preguntes de l'àmbit:
  // Prioritzar primer les del Sac de Fallades
  if (failedQuestions.length > 0 && Math.random() < 0.50) {
    return failedQuestions[Math.floor(Math.random() * failedQuestions.length)];
  }

  // O agafar aleatòriament de tot el banc per mantenir el temari fresc
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function getAllInitialQuestions(): Question[] {
  return [...QUESTIONS_BANK];
}

export async function saveCustomQuestion(question: Question): Promise<void> {
  const idx = QUESTIONS_BANK.findIndex(q => q.id === question.id);
  if (idx >= 0) {
    QUESTIONS_BANK[idx] = question;
  } else {
    QUESTIONS_BANK = [question, ...QUESTIONS_BANK];
  }

  if (typeof window !== 'undefined') {
    (window as any).bancoPreguntes = QUESTIONS_BANK;
    try {
      sessionStorage.setItem('agent_medina_cloud_questions', JSON.stringify(QUESTIONS_BANK));
    } catch {}
  }
  notifyListeners();

  // Sincronitzar amb Supabase
  try {
    const cloudQuestions = await fetchSupabaseCustomQuestions();
    const existingIndex = cloudQuestions.findIndex((q: any) => q.id === question.id);
    let toPush: any[];
    if (existingIndex >= 0) {
      toPush = [...cloudQuestions];
      toPush[existingIndex] = question;
    } else {
      toPush = [question, ...cloudQuestions];
    }
    await syncSupabaseCustomQuestions(toPush);
  } catch (e) {
    console.warn('Error syncing custom question with Supabase:', e);
  }
}

export async function deleteCustomQuestion(id: string): Promise<void> {
  const idx = QUESTIONS_BANK.findIndex(q => q.id === id);
  if (idx >= 0) {
    QUESTIONS_BANK.splice(idx, 1);
  }

  if (typeof window !== 'undefined') {
    (window as any).bancoPreguntes = QUESTIONS_BANK;
    try {
      sessionStorage.setItem('agent_medina_cloud_questions', JSON.stringify(QUESTIONS_BANK));
    } catch {}
  }
  notifyListeners();

  // Eliminar a Supabase
  try {
    await deleteSupabaseCustomQuestion(id);
  } catch (e) {
    console.warn('Error deleting custom question from Supabase:', e);
  }
}

export async function addCustomQuestions(questions: Question[]): Promise<void> {
  if (!Array.isArray(questions) || questions.length === 0) return;

  const existingMap = new Map(QUESTIONS_BANK.map(q => [q.id, q]));
  questions.forEach(q => {
    existingMap.set(q.id, q);
  });

  QUESTIONS_BANK = Array.from(existingMap.values());
  
  if (typeof window !== 'undefined') {
    (window as any).bancoPreguntes = QUESTIONS_BANK;
    try {
      sessionStorage.setItem('agent_medina_cloud_questions', JSON.stringify(QUESTIONS_BANK));
    } catch {}
  }
  notifyListeners();

  // Sincronitzar amb Supabase
  try {
    const cloudQuestions = await fetchSupabaseCustomQuestions();
    const cloudMap = new Map(cloudQuestions.map((q: any) => [q.id, q]));
    questions.forEach(q => {
      cloudMap.set(q.id, q);
    });
    await syncSupabaseCustomQuestions(Array.from(cloudMap.values()));
  } catch (e) {
    console.warn('Error syncing custom questions with Supabase:', e);
  }
}

/**
 * Carrega les preguntes directament des de la taula dedicada 'questions' de Supabase
 */
export async function initCloudQuestions(): Promise<Question[]> {
  try {
    // 1. Carregar des de la taula 'questions' de Supabase (les 1.000+ preguntes oficials)
    const tableQuestions = await fetchQuestionsFromSupabaseTable();
    if (Array.isArray(tableQuestions) && tableQuestions.length > 0) {
      // Fusionar preservant tant les preguntes de Supabase com les de CAMI_REAL_QUESTIONS
      const map = new Map<string, Question>();
      CAMI_REAL_QUESTIONS.forEach(q => map.set(q.id, q));
      tableQuestions.forEach((q: Question) => map.set(q.id, q));
      QUESTIONS_BANK = Array.from(map.values());

      if (typeof window !== 'undefined') {
        (window as any).bancoPreguntes = QUESTIONS_BANK;
        try {
          sessionStorage.setItem('agent_medina_cloud_questions', JSON.stringify(QUESTIONS_BANK));
        } catch {}
      }
      notifyListeners();
      return QUESTIONS_BANK;
    }

    // 2. Fallback a preguntes personalitzades si cal
    const cloudQuestions = await fetchSupabaseCustomQuestions();
    if (Array.isArray(cloudQuestions) && cloudQuestions.length > 0) {
      const existingIds = new Set(QUESTIONS_BANK.map(q => q.id));
      const toAdd = cloudQuestions.filter((q: any) => !existingIds.has(q.id));
      if (toAdd.length > 0) {
        QUESTIONS_BANK = [...toAdd, ...QUESTIONS_BANK];
        if (typeof window !== 'undefined') {
          (window as any).bancoPreguntes = QUESTIONS_BANK;
        }
        notifyListeners();
      }
    }
    return QUESTIONS_BANK;
  } catch (e) {
    console.warn('Error loading cloud questions from Supabase:', e);
    return QUESTIONS_BANK;
  }
}

/**
 * Consulta filtrada estricta de preguntes del banc per a un Tema o Subtema oficial:
 * Utilitza EXCLUSIVAMENT les preguntes reals de la base de dades (sense inventar ni generar contingut fictici).
 */
export function getQuestionsForTopicOrSubtopic(topicId: string, subtopicId?: string): Question[] {
  // 1. Si s'ha demanat un subtema o apartat específic
  if (subtopicId) {
    // Coincidència directa per apartatId
    const directApartat = QUESTIONS_BANK.filter(q => q.apartatId === subtopicId);
    if (directApartat.length > 0) return directApartat;

    // Mapeig per als 9 subtemes d'Història A.1
    if (subtopicId === 'a1_1') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'a1_1' || (q.id.startsWith('MOSSOS_A1_') && ['001', '002', '003', '037', '038'].some(k => q.id.includes(k))));
    }
    if (subtopicId === 'a1_2') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'a1_2' || (q.id.startsWith('MOSSOS_A1_') && ['004', '005', '006', '007'].some(k => q.id.includes(k))));
    }
    if (subtopicId === 'a1_3') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'a1_3' || (q.id.startsWith('MOSSOS_A1_') && ['008', '009', '010', '011', '012', '013', '014', '015', '016'].some(k => q.id.includes(k))));
    }
    if (subtopicId === 'a1_4') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'a1_4' || (q.id.startsWith('MOSSOS_A1_') && ['017', '018', '019'].some(k => q.id.includes(k))));
    }
    if (subtopicId === 'a1_5') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'a1_5' || (q.id.startsWith('MOSSOS_A1_') && ['020', '021', '022', '023', '024'].some(k => q.id.includes(k))));
    }
    if (subtopicId === 'a1_6') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'a1_6' || (q.id.startsWith('MOSSOS_A1_') && ['025', '026', '027', '028'].some(k => q.id.includes(k))));
    }
    if (subtopicId === 'a1_7') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'a1_7' || (q.id.startsWith('MOSSOS_A1_') && ['029', '030', '031'].some(k => q.id.includes(k))));
    }
    if (subtopicId === 'a1_8') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'a1_8' || (q.id.startsWith('MOSSOS_A1_') && ['032', '033', '034'].some(k => q.id.includes(k))));
    }
    if (subtopicId === 'a1_9') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'a1_9' || (q.id.startsWith('MOSSOS_A1_') && ['035', '036'].some(k => q.id.includes(k))));
    }

    // Mapeig per als subapartats de l'Estatut B.1
    if (subtopicId === 'b1_1_1') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'b1_1_1' || (q.id.startsWith('MOSSOS_B1_') && ['001', '002', '003', '004'].some(k => q.id.includes(k))));
    }
    if (subtopicId === 'b1_1_2') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'b1_1_2' || (q.id.startsWith('MOSSOS_B1_') && ['005', '006', '007'].some(k => q.id.includes(k))));
    }
    if (subtopicId === 'b1_2_1') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'b1_2_1' || (q.id.startsWith('MOSSOS_B1_') && ['008', '010', '011', '012'].some(k => q.id.includes(k))));
    }
    if (subtopicId === 'b1_2_2') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'b1_2_2' || (q.id.startsWith('MOSSOS_B1_') && ['009'].some(k => q.id.includes(k))));
    }
    if (subtopicId === 'b1_3') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'b1_3' || (q.id.startsWith('MOSSOS_B1_') && ['013', '014'].some(k => q.id.includes(k))));
    }
    if (subtopicId === 'b1_4_1') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'b1_4_1' || (q.id.startsWith('MOSSOS_B1_') && ['015', '016', '017'].some(k => q.id.includes(k))));
    }
    if (subtopicId === 'b1_4_2') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'b1_4_2' || (q.id.startsWith('MOSSOS_B1_') && ['018', '019'].some(k => q.id.includes(k))));
    }
    if (subtopicId === 'b1_4_3') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'b1_4_3' || (q.id.startsWith('MOSSOS_B1_') && ['020', '021'].some(k => q.id.includes(k))));
    }
    if (subtopicId === 'b1_5') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'b1_5' || (q.id.startsWith('MOSSOS_B1_') && ['022', '023', '024', '025', '026'].some(k => q.id.includes(k))));
    }

    // Mapeig per als subapartats de Seguretat C.1
    if (subtopicId === 'c1_1') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'c1_1' || (q.id.startsWith('MOSSOS_C1_') && ['001', '002', '003', '004'].some(k => q.id.includes(k))));
    }
    if (subtopicId === 'c1_2_1') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'c1_2_1' || (q.id.startsWith('MOSSOS_C1_') && ['005', '006', '007', '008', '029'].some(k => q.id.includes(k))));
    }
    if (subtopicId === 'c1_2_2') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'c1_2_2' || (q.id.startsWith('MOSSOS_C1_') && ['009', '010', '011'].some(k => q.id.includes(k))));
    }
    if (subtopicId === 'c1_2_3') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'c1_2_3' || (q.id.startsWith('MOSSOS_C1_') && ['012', '013'].some(k => q.id.includes(k))));
    }
    if (subtopicId === 'c1_2_4') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'c1_2_4' || (q.id.startsWith('MOSSOS_C1_') && (['014', '015', '016', '017', '018', '019', '020', '021', '022', '032', '033'].some(k => q.id.includes(k)) || q.id.includes('REAL'))));
    }
    if (subtopicId === 'c1_2_5') {
      return QUESTIONS_BANK.filter(q => q.apartatId === 'c1_2_5' || (q.id.startsWith('MOSSOS_C1_') && ['023', '024', '025', '026', '027', '028'].some(k => q.id.includes(k))));
    }

    // Subtema d'Àmbit D (Únic)
    if (subtopicId === 'd_unic') {
      return QUESTIONS_BANK.filter(q => 
        q.apartatId === 'd_unic' || 
        q.id.startsWith('ACT26_') || 
        q.id.startsWith('Actualitat_') || 
        q.id.startsWith('cami_d') || 
        q.ambit === 'Actualitat' || 
        q.ambit === 'Àmbit D' ||
        q.seccio?.includes('Actualitat')
      );
    }
  }

  // 2. Coincidència general per Tema complet
  const topicPrefixMap: Record<string, string> = {
    'tema_a1': 'MOSSOS_A1_',
    'tema_a2': 'MOSSOS_A2_',
    'tema_a3': 'MOSSOS_A3_',
    'tema_a4': 'MOSSOS_A4_',
    'tema_a5': 'MOSSOS_A5_',
    'tema_a6': 'MOSSOS_A6_',
    'tema_a7': 'MOSSOS_A7_',
    'tema_b1': 'MOSSOS_B1_',
    'tema_b2': 'MOSSOS_B2_',
    'tema_b3': 'MOSSOS_B3_',
    'tema_b4': 'MOSSOS_B4_',
    'tema_b5': 'MOSSOS_B5_',
    'tema_b6': 'MOSSOS_B6_',
    'tema_b7': 'MOSSOS_B7_',
    'tema_b8': 'MOSSOS_B8_',
    'tema_c1': 'MOSSOS_C1_',
    'tema_c2': 'MOSSOS_C2_',
    'tema_c3': 'MOSSOS_C3_',
    'tema_c4': 'MOSSOS_C4_',
    'tema_c5': 'MOSSOS_C5_',
  };

  const prefix = topicPrefixMap[topicId];
  if (prefix) {
    const list = QUESTIONS_BANK.filter(q => 
      q.id.startsWith(prefix) || 
      q.temaId === topicId || 
      (topicId === 'tema_a1' && q.id.startsWith('cami_a1_')) ||
      (topicId === 'tema_b1' && q.id.startsWith('cami_b1_')) ||
      (topicId === 'tema_c1' && q.id.startsWith('cami_c1_'))
    );
    if (list.length > 0) return list;
  }

  if (topicId === 'tema_d1') {
    return QUESTIONS_BANK.filter(q => 
      q.id.startsWith('ACT26_') || 
      q.id.startsWith('Actualitat_') || 
      q.id.startsWith('cami_d') || 
      q.ambit === 'Actualitat' || 
      q.ambit === 'Àmbit D' || 
      q.seccio?.includes('Actualitat')
    );
  }

  // Fallback per temaId directe
  const fallback = QUESTIONS_BANK.filter(q => q.temaId === topicId);
  if (fallback.length > 0) return fallback;

  return [];
}

/**
 * Retorna el nombre exacte de preguntes disponibles per a un Tema o Subtema al banc
 */
export function getQuestionCountForTopicOrSubtopic(topicId: string, subtopicId?: string): number {
  return getQuestionsForTopicOrSubtopic(topicId, subtopicId).length;
}

// Iniciar càrrega i subscripció Realtime a Supabase en entorns de navegador
if (typeof window !== 'undefined') {
  initCloudQuestions().catch(console.warn);

  subscribeToCustomQuestions((cloudQuestions) => {
    if (Array.isArray(cloudQuestions) && cloudQuestions.length > 0) {
      const existingIds = new Set(QUESTIONS_BANK.map(q => q.id));
      const toAdd = cloudQuestions.filter((q: any) => !existingIds.has(q.id));
      if (toAdd.length > 0) {
        QUESTIONS_BANK = [...toAdd, ...QUESTIONS_BANK];
        (window as any).bancoPreguntes = QUESTIONS_BANK;
        notifyListeners();
      }
    }
  });
}
