export type PLConvocatoriaStatus = 
  | 'pending'               // Pendent de convocatòria
  | 'open_registration'     // Convocatòria oberta (inscripcions obertes)
  | 'closed_registration'   // Inscripcions tancades (pendent de data d'examen)
  | 'exam_scheduled'       // Data d'examen fixada (compte enrere actiu)
  | 'finished';            // Examen realitzat / Convocatòria finalitzada

export interface PLMunicipi {
  id: string;
  name: string;
  slug: string;
  emblem_url?: string;
  banner_color?: string;
  status: PLConvocatoriaStatus;
  registration_deadline?: string | null;  // Data límit inscripció (ISO)
  registration_closed_at?: string | null; // Data que es va tancar (ISO)
  exam_date?: string | null;              // Data de l'examen (ISO)
  notes?: string | null;
  order_index?: number;
  cultura_weight?: number; // % pes de cultura general (per defecte 50)
  temari_weight?: number;  // % pes de temari específic (per defecte 50)
  created_at?: string;
  updated_at?: string;
}

export type PLTopicScope = 'comu' | 'cultura_general' | 'municipi';

export interface PLTema {
  id: string;
  municipi_id?: string | null; // null si és comú o cultura general
  scope: PLTopicScope;
  annex?: string | null;       // ex: 'Annex I', 'Annex II'
  num: number;
  code: string;                // ex: 'Tema 1', 'Tema A.1'
  title: string;
  description?: string | null;
  linked_common_topic_id?: string | null; // Per enllaçar amb un tema comú
  created_at?: string;
}

export interface PLPregunta {
  id: string;
  tema_id: string;
  municipi_id?: string | null;
  question: string;
  options: string[];
  correct_answer: number;      // Índex 0, 1, 2, 3
  explanation?: string | null;
  difficulty?: 'facil' | 'mitjana' | 'dificil' | string;
  ambit?: string | null;
  seccio?: string | null;
  categoria?: string | null;
  created_at?: string;
}

export interface PLUserProgressionRecord {
  id?: string;
  user_id: string;
  municipi_id?: string | null;
  tema_id: string;
  answered_questions: string[]; // IDs de preguntes resoltes
  failed_questions: string[];   // IDs de preguntes errades (per al repàs)
  correct_count: number;
  total_attempts: number;
  updated_at?: string;
}

export interface PLExamScore {
  id: string;
  user_id: string;
  municipi_id: string;
  cultura_score: number; // 0 - 10
  temari_score: number;  // 0 - 10
  total_score: number;   // 0 - 10 ponderat
  is_passed: boolean;    // >= 5.00
  exam_date?: string | null;
  notes?: string | null;
  created_at?: string;
}

// Format d'importació massiva JSON suportat
export interface PLMassiveQuestionInput {
  id?: string;
  pregunta?: string;
  question?: string;
  opcions?: string[];
  options?: string[];
  resposta?: number;
  correct_answer?: number;
  explicacio?: string;
  explanation?: string;
  tema?: string;
  tema_id?: string;
  code?: string;
  ambit?: string;
  seccio?: string;
  categoria?: string;
  municipi_id?: string;
}
