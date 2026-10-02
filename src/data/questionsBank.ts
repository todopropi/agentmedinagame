import { Question, QuestionAmbit } from '../types';
import { 
  syncSupabaseCustomQuestions, 
  fetchSupabaseCustomQuestions,
  deleteSupabaseCustomQuestion,
  subscribeToCustomQuestions,
  fetchQuestionsFromSupabaseTable
} from '../../supabase';

// Banc de preguntes dinàmic en memòria (protegit: no emmagatzema preguntes en text pla al codi)
export let QUESTIONS_BANK: Question[] = [];

// Cache de sessió per a velocitat instantània sense re-descarregar constantment
if (typeof window !== 'undefined') {
  try {
    const cached = sessionStorage.getItem('agent_medina_cloud_questions');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        QUESTIONS_BANK = parsed;
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
    // 1. Carregar des de la taula 'questions' de Supabase (les 1.048 preguntes)
    const tableQuestions = await fetchQuestionsFromSupabaseTable();
    if (Array.isArray(tableQuestions) && tableQuestions.length > 0) {
      QUESTIONS_BANK = tableQuestions;
      if (typeof window !== 'undefined') {
        (window as any).bancoPreguntes = QUESTIONS_BANK;
        try {
          sessionStorage.setItem('agent_medina_cloud_questions', JSON.stringify(tableQuestions));
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
