// Cliente Supabase conectado a: https://wlavcwifxmtwewhakjqg.supabase.co
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://wlavcwifxmtwewhakjqg.supabase.co';
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsYXZjd2lmeG10d2V3aGFranFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2Mzg3NzEsImV4cCI6MjEwNTIxNDc3MX0.XH246HWdcGZdAlnI-9yOyG8LpWYbSyzAH9K3rHD4Mew';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * A) REGISTRO / LOGIN Y PERFILES EN SUPABASE:
 * Sincroniza el usuario en la tabla 'profiles' con username, email, avatar_url y total_points (mèrits).
 */
export async function syncSupabaseProfile(user: {
  uid?: string;
  id?: string;
  username?: string;
  displayName?: string;
  total_points?: number;
  xp?: number;
  merits?: number;
  email?: string;
  avatar_url?: string;
  photoURL?: string;
  badge?: string;
  equippedShieldId?: string;
}) {
  try {
    const userId = user.uid || user.id || '';
    if (!userId) return null;

    // Prioritat de punts per al Rànquing Global: total_points o xp
    const points = typeof user.total_points === 'number'
      ? user.total_points
      : (typeof user.xp === 'number'
        ? user.xp
        : (typeof user.merits === 'number' ? user.merits : 0));

    // Escut actiu o avatar policial per mostrar al rànquing
    const activeShieldOrAvatar = user.equippedShieldId || user.avatar_url || user.photoURL || user.badge || 'generic_pvc';

    const candidateName = user.username || user.displayName;
    const initialName = candidateName && candidateName !== 'Aspirant' && candidateName !== 'Aspirant Medina' 
      ? candidateName 
      : (candidateName || 'Aspirant');

    const payload: Record<string, any> = {
      id: userId,
      username: initialName,
      total_points: points,
      xp: typeof user.xp === 'number' ? user.xp : points,
      merits: typeof user.merits === 'number' ? user.merits : 0,
      avatar_url: activeShieldOrAvatar,
      equipped_shield_id: activeShieldOrAvatar,
      updated_at: new Date().toISOString()
    };

    if (user.email) payload.email = user.email;

    const isAdminUser = Boolean(user.email && user.email.toLowerCase().trim() === 'opossscar@gmail.com');
    if (isAdminUser) {
      payload.role = 'admin';
      payload.is_unlimited = true;
      payload.subscription_status = 'unlimited';
    }

    // Comprovar si ja té subscripció, email o username registrat per no sobreescriure'ls amb buits o genèrics
    try {
      const existing = await fetchSupabaseProfile(userId);
      if (existing) {
        // Preservar username si el que arriba és buit o genèric 'Aspirant'
        if ((!payload.username || payload.username === 'Aspirant' || payload.username === 'Aspirant Medina') && existing.username && existing.username !== 'Aspirant') {
          payload.username = existing.username;
        }
        // Preservar email si en aquesta crida no s'ha passat
        if (!payload.email && existing.email) {
          payload.email = existing.email;
        }
        if (existing.role && !isAdminUser) payload.role = existing.role;
        if (existing.subscription_status && !isAdminUser) payload.subscription_status = existing.subscription_status;
        if (existing.subscription_expires_at && !isAdminUser) payload.subscription_expires_at = existing.subscription_expires_at;
        if (typeof existing.is_unlimited === 'boolean' && !isAdminUser) payload.is_unlimited = existing.is_unlimited;
      } else if (!isAdminUser) {
        // Nou usuari: Cortesia de 48 hores automàtica
        payload.role = 'aspirant';
        payload.subscription_status = 'trial';
        payload.is_unlimited = false;
        payload.subscription_expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      }
    } catch {}

    let { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error && (error.message?.includes('column "merits"') || error.message?.includes("'merits' column"))) {
      delete payload.merits;
      delete payload.xp;
      delete payload.equipped_shield_id;
      const retry = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select();
      data = retry.data;
      error = retry.error;
    }

    // Actualitzar també 'user_progression' directament per garantir 100% de coherència en temps real
    try {
      await supabase.from('user_progression').upsert({
        user_id: userId,
        username: payload.username,
        xp: payload.xp,
        merits: payload.merits,
        equipped_shield_id: activeShieldOrAvatar,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    } catch {}

    if (error) {
      console.warn('Supabase sync profile error:', error.message, error);
      return null;
    }

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('profile_synced', {
          detail: {
            ...payload,
            uid: userId,
            id: userId,
            merits: user.merits,
            xp: typeof user.xp === 'number' ? user.xp : points,
            equippedShieldId: user.equippedShieldId || activeShieldOrAvatar
          }
        }));
      } catch {}
    }

    return data?.[0] || data;
  } catch (err) {
    console.warn('Supabase sync profile exception:', err);
    return null;
  }
}

/**
 * Obtener perfil de usuario desde Supabase
 */
export async function fetchSupabaseProfile(userId: string) {
  try {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch profile error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase fetch profile exception:', err);
    return null;
  }
}

/**
 * B) DATOS DE ESTADO Y PROGRESO DEL JUGADOR EN LA NUBE:
 * Guarda estados críticos (méritos, xp, rang, escuts desbloquejats, comodins 50%, etc.)
 * en Supabase bajo la tabla 'matches' (id: 'user_data_' + userId)
 */
export async function syncSupabaseUserGameData(userId: string, data: Record<string, any>) {
  try {
    if (!userId) return null;
    const recordId = `user_data_${userId}`;

    // Obtenir l'estat previ per no perdre preguntes fallades en actualitzacions parcials
    const prev = await fetchSupabaseUserGameData(userId);

    const mergedState = {
      ...(prev || {}),
      ...data,
      updated_at: Date.now()
    };

    const payload = {
      id: recordId,
      player1_id: userId,
      player2_id: 'user_state',
      current_turn: userId,
      status: 'active',
      score_p1: mergedState.merits ?? 0,
      score_p2: mergedState.xp ?? 0,
      state: mergedState
    };

    const { data: res, error } = await supabase
      .from('matches')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      console.warn('Supabase sync user game data error:', error.message);
      return null;
    }
    return res?.[0]?.state || res;
  } catch (err) {
    console.warn('Supabase sync user game data exception:', err);
    return null;
  }
}

/**
 * Leer estado de juego de usuario en la nube desde Supabase
 */
export async function fetchSupabaseUserGameData(userId: string) {
  try {
    if (!userId) return null;
    const recordId = `user_data_${userId}`;
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', recordId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data.state;
  } catch (err) {
    console.warn('Supabase fetch user game data exception:', err);
    return null;
  }
}

/**
 * C) ANTI-TRAMPAS Y ESTADO DE LA OCA EN SUPABASE:
 * Guarda en tiempo real el progreso de las 50 casillas, fichas y la pregunta activa
 * para evitar trampas al recargar o cambiar de pestaña.
 */
export async function syncSupabaseOcaProgress(params: {
  userId: string;
  userName?: string;
  avatarShield?: string;
  selectedAmbit: string;
  currentTile: number;
  boardProgress: Record<string, number>;
  activeQuestionState?: any | null;
}) {
  try {
    if (!params.userId) return null;
    const recordId = `oca_progress_${params.userId}`;

    const payload = {
      id: recordId,
      player1_id: params.userId,
      player2_id: `oca_${params.selectedAmbit.replace(/\s+/g, '_')}`,
      current_turn: params.userId,
      status: 'active',
      score_p1: params.currentTile,
      score_p2: params.boardProgress[params.selectedAmbit] ?? params.currentTile,
      state: {
        userId: params.userId,
        userName: params.userName || 'Aspirant',
        avatarShield: params.avatarShield || 'generic_pvc',
        selectedAmbit: params.selectedAmbit,
        currentTile: params.currentTile,
        boardProgress: params.boardProgress,
        activeQuestionState: params.activeQuestionState || null,
        updatedAt: Date.now()
      }
    };

    const { data, error } = await supabase
      .from('matches')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      console.warn('Supabase sync Oca progress error:', error.message);
      return null;
    }
    return data?.[0] || data;
  } catch (err) {
    console.warn('Supabase sync Oca progress exception:', err);
    return null;
  }
}

/**
 * Obtener estado guardado de la Oca del usuario (evita trampas al recargar)
 */
export async function fetchSupabaseOcaProgress(userId: string) {
  try {
    if (!userId) return null;
    const recordId = `oca_progress_${userId}`;
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', recordId)
      .maybeSingle();

    if (error || !data) return null;
    return data.state;
  } catch (err) {
    console.warn('Supabase fetch Oca progress exception:', err);
    return null;
  }
}

/**
 * Obtener todos los aspirantes activos en la Oca para mostrar fichas en el tablero
 */
export async function fetchOcaActivePlayers(selectedAmbit?: string) {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .like('id', 'oca_progress_%')
      .order('updated_at', { ascending: false })
      .limit(30);

    if (error || !data) return [];
    
    return data
      .map(row => row.state)
      .filter(st => Boolean(st && (!selectedAmbit || st.selectedAmbit === selectedAmbit)));
  } catch (err) {
    console.warn('Supabase fetch active Oca players exception:', err);
    return [];
  }
}

/**
 * D) CONFIGURACIÓN Y NOMBRES DE LOS APARTADOS EN SUPABASE:
 * Centraliza nombres de secciones, precios de comodines y ajustes globales.
 */
export const DEFAULT_APP_CONFIG = {
  sectionNames: {
    campanya: "Tauler de l'Oca Policial",
    duels: "Duels 1v1 Policials",
    tienda: "Botiga de Mèrits i Escuts",
    repas: "Repàs Intel·ligent Guia 2026",
    ranking: "Rànquing Opositor Global"
  },
  wildcardName: "Comodí 50%",
  wildcardPrice: 10,
  announcement: "Benvinguts a l'Agent Medina! Preguntes oficials i Guia 2026 sincronitzades en núvol."
};

export async function fetchSupabaseAppConfig() {
  try {
    // 1. Consultar primer la taula dedicada 'app_config'
    const { data: dedicatedConfig, error: dedicatedErr } = await supabase
      .from('app_config')
      .select('*')
      .eq('id', 'system_app_config')
      .maybeSingle();

    if (!dedicatedErr && dedicatedConfig && dedicatedConfig.config_data) {
      return {
        ...DEFAULT_APP_CONFIG,
        ...dedicatedConfig.config_data,
        sectionNames: {
          ...DEFAULT_APP_CONFIG.sectionNames,
          ...(dedicatedConfig.config_data.sectionNames || {})
        }
      };
    }

    // 2. Fallback a la taula 'matches'
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', 'system_app_config')
      .maybeSingle();

    if (error || !data || !data.state) {
      return DEFAULT_APP_CONFIG;
    }
    return {
      ...DEFAULT_APP_CONFIG,
      ...data.state,
      sectionNames: {
        ...DEFAULT_APP_CONFIG.sectionNames,
        ...(data.state.sectionNames || {})
      }
    };
  } catch (err) {
    console.warn('Supabase fetch app config exception:', err);
    return DEFAULT_APP_CONFIG;
  }
}

export async function syncSupabaseAppConfig(config: any) {
  try {
    // 1. Guardar a la taula dedicada 'app_config'
    supabase
      .from('app_config')
      .upsert({
        id: 'system_app_config',
        config_data: config,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .then();

    // 2. Guardar a 'matches' per redundància
    const payload = {
      id: 'system_app_config',
      player1_id: 'system',
      player2_id: 'app_config',
      current_turn: 'system',
      status: 'active',
      score_p1: 0,
      score_p2: 0,
      state: config
    };

    const { data, error } = await supabase
      .from('matches')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      console.warn('Supabase sync app config error:', error.message);
      return null;
    }
    return data?.[0] || data;
  } catch (err) {
    console.warn('Supabase sync app config exception:', err);
    return null;
  }
}

/**
 * E) PREGUNTAS CENTRALIZADAS EN SUPABASE:
 * Guarda i recupera preguntes importades per l'administrador a la taula 'custom_questions'
 * amb suport de retrocompatibilitat amb 'matches'.
 */
export async function fetchSupabaseCustomQuestions(): Promise<any[]> {
  try {
    // 1. Intentar consultar primer la taula dedicada 'custom_questions'
    const { data: dedicatedQuestions, error: dedicatedErr } = await supabase
      .from('custom_questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!dedicatedErr && Array.isArray(dedicatedQuestions) && dedicatedQuestions.length > 0) {
      return dedicatedQuestions.map((q: any) => ({
        id: q.id,
        ambit: q.ambit,
        seccio: q.seccio || '',
        pregunta: q.pregunta,
        opcions: Array.isArray(q.opcions) ? q.opcions : (typeof q.opcions === 'string' ? JSON.parse(q.opcions) : []),
        resposta: typeof q.resposta === 'number' ? q.resposta : Number(q.resposta) || 0,
        explicacio: q.explicacio || ''
      }));
    }

    // 2. Fallback a 'matches' (id: 'system_custom_questions')
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', 'system_custom_questions')
      .maybeSingle();

    if (error || !data || !data.state?.questions) {
      return [];
    }
    return data.state.questions || [];
  } catch (err) {
    console.warn('Supabase fetch custom questions exception:', err);
    return [];
  }
}

export async function syncSupabaseCustomQuestions(questions: any[]) {
  try {
    if (!Array.isArray(questions) || questions.length === 0) return null;

    // 1. Sincronitzar en blocs de 50 a la taula 'custom_questions' per no saturar
    const rows = questions.map((q: any) => ({
      id: q.id || `custom_q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ambit: q.ambit || 'Àmbit A',
      seccio: q.seccio || '',
      pregunta: q.pregunta,
      opcions: q.opcions,
      resposta: q.resposta,
      explicacio: q.explicacio || '',
      created_at: new Date().toISOString()
    }));

    const CHUNK_SIZE = 50;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const { error: upsertErr } = await supabase
        .from('custom_questions')
        .upsert(chunk, { onConflict: 'id' });
      if (upsertErr) {
        console.warn('Avís inserint a custom_questions:', upsertErr.message);
      }
    }

    // 2. Desar còpia a 'matches' per redundància
    const payload = {
      id: 'system_custom_questions',
      player1_id: 'system',
      player2_id: 'questions_bank',
      current_turn: 'system',
      status: 'active',
      score_p1: questions.length,
      score_p2: 0,
      state: {
        questions,
        total: questions.length,
        updatedAt: Date.now()
      }
    };

    const { data, error } = await supabase
      .from('matches')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      console.warn('Supabase sync custom questions error:', error.message);
      return null;
    }
    return data?.[0] || data;
  } catch (err) {
    console.warn('Supabase sync custom questions exception:', err);
    return null;
  }
}

/**
 * Eliminar una pregunta personalitzada de Supabase
 */
export async function deleteSupabaseCustomQuestion(questionId: string) {
  try {
    if (!questionId) return;
    await supabase.from('custom_questions').delete().eq('id', questionId);

    // Actualitzar també matches.system_custom_questions
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('id', 'system_custom_questions')
      .maybeSingle();

    if (data?.state?.questions && Array.isArray(data.state.questions)) {
      const filtered = data.state.questions.filter((q: any) => q.id !== questionId);
      await supabase.from('matches').update({
        score_p1: filtered.length,
        state: {
          ...data.state,
          questions: filtered,
          total: filtered.length,
          updatedAt: Date.now()
        }
      }).eq('id', 'system_custom_questions');
    }
  } catch (err) {
    console.warn('Error eliminant pregunta de Supabase:', err);
  }
}

export function subscribeToCustomQuestions(onUpdate: (questions: any[]) => void) {
  try {
    const channel = supabase
      .channel('custom_questions_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'custom_questions' },
        async () => {
          const questions = await fetchSupabaseCustomQuestions();
          if (Array.isArray(questions) && questions.length > 0) {
            onUpdate(questions);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime custom_questions subscription error:', err);
    return () => {};
  }
}

/**
 * Conceptes Trampa i Regles Mnemotècniques personalitzades a Supabase
 */
export async function syncSupabaseCustomConcepts(confusions: any[], mnemonics: any[]) {
  try {
    const payload = {
      id: 'system_custom_concepts',
      player1_id: 'system',
      player2_id: 'concepts_and_mnemonics',
      current_turn: 'system',
      status: 'active',
      score_p1: confusions.length,
      score_p2: mnemonics.length,
      state: {
        confusions,
        mnemonics,
        updatedAt: Date.now()
      }
    };
    await supabase.from('matches').upsert(payload, { onConflict: 'id' });
  } catch (err) {
    console.warn('Error syncing custom concepts with Supabase:', err);
  }
}

export async function fetchSupabaseCustomConcepts(): Promise<{ confusions?: any[]; mnemonics?: any[] } | null> {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', 'system_custom_concepts')
      .maybeSingle();

    if (error || !data?.state) return null;
    return data.state;
  } catch (err) {
    console.warn('Error fetching custom concepts from Supabase:', err);
    return null;
  }
}

/**
 * F) CATÁLOGO DE LA TIENDA CENTRALIZADO EN SUPABASE:
 * Recupera escuts de la taula 'system_store_catalog' (o del registre 'system_store_catalog' a matches).
 * REGLA ESTRICTA: Mai sobreescriu ni esborra escuts personalitzats, noms, descripcions o logotips existents!
 */
export async function fetchSupabaseStoreCatalog(): Promise<any[] | null> {
  try {
    // 1. Intentar llegir primer de la taula dedicada 'system_store_catalog'
    const { data: dedicatedRows, error: dedicatedErr } = await supabase
      .from('system_store_catalog')
      .select('*')
      .order('id', { ascending: true });

    if (!dedicatedErr && Array.isArray(dedicatedRows) && dedicatedRows.length > 0) {
      // Normalitzar columnes SQL a la interfície SpecializedShield
      const mapped = dedicatedRows.map(row => ({
        id: row.id,
        nom: row.nom || row.name || row.title || 'Escut Policial',
        unitat: row.unitat || row.unit || 'Cos Policial',
        descripcio: row.descripcio || row.description || row.desc || '',
        preuMerits: typeof row.preu_merits === 'number' ? row.preu_merits : (row.preuMerits ?? row.price ?? 50),
        escutTipus: row.escut_tipus || row.escutTipus || 'generic_pvc',
        colorPrincipal: row.color_principal || row.colorPrincipal || 'blue-600',
        colorSecundari: row.color_secundari || row.colorSecundari || '#eab308',
        customLogoUrl: row.custom_logo_url || row.customLogoUrl || undefined,
        hideBorder: Boolean(row.hide_border ?? row.hideBorder),
        customLogoScale: typeof row.custom_logo_scale === 'number' ? Number(row.custom_logo_scale) : (row.customLogoScale ?? 1.25),
        logoFit: row.logo_fit || row.logoFit || 'contain',
        logoShape: row.logo_shape || row.logoShape || 'rounded',
        ambitDesbloqueig: row.ambit_desbloqueig || row.ambitDesbloqueig || undefined
      }));
      return mapped;
    }

    // 2. Si la taula 'system_store_catalog' no té files o no existeix, consultar 'matches' (id: 'system_store_catalog')
    const { data: matchRecord, error: matchErr } = await supabase
      .from('matches')
      .select('*')
      .eq('id', 'system_store_catalog')
      .maybeSingle();

    if (!matchErr && matchRecord && matchRecord.state?.shields && Array.isArray(matchRecord.state.shields) && matchRecord.state.shields.length > 0) {
      return matchRecord.state.shields;
    }

    return null;
  } catch (err) {
    console.warn('Supabase fetch store catalog exception:', err);
    return null;
  }
}

/**
 * Desa el catàleg a Supabase de manera optimitzada contra el Statement Timeout (Error 500).
 * Escriu a 'system_store_catalog' (per files individuals lleugeres) i també a 'matches' per compatibilitat.
 */
export async function syncSupabaseStoreCatalog(shields: any[]) {
  if (!Array.isArray(shields) || shields.length === 0) return null;

  try {
    // 1. Tractament net de dades
    const sanitizedShields = shields.map(s => {
      return {
        id: s.id,
        nom: s.nom || 'Escut Policial',
        unitat: s.unitat || 'Cos Policial',
        descripcio: s.descripcio || '',
        preuMerits: typeof s.preuMerits === 'number' ? s.preuMerits : 50,
        escutTipus: s.escutTipus || 'generic_pvc',
        colorPrincipal: s.colorPrincipal || 'blue-600',
        colorSecundari: s.colorSecundari || '#eab308',
        customLogoUrl: s.customLogoUrl || undefined,
        hideBorder: Boolean(s.hideBorder),
        customLogoScale: typeof s.customLogoScale === 'number' ? s.customLogoScale : 1.25,
        logoFit: s.logoFit || 'contain',
        logoShape: s.logoShape || 'rounded',
        ambitDesbloqueig: s.ambitDesbloqueig || undefined
      };
    });

    // 2. Guardar fila a fila o en batch a la taula dedicada 'system_store_catalog' (sense camps inexistents al schema)
    const rows = sanitizedShields.map(s => ({
      id: s.id,
      nom: s.nom,
      unitat: s.unitat,
      descripcio: s.descripcio,
      preu_merits: s.preuMerits,
      escut_tipus: s.escutTipus,
      color_principal: s.colorPrincipal,
      color_secundari: s.colorSecundari,
      custom_logo_url: s.customLogoUrl || null,
      hide_border: s.hideBorder,
      custom_logo_scale: s.customLogoScale,
      logo_fit: s.logoFit,
      ambit_desbloqueig: s.ambitDesbloqueig || null,
      updated_at: new Date().toISOString()
    }));

    const dedicatedPromise = supabase
      .from('system_store_catalog')
      .upsert(rows, { onConflict: 'id' });

    // 3. Guardar també a 'matches' (id: 'system_store_catalog') per compatibilitat
    const payload = {
      id: 'system_store_catalog',
      player1_id: 'system',
      player2_id: 'store_catalog',
      current_turn: 'system',
      status: 'active',
      score_p1: sanitizedShields.length,
      score_p2: 0,
      state: {
        shields: sanitizedShields,
        updatedAt: Date.now()
      }
    };

    const matchPromise = supabase
      .from('matches')
      .upsert(payload, { onConflict: 'id' })
      .select();

    const [matchResult, dedicatedResult] = await Promise.allSettled([matchPromise, dedicatedPromise]);

    if (matchResult.status === 'fulfilled' && matchResult.value?.error) {
      console.warn('Avís guardant a matches.system_store_catalog:', matchResult.value.error.message);
    }
    if (dedicatedResult.status === 'fulfilled' && dedicatedResult.value?.error) {
      console.warn('Error taula system_store_catalog:', dedicatedResult.value.error.message);
    }

    return sanitizedShields;
  } catch (err) {
    console.warn('Supabase sync store catalog exception:', err);
    return null;
  }
}

/**
 * Eliminar un escut del catàleg de la botiga a Supabase
 */
export async function deleteSupabaseStoreItem(shieldId: string) {
  try {
    if (!shieldId) return;
    await supabase.from('system_store_catalog').delete().eq('id', shieldId);

    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('id', 'system_store_catalog')
      .maybeSingle();

    if (data?.state?.shields && Array.isArray(data.state.shields)) {
      const remaining = data.state.shields.filter((s: any) => s.id !== shieldId);
      await supabase.from('matches').update({
        score_p1: remaining.length,
        state: {
          ...data.state,
          shields: remaining,
          updatedAt: Date.now()
        }
      }).eq('id', 'system_store_catalog');
    }
  } catch (err) {
    console.warn('Error eliminant escut de la botiga a Supabase:', err);
  }
}

/**
 * F2) GESTIÓ DE MATERIAL D'ESTUDI / APUNTS (ROLES ADMIN I DOCÈNCIA):
 * Permet emmagatzemar arxius, apunts i dossiers en qualsevol format (PDF, Word, PPTX, TXT)
 * amb estats: 'actiu', 'proximament', 'ocult'.
 */
export const DEFAULT_STUDY_MATERIALS = [
  {
    id: 'mat_1',
    titol: "Dossier Oficial CME: Esquemes Àmbit A (Història i Institucions)",
    descripcio: "Resum executiu de tots els esdeveniments clau des de 1714 fins a la Generalitat actual, amb taules cronològiques.",
    format: 'pdf' as const,
    ambit: 'Àmbit A',
    temaAssociat: 'A1 - Història de Catalunya',
    preuMerits: 25,
    arxiuUrl: 'https://interior.gencat.cat/ca/el_departament/publicacions/seguretat/guia-oposicions/',
    estat: 'actiu' as const,
    dataCreacio: '2026-01-15',
    tamanyText: '2.8 MB (42 pàgines)'
  },
  {
    id: 'mat_2',
    titol: "Quadre Sinòptic de Procediment Policial & LECrim",
    descripcio: "Procediment d'actuació davant la detenció, terminis legals de 72h, dret d'assistència lletrada i Habeas Corpus (LO 6/1984).",
    format: 'pdf' as const,
    ambit: 'Àmbit C',
    temaAssociat: 'C2 - LECrim i Detingut',
    preuMerits: 30,
    arxiuUrl: 'https://interior.gencat.cat/ca/el_departament/publicacions/seguretat/guia-oposicions/',
    estat: 'actiu' as const,
    dataCreacio: '2026-02-10',
    tamanyText: '1.9 MB (28 pàgines)'
  },
  {
    id: 'mat_3',
    titol: "Recull de Preguntes Examen Oficial Comentades (2024 - 2025)",
    descripcio: "Compilació de les preguntes oficials dels dos últims processos selectius amb justificació raonada i jurisprudència.",
    format: 'pdf' as const,
    ambit: 'Tots',
    preuMerits: 45,
    arxiuUrl: 'https://interior.gencat.cat/ca/el_departament/publicacions/seguretat/guia-oposicions/',
    estat: 'actiu' as const,
    dataCreacio: '2026-03-01',
    tamanyText: '4.5 MB (65 pàgines)'
  },
  {
    id: 'mat_4',
    titol: "Apunts Clau de Codi Penal: Delictes contra les Persones i Patrimoni",
    descripcio: "Taula comparativa de penes, agreujants, delictes d'homicidi, lesions, robatori, furt i estafes.",
    format: 'pdf' as const,
    ambit: 'Àmbit C',
    temaAssociat: 'C1 - Codi Penal',
    preuMerits: 35,
    arxiuUrl: '',
    estat: 'proximament' as const,
    dataCreacio: '2026-04-01',
    tamanyText: 'Pròximament disponible'
  },
  {
    id: 'mat_5',
    titol: "Guia Oficial de Deontologia i Règim Disciplinari PG-ME 2026",
    descripcio: "Classificació completa de faltes molt greus, greus i lleus segons la Llei 10/1994 amb terminis de prescripció.",
    format: 'pdf' as const,
    ambit: 'Àmbit C',
    temaAssociat: 'C5 - Deontologia',
    preuMerits: 20,
    arxiuUrl: 'https://interior.gencat.cat/ca/el_departament/publicacions/seguretat/guia-oposicions/',
    estat: 'actiu' as const,
    dataCreacio: '2026-02-20',
    tamanyText: '1.2 MB (18 pàgines)'
  },
  {
    id: 'mat_6',
    titol: "Presentació Interactiva: Policia Internacional (Europol, Interpol, Sirene)",
    descripcio: "Diapositives d'estudi amb infografies de cooperació policial transfronterera, alertes SIS i Tractat de Prüm.",
    format: 'pptx' as const,
    ambit: 'Àmbit D',
    temaAssociat: 'D4 - Policia Internacional',
    preuMerits: 25,
    arxiuUrl: '',
    estat: 'proximament' as const,
    dataCreacio: '2026-05-01',
    tamanyText: 'Pròximament disponible'
  }
];

export async function fetchSupabaseStudyMaterials(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', 'system_study_materials')
      .maybeSingle();

    if (!error && data && data.state?.materials && Array.isArray(data.state.materials)) {
      return data.state.materials;
    }

    // Fallback a localStorage o valors per defecte
    const local = localStorage.getItem('agent_medina_study_materials');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }

    return DEFAULT_STUDY_MATERIALS;
  } catch (err) {
    console.warn('Error fetching study materials from Supabase:', err);
    return DEFAULT_STUDY_MATERIALS;
  }
}

export async function syncSupabaseStudyMaterials(materials: any[]): Promise<boolean> {
  try {
    if (!Array.isArray(materials)) return false;

    // Desar localment per immediatesa
    localStorage.setItem('agent_medina_study_materials', JSON.stringify(materials));

    const payload = {
      id: 'system_study_materials',
      player1_id: 'system',
      player2_id: 'study_materials',
      current_turn: 'system',
      status: 'active',
      score_p1: materials.length,
      score_p2: 0,
      state: {
        materials,
        updatedAt: Date.now()
      }
    };

    const { error } = await supabase
      .from('matches')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Avís syncing study materials to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exception syncing study materials to Supabase:', err);
    return false;
  }
}

/**
 * Subscripció en temps real als canvis del catàleg de la botiga
 * Escolta canvis a 'system_store_catalog' i a 'matches'
 */
export function subscribeToStoreCatalog(onUpdate: (shields: any[]) => void) {
  try {
    const channel = supabase
      .channel('store_catalog_multi_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_store_catalog' },
        async () => {
          const catalog = await fetchSupabaseStoreCatalog();
          if (catalog && catalog.length > 0) {
            onUpdate(catalog);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: 'id=eq.system_store_catalog' },
        (payload: any) => {
          if (payload?.new?.state?.shields && Array.isArray(payload.new.state.shields)) {
            onUpdate(payload.new.state.shields);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime store catalog subscription error:', err);
    return () => {};
  }
}

/**
 * Pujada d'imatges i logotips directament a Supabase Storage (Bucket 'app-media')
 * Retorna la URL pública per utilitzar directament a customLogoUrl o avatar_url.
 * Evita completament el Statement Timeout (Error 500) eliminant cadenes Base64 de la base de dades.
 */
export async function uploadSupabaseImage(
  fileOrBase64: File | Blob | string,
  fileNamePrefix = 'logo'
): Promise<string | null> {
  try {
    let blob: Blob;
    let extension = 'png';
    let contentType = 'image/png';

    if (typeof fileOrBase64 === 'string') {
      if (!fileOrBase64.startsWith('data:')) {
        // Ja és una URL web/http
        return fileOrBase64;
      }
      const match = fileOrBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return null;
      contentType = match[1];
      extension = contentType.split('/')[1] || 'png';
      if (extension.includes('svg')) extension = 'svg';
      const binary = atob(match[2]);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      blob = new Blob([array], { type: contentType });
    } else {
      blob = fileOrBase64;
      contentType = fileOrBase64.type || 'image/png';
      extension = contentType.split('/')[1] || 'png';
      if (extension.includes('svg')) extension = 'svg';
    }

    const cleanPrefix = fileNamePrefix.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = `badges/${cleanPrefix}_${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('app-media')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType
      });

    if (uploadError) {
      console.info('Supabase Storage (app-media) no disponible o cal crear bucket:', uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from('app-media').getPublicUrl(filePath);
    return data?.publicUrl || null;
  } catch (err) {
    console.warn('Supabase storage upload exception:', err);
    return null;
  }
}

/**
 * G) LISTA DE RETOS:
 * SELECT de nombres y perfiles en 'profiles' para retar opositores
 */
export async function fetchProfilesForChallenges(currentUserId?: string) {
  try {
    let query = supabase
      .from('profiles')
      .select('id, username, total_points, avatar_url, updated_at, email, subscription_status, subscription_expires_at, is_unlimited, role');

    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    const { data, error } = await query.order('total_points', { ascending: false }).limit(300);

    if (error) {
      console.warn('Supabase fetch profiles error:', error.message);
      return [];
    }

    const list = data || [];

    // Enriquir amb user_progression per si tenen un username assignat
    try {
      const { data: progressions } = await supabase
        .from('user_progression')
        .select('user_id, username');

      if (Array.isArray(progressions) && progressions.length > 0) {
        const progMap = new Map<string, string>();
        progressions.forEach(p => {
          if (p && p.user_id && p.username && p.username !== 'Aspirant' && p.username !== 'Aspirant Medina') {
            progMap.set(p.user_id, p.username);
          }
        });

        list.forEach(p => {
          const progName = progMap.get(p.id);
          if (progName && (!p.username || p.username === 'Aspirant' || p.username === 'Aspirant Medina')) {
            p.username = progName;
          }
        });
      }
    } catch {}

    // Filtrar estrictament usuaris caducats per no aparèixer a "Retar Opositors"
    const now = Date.now();
    const activeProfiles = list.filter(p => {
      if (p.role === 'admin' || p.is_unlimited || p.subscription_status === 'unlimited') {
        return true;
      }
      if (p.subscription_status === 'expired') {
        return false;
      }
      if (p.subscription_expires_at) {
        const expiryTime = new Date(p.subscription_expires_at).getTime();
        if (expiryTime <= now) {
          return false;
        }
      }
      return true;
    });

    return activeProfiles;
  } catch (err) {
    console.warn('Supabase fetch profiles exception:', err);
    return [];
  }
}

/**
 * H) SISTEMA DE DUELOS / TURNOS:
 * 1. Al enviar un reto: INSERT en 'matches' (Bloqueo estricto anti-duplicados)
 */
export async function createMatch(
  challengerIdOrParams: string | {
    challengerId?: string;
    opponentId?: string;
    player1Id?: string;
    player2Id?: string;
    player1Name?: string;
    player2Name?: string;
  },
  opponentIdParam?: string
) {
  try {
    let challengerId = '';
    let opponentId = '';

    if (typeof challengerIdOrParams === 'string') {
      challengerId = challengerIdOrParams;
      opponentId = opponentIdParam || '';
    } else if (challengerIdOrParams) {
      challengerId = challengerIdOrParams.challengerId || challengerIdOrParams.player1Id || '';
      opponentId = challengerIdOrParams.opponentId || challengerIdOrParams.player2Id || '';
    }

    if (!challengerId || !opponentId) return null;

    // 1. COMPROBACIÓN ESTRICTA: ¿Ya hay una partida 'active' entre estos dos usuarios?
    // Buscamos tanto si el usuario es player1 o player2 para evitar duplicados en cualquier dirección
    const { data: existingMatches, error: searchError } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'active')
      .or(`and(player1_id.eq.${challengerId},player2_id.eq.${opponentId}),and(player1_id.eq.${opponentId},player2_id.eq.${challengerId})`)
      .limit(1);

    if (!searchError && existingMatches && existingMatches.length > 0) {
      console.warn('Ya existe una partida activa entre estos jugadores. Se reutiliza la existente.');
      return existingMatches[0];
    }

    // 2. Si no existe ninguna activa, procedemos a crearla
    const { data, error } = await supabase.from('matches').insert([{
      player1_id: challengerId,
      player2_id: opponentId,
      current_turn: challengerId,
      status: 'active',
      score_p1: 0,
      score_p2: 0,
      state: {}
    }]).select();

    if (error) {
      console.warn('Supabase insert match error:', error.message, error);
      return null;
    }
    return data?.[0] || data;
  } catch (err) {
    console.warn('Supabase create match exception:', err);
    return null;
  }
}

export const createMatchInSupabase = createMatch;
export const challengePlayer = createMatch;

/**
 * H) SISTEMA DE DUELOS / TURNOS:
 * 2. Al responder o pasar turno: UPDATE en 'matches' actualizando current_turn y puntuación score_p1
 */
export async function updateMatchTurnInSupabase({
  matchId,
  currentTurn,
  scoreP1,
  scoreP2,
  state,
  status
}: {
  matchId: string | number;
  currentTurn: string;
  scoreP1?: number;
  scoreP2?: number;
  state?: any;
  status?: 'active' | 'finished';
}) {
  try {
    const updatePayload: Record<string, any> = {
      current_turn: currentTurn,
      updated_at: new Date().toISOString()
    };

    if (typeof scoreP1 === 'number') updatePayload.score_p1 = scoreP1;
    if (typeof scoreP2 === 'number') updatePayload.score_p2 = scoreP2;
    if (state !== undefined) updatePayload.state = state;
    if (status) updatePayload.status = status;

    const { data, error } = await supabase
      .from('matches')
      .update(updatePayload)
      .eq('id', matchId)
      .select();

    if (error) {
      console.warn('Supabase update match turn error:', error.message, error);
      return null;
    }
    return data?.[0] || data;
  } catch (err) {
    console.warn('Supabase update match turn exception:', err);
    return null;
  }
}

/**
 * H) SISTEMA DE DUELOS / ABANDONAR O RENDIR-SE:
 * Botón funcional de rendición en partida activa: actualiza inmediatamente el estado en Supabase.
 */
export async function forfeitMatchInSupabase({
  matchId,
  forfeitedByUserId,
  rivalUserId,
  finalState
}: {
  matchId: string | number;
  forfeitedByUserId: string;
  rivalUserId: string;
  finalState?: any;
}) {
  try {
    const updatePayload = {
      status: 'finished',
      current_turn: rivalUserId,
      updated_at: new Date().toISOString(),
      state: {
        ...(finalState || {}),
        status: 'finished',
        winnerUid: rivalUserId,
        forfeitedBy: forfeitedByUserId,
        forfeitedAt: Date.now()
      }
    };

    const { data, error } = await supabase
      .from('matches')
      .update(updatePayload)
      .eq('id', matchId)
      .select();

    if (error) {
      console.warn('Supabase forfeit match error:', error.message, error);
      return null;
    }
    return data?.[0] || data;
  } catch (err) {
    console.warn('Supabase forfeit match exception:', err);
    return null;
  }
}

/**
 * Consulta de partidas activas o concluidas del usuario en 'matches' o 'clean_matches'
 * Filtra AUTOMÀTICAMENT les partides fantasma (registres interns com oca_progress, user_data, system_*)
 */
export async function fetchUserMatches(userId: string) {
  try {
    // 1. Intentar llegir primer de clean_matches si existeix
    let { data, error } = await supabase
      .from('clean_matches')
      .select('*')
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    // 2. Si no hi ha la taula clean_matches o retorna error, fallback a la taula 'matches'
    if (error || !data) {
      const fallbackRes = await supabase
        .from('matches')
        .select('*')
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .order('updated_at', { ascending: false });
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      console.warn('Supabase fetch matches error:', error.message, error);
      return [];
    }

    // Filtrar registres del sistema o de l'Oca que mai són duels 1v1
    const validMatches = (data || []).filter((m: any) => {
      if (!m || !m.id) return false;
      const strId = String(m.id);
      if (strId.startsWith('oca_progress_') || strId.startsWith('user_data_') || strId.startsWith('system_')) {
        return false;
      }
      if (m.player2_id && String(m.player2_id).startsWith('oca_')) {
        return false;
      }
      return true;
    });

    return validMatches;
  } catch (err) {
    console.warn('Supabase fetch matches exception:', err);
    return [];
  }
}

/**
 * Eliminar una partida de Supabase si l'usuari vol netejar-la
 */
export async function deleteMatchInSupabase(matchId: string | number) {
  try {
    await supabase.from('clean_matches').delete().eq('id', matchId);
    await supabase.from('matches').delete().eq('id', matchId);
    return true;
  } catch (e) {
    console.warn('Error eliminant partida de Supabase:', e);
    return false;
  }
}

/**
 * I) RANKING:
 * Consultar tots els usuaris de la taula 'profiles' ordenats per total_points descendent
 * sense cap filtre per ID d'usuari individual per mostrar la llista completa global.
 */
export async function fetchSupabaseRanking(limitCount = 100) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(limitCount);

    if (error) {
      console.warn('Supabase ranking fetch error:', error.message, error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase ranking fetch exception:', err);
    return [];
  }
}

/**
 * Subscripció en temps real a la taula 'profiles' per actualitzar el Rànquing Global
 */
export function subscribeToRankingUpdates(onUpdate: () => void) {
  try {
    const channel = supabase
      .channel('ranking_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_progression' },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime ranking subscription error:', err);
    return () => {};
  }
}

/**
 * J) TEXTOS DE NAVEGACIÓ DINÀMICS DES DE LA TAULA 'navigation_texts':
 * Llegeix els textos de la barra superior (Oca 50, Duels 1v1, Tenda Mèrits, Repàs, Rànquing)
 */
export async function fetchNavigationTexts(): Promise<Record<string, string> | null> {
  try {
    const { data, error } = await supabase
      .from('navigation_texts')
      .select('*');

    if (error) {
      console.warn('Supabase fetch navigation_texts error:', error.message);
      return null;
    }

    if (!data || data.length === 0) return null;

    const result: Record<string, string> = {};

    data.forEach((row: any) => {
      const id = String(row.id || row.key || row.name || row.slug || row.tab || '').toLowerCase().trim();
      const val = row.label || row.text || row.title || row.value || row.nom;

      if (id && val) {
        if (id === 'oca' || id.includes('campanya') || id.includes('oca')) {
          result.campanya = String(val);
          result.oca = String(val);
        } else if (id === 'duels' || id.includes('duel')) {
          result.duels = String(val);
        } else if (id === 'tenda' || id === 'tienda' || id.includes('tenda') || id.includes('tienda') || id.includes('botiga') || id.includes('merit')) {
          result.tienda = String(val);
          result.tenda = String(val);
        } else if (id === 'repas' || id.includes('repas')) {
          result.repas = String(val);
        } else if (id === 'ranking' || id.includes('rank')) {
          result.ranking = String(val);
        } else {
          result[id] = String(val);
        }
      }
    });

    return Object.keys(result).length > 0 ? result : null;
  } catch (err) {
    console.warn('Supabase navigation_texts exception:', err);
    return null;
  }
}

/**
 * Guarda o actualitza els textos de navegació directament a la taula 'navigation_texts' de Supabase.
 * Executa UPDATE a les files segons el seu id ('oca', 'duels', 'tenda', 'repas', 'ranking').
 */
export async function updateNavigationTexts(texts: {
  campanya: string;
  duels: string;
  tienda: string;
  repas: string;
  ranking: string;
}): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    const updates = [
      supabase
        .from('navigation_texts')
        .update({ label: texts.campanya, updated_at: now })
        .eq('id', 'oca'),
      supabase
        .from('navigation_texts')
        .update({ label: texts.duels, updated_at: now })
        .eq('id', 'duels'),
      supabase
        .from('navigation_texts')
        .update({ label: texts.tienda, updated_at: now })
        .eq('id', 'tenda'),
      supabase
        .from('navigation_texts')
        .update({ label: texts.repas, updated_at: now })
        .eq('id', 'repas'),
      supabase
        .from('navigation_texts')
        .update({ label: texts.ranking, updated_at: now })
        .eq('id', 'ranking'),
    ];

    const results = await Promise.all(updates);
    const hasError = results.some(r => r.error);

    if (hasError) {
      const errorMsg = results.map(r => r.error?.message).filter(Boolean).join(', ');
      console.warn('Supabase UPDATE navigation_texts error:', errorMsg);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in updateNavigationTexts:', err);
    return false;
  }
}

/**
 * Subscripció Realtime a la taula 'navigation_texts' de Supabase
 * Permet que qualsevol usuari connectat rebi els nous noms en directe
 */
export function subscribeToNavigationTexts(onUpdate: (texts: Record<string, string>) => void) {
  try {
    const channel = supabase
      .channel('navigation_texts_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'navigation_texts' },
        async () => {
          const updated = await fetchNavigationTexts();
          if (updated) {
            onUpdate(updated);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription error:', err);
    return () => {};
  }
}

/**
 * K) ESCALES I RANGS POLICIALS A SUPABASE (taula 'official_ranks'):
 * Permet emmagatzemar, configurar i sincronitzar les escales (Bàsica, Intermèdia, Executiva, Superior)
 * i rangs policials oficials al núvol.
 */
export async function fetchSupabaseOfficialRanks(): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from('official_ranks')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data.map(r => ({
      id: r.id,
      scale: r.scale,
      category: r.category,
      categoryName: r.category_name || r.categoryName,
      title: r.title || r.name,
      minXp: typeof r.min_xp === 'number' ? r.min_xp : (r.minXp || 0),
      icon: r.icon || '👮‍♂️',
      color: r.color || '#3b82f6',
      desc: r.desc || r.description || '',
      sortOrder: r.sort_order || 0
    }));
  } catch (err) {
    console.warn('Supabase fetch official_ranks exception:', err);
    return null;
  }
}

export async function syncSupabaseOfficialRanks(ranks: any[]): Promise<boolean> {
  try {
    if (!Array.isArray(ranks) || ranks.length === 0) return false;

    const rows = ranks.map((r, index) => ({
      id: r.id,
      scale: r.scale || 'Escala bàsica',
      category: r.category || 'escala_basica',
      category_name: r.categoryName || r.category_name || 'Escala Bàsica',
      title: r.title || r.name,
      min_xp: typeof r.minXp === 'number' ? r.minXp : (r.min_xp || 0),
      icon: r.icon || '👮‍♂️',
      color: r.color || '#3b82f6',
      description: r.desc || r.description || '',
      sort_order: typeof r.sortOrder === 'number' ? r.sortOrder : index,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('official_ranks')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase sync official_ranks error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase sync official_ranks exception:', err);
    return false;
  }
}

export function subscribeToOfficialRanks(onUpdate: (ranks: any[]) => void) {
  try {
    const channel = supabase
      .channel('official_ranks_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'official_ranks' },
        async () => {
          const ranks = await fetchSupabaseOfficialRanks();
          if (ranks && ranks.length > 0) {
            onUpdate(ranks);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime official_ranks subscription error:', err);
    return () => {};
  }
}

/**
 * L) PROGRESIÓ DE JUGADOR CENTRALITZADA AL NÚVOL (taula 'user_progression'):
 * Desa l'estat complet del jugador (XP, mèrits, rang, comodins, escuts desbloquejats,
 * preguntes fallades, preguntes guardades i tauler de l'Oca).
 * MAI s'esborra sol i sobreviu al tancament de sessió o neteja de memòria cau local.
 */
export async function syncSupabaseUserProgression(userId: string, data: Record<string, any>) {
  try {
    if (!userId) return null;

    // 1. Guardar a la taula dedicada 'user_progression' (només actualitzar camps definits per no sobreescriure amb arrays buits)
    const progressionPayload: Record<string, any> = {
      user_id: userId,
      updated_at: new Date().toISOString()
    };

    if (data.username || data.displayName) progressionPayload.username = data.username || data.displayName;
    if (typeof data.xp === 'number') progressionPayload.xp = data.xp;
    if (typeof data.merits === 'number') progressionPayload.merits = data.merits;
    if (data.rank?.id || data.rankId) progressionPayload.rank_id = data.rank?.id || data.rankId;
    if (typeof data.wildcardsCount === 'number') progressionPayload.wildcards_count = data.wildcardsCount;
    if (Array.isArray(data.unlockedShieldIds)) progressionPayload.unlocked_shields = data.unlockedShieldIds;
    if (data.equippedShieldId) progressionPayload.equipped_shield_id = data.equippedShieldId;
    if (Array.isArray(data.failedQuestionIds)) progressionPayload.failed_questions = data.failedQuestionIds;
    if (Array.isArray(data.savedQuestionIds)) progressionPayload.saved_questions = data.savedQuestionIds;
    if (Array.isArray(data.answeredQuestionIds)) progressionPayload.answered_questions = data.answeredQuestionIds;
    if (Array.isArray(data.correctQuestionIds)) progressionPayload.correct_questions = data.correctQuestionIds;
    if (typeof data.canViewStudyReport === 'boolean') progressionPayload.can_view_study_report = data.canViewStudyReport;
    if (Array.isArray(data.savedMnemonicIds)) progressionPayload.saved_mnemonic_ids = data.savedMnemonicIds;
    if (Array.isArray(data.completedAmbits)) progressionPayload.completed_ambits = data.completedAmbits;
    if (data.boardProgress) progressionPayload.board_progress = data.boardProgress;

    const dedicatedPromise = supabase
      .from('user_progression')
      .upsert(progressionPayload, { onConflict: 'user_id' });

    // 2. Guardar també a 'matches' (id: `user_data_${userId}`) per redundància i compatibilitat total
    const matchesPromise = syncSupabaseUserGameData(userId, data);

    const [progResult] = await Promise.allSettled([dedicatedPromise, matchesPromise]);
    if (progResult.status === 'fulfilled' && progResult.value?.error) {
      console.info('Info taula user_progression (sincronitzat via matches):', progResult.value.error.message);
    }

    return progressionPayload;
  } catch (err) {
    console.warn('Supabase sync user_progression exception:', err);
    return null;
  }
}

export async function fetchSupabaseUserProgression(userId: string): Promise<any | null> {
  try {
    if (!userId) return null;

    // 1. Intentar consultar primer la taula 'user_progression'
    const { data: progRow, error: progErr } = await supabase
      .from('user_progression')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!progErr && progRow) {
      const matchGameData = await fetchSupabaseUserGameData(userId);
      return {
        xp: progRow.xp ?? matchGameData?.xp,
        merits: progRow.merits ?? matchGameData?.merits,
        rankId: progRow.rank_id ?? matchGameData?.rankId,
        wildcardsCount: progRow.wildcards_count ?? matchGameData?.wildcardsCount,
        unlockedShieldIds: (progRow.unlocked_shields && progRow.unlocked_shields.length > 0)
          ? progRow.unlocked_shields
          : (matchGameData?.unlockedShieldIds || []),
        equippedShieldId: progRow.equipped_shield_id || matchGameData?.equippedShieldId || 'generic_pvc',
        failedQuestionIds: (progRow.failed_questions && progRow.failed_questions.length > 0)
          ? progRow.failed_questions
          : (matchGameData?.failedQuestionIds || []),
        savedQuestionIds: (progRow.saved_questions && progRow.saved_questions.length > 0)
          ? progRow.saved_questions
          : (matchGameData?.savedQuestionIds || []),
        answeredQuestionIds: (progRow.answered_questions && progRow.answered_questions.length > 0)
          ? progRow.answered_questions
          : (matchGameData?.answeredQuestionIds || []),
        correctQuestionIds: (progRow.correct_questions && progRow.correct_questions.length > 0)
          ? progRow.correct_questions
          : (matchGameData?.correctQuestionIds || []),
        questionMistakesCount: matchGameData?.questionMistakesCount || {},
        canViewStudyReport: progRow.can_view_study_report ?? matchGameData?.canViewStudyReport ?? false,
        savedMnemonicIds: progRow.saved_mnemonic_ids || matchGameData?.savedMnemonicIds || [],
        completedAmbits: progRow.completed_ambits || matchGameData?.completedAmbits || [],
        boardProgress: progRow.board_progress || matchGameData?.boardProgress || {},
        updatedAt: progRow.updated_at || matchGameData?.updatedAt
      };
    }

    // 2. Fallback a la taula 'matches' (user_data_${userId})
    return await fetchSupabaseUserGameData(userId);
  } catch (err) {
    console.warn('Supabase fetch user_progression exception:', err);
    return null;
  }
}

/**
 * M) SALES DE DUELS DEDICADES (taula 'duels_rooms'):
 * Centralitza la creació, unió i actualització de duels 1v1 amb temps real actiu.
 */
export async function createDuelRoom(roomData: {
  id: string;
  code: string;
  player1_id: string;
  player1_name?: string;
  player1_avatar?: string;
  ambit?: string;
  questions?: any[];
}) {
  try {
    const payload = {
      id: roomData.id,
      code: roomData.code,
      status: 'waiting',
      player1_id: roomData.player1_id,
      player1_name: roomData.player1_name || 'Aspirant 1',
      player1_avatar: roomData.player1_avatar || 'generic_pvc',
      player1_score: 0,
      ambit: roomData.ambit || 'Tots',
      questions: roomData.questions || [],
      current_question_index: 0,
      round_data: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('duels_rooms')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      console.warn('Supabase createDuelRoom error:', error.message);
      return null;
    }
    return data?.[0] || data;
  } catch (err) {
    console.warn('Supabase createDuelRoom exception:', err);
    return null;
  }
}

export async function joinDuelRoom(code: string, player2: {
  id: string;
  name?: string;
  avatar?: string;
}) {
  try {
    const { data: room, error: findError } = await supabase
      .from('duels_rooms')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError || !room) {
      return { success: false, error: 'Sala no trobada o ja ocupada' };
    }

    const { data: updated, error: joinError } = await supabase
      .from('duels_rooms')
      .update({
        player2_id: player2.id,
        player2_name: player2.name || 'Aspirant 2',
        player2_avatar: player2.avatar || 'generic_pvc',
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', room.id)
      .select()
      .maybeSingle();

    if (joinError || !updated) {
      return { success: false, error: joinError?.message || 'Error en unir-se' };
    }

    return { success: true, room: updated };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function subscribeToDuelRoom(roomId: string, onUpdate: (room: any) => void) {
  try {
    const channel = supabase
      .channel(`duel_room_${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'duels_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          onUpdate(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('subscribeToDuelRoom error:', err);
    return () => {};
  }
}

/**
 * N) HISTORIAL DE RESULTATS DE DUELS EN DIRECTE (Supabase 'matches'):
 * Consulta i formata els últims duels finalitzats amb noms, escuts i marcadors.
 */
function formatTimeAgoCatalan(dateInput: string | number): string {
  try {
    const timestamp = typeof dateInput === 'number' ? dateInput : new Date(dateInput).getTime();
    if (!timestamp || isNaN(timestamp)) return 'Finalitzat fa poc';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Finalitzat fa pocs segons';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Finalitzat fa ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Finalitzat fa ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Finalitzat ahir';
    return `Finalitzat fa ${diffDays} dies`;
  } catch {
    return 'Finalitzat fa poc';
  }
}

export async function fetchFinishedMatchesHistory(limit = 40): Promise<any[]> {
  try {
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'finished')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Error al consultar l\'historial de duels a Supabase:', error.message);
      return [];
    }

    if (!Array.isArray(matches) || matches.length === 0) {
      return [];
    }

    // Filtrar partides no vàlides o d'ús intern (oca, user data, system)
    const validMatches = matches.filter(m => {
      if (!m || !m.id) return false;
      const idStr = String(m.id);
      if (idStr.startsWith('oca_') || idStr.startsWith('user_') || idStr.startsWith('system_')) return false;
      if (m.player2_id && String(m.player2_id).startsWith('oca_')) return false;
      return true;
    });

    // Recollir IDs d'usuaris per resoldre noms i avatars des de la taula profiles
    const userIds = new Set<string>();
    validMatches.forEach(m => {
      if (m.player1_id && !m.player1_id.startsWith('bot_')) userIds.add(m.player1_id);
      if (m.player2_id && !m.player2_id.startsWith('bot_')) userIds.add(m.player2_id);
    });

    const profileMap = new Map<string, { username?: string; avatar_url?: string }>();
    if (userIds.size > 0) {
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', Array.from(userIds));

        if (Array.isArray(profiles)) {
          profiles.forEach(p => {
            if (p && p.id) profileMap.set(p.id, p);
          });
        }
      } catch (err) {
        console.warn('Error resolent perfils per a historial de duels:', err);
      }
    }

    return validMatches.map(m => {
      const p1Profile = profileMap.get(m.player1_id);
      const p2Profile = profileMap.get(m.player2_id);

      const player1Name = m.state?.hostPlayerName || p1Profile?.username || (m.player1_id?.startsWith('bot_') ? 'Bot Instructor IA' : 'Aspirant 1');
      const player2Name = m.state?.guestPlayerName || p2Profile?.username || (m.player2_id?.startsWith('bot_') ? 'Bot Instructor IA' : 'Aspirant 2');

      const scoreP1 = typeof m.score_p1 === 'number' ? m.score_p1 : (m.state?.hostRedStripes ?? 0);
      const scoreP2 = typeof m.state?.score_p2 === 'number'
        ? m.state.score_p2
        : (typeof m.score_p2 === 'number' ? m.score_p2 : (m.state?.guestRedStripes ?? 0));

      let winnerUid = m.state?.winnerUid;
      if (!winnerUid) {
        if (scoreP1 > scoreP2) winnerUid = m.player1_id;
        else if (scoreP2 > scoreP1) winnerUid = m.player2_id;
      }

      const winnerName = winnerUid === m.player1_id ? player1Name : winnerUid === m.player2_id ? player2Name : undefined;
      const isDraw = scoreP1 === scoreP2 && !m.state?.winnerUid;

      return {
        id: String(m.id),
        player1Id: m.player1_id,
        player1Name,
        player1Avatar: m.state?.hostPlayerAvatar || p1Profile?.avatar_url,
        player1ShieldId: m.state?.hostPlayerShieldId || (p1Profile?.avatar_url && !p1Profile.avatar_url.startsWith('http') ? p1Profile.avatar_url : undefined) || 'generic_pvc',
        scoreP1,
        player2Id: m.player2_id,
        player2Name,
        player2Avatar: m.state?.guestPlayerAvatar || p2Profile?.avatar_url,
        player2ShieldId: m.state?.guestPlayerShieldId || (p2Profile?.avatar_url && !p2Profile.avatar_url.startsWith('http') ? p2Profile.avatar_url : undefined) || 'generic_pvc',
        scoreP2,
        winnerUid,
        winnerName,
        isDraw,
        endedAt: m.updated_at || m.created_at || Date.now(),
        timeAgoText: formatTimeAgoCatalan(m.updated_at || m.created_at)
      };
    });
  } catch (err) {
    console.warn('fetchFinishedMatchesHistory exception:', err);
    return [];
  }
}

/**
 * =========================================================================
 * O) GESTIÓ D'USUARIS I SUBSCRIPCIONS (Admin & Client)
 * =========================================================================
 */

export async function fetchAllProfiles(): Promise<any[]> {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching all profiles:', error.message);
    }

    const profilesList = Array.isArray(profiles) ? profiles : [];

    // Carregar progressions en paral·lel per tenir el detall complet d'estudi i recuperar username si falta
    const progMap = new Map<string, any>();
    try {
      const { data: progressions } = await supabase
        .from('user_progression')
        .select('*');

      if (Array.isArray(progressions)) {
        progressions.forEach(p => {
          if (p && p.user_id) {
            progMap.set(p.user_id, p);
          }
        });
      }
    } catch (e) {
      console.warn('Error loading user_progression in fetchAllProfiles:', e);
    }

    // Carregar també de matches 'user_data_%' per redundància absoluta de respostes i encerts
    try {
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .like('id', 'user_data_%');

      if (Array.isArray(matchData)) {
        matchData.forEach(m => {
          const uid = m.player1_id || (m.id ? m.id.replace('user_data_', '') : null);
          if (uid && m.state) {
            const existing = progMap.get(uid) || {};
            progMap.set(uid, {
              ...m.state,
              ...existing,
              answered_questions: (existing.answered_questions && existing.answered_questions.length > 0)
                ? existing.answered_questions
                : (m.state.answeredQuestionIds || m.state.answered_questions || []),
              correct_questions: (existing.correct_questions && existing.correct_questions.length > 0)
                ? existing.correct_questions
                : (m.state.correctQuestionIds || m.state.correct_questions || []),
              failed_questions: (existing.failed_questions && existing.failed_questions.length > 0)
                ? existing.failed_questions
                : (m.state.failedQuestionIds || m.state.failed_questions || []),
              saved_questions: (existing.saved_questions && existing.saved_questions.length > 0)
                ? existing.saved_questions
                : (m.state.savedQuestionIds || m.state.saved_questions || []),
              questionMistakesCount: existing.questionMistakesCount || m.state.questionMistakesCount || {}
            });
          }
        });
      }
    } catch (e) {
      console.warn('Error loading matches user_data in fetchAllProfiles:', e);
    }

    // Carregar també usuaris de Firebase / Firestore per si el correu o el nom només estan allà
    const fbMap = new Map<string, any>();
    try {
      const { getAllRegisteredUsers } = await import('./src/firebase');
      const fbUsers = await getAllRegisteredUsers();
      if (Array.isArray(fbUsers)) {
        fbUsers.forEach(f => {
          if (f && f.uid) {
            fbMap.set(f.uid, f);
          }
        });
      }
    } catch (e) {
      // Ignorar si falla la importació dinàmica
    }

    // Combinar tots els IDs d'usuaris coneguts (de profiles, progressions i firebase)
    const allUserIds = new Set<string>();
    profilesList.forEach(p => { if (p?.id) allUserIds.add(p.id); });
    progMap.forEach((_, uid) => allUserIds.add(uid));
    fbMap.forEach((_, uid) => allUserIds.add(uid));

    const result = Array.from(allUserIds).map(uid => {
      const p = profilesList.find(x => x.id === uid) || {};
      const prog = progMap.get(uid) || {};
      const fb = fbMap.get(uid) || {};

      const resolvedUsername = 
        (p.username && p.username !== 'Aspirant' && p.username !== 'Aspirant Medina' ? p.username : null) ||
        (prog.username && prog.username !== 'Aspirant' && prog.username !== 'Aspirant Medina' ? prog.username : null) ||
        (fb.displayName && fb.displayName !== 'Aspirant' && fb.displayName !== 'Aspirant Medina' ? fb.displayName : null) ||
        p.username || prog.username || fb.displayName || (p.email ? p.email.split('@')[0] : (fb.email ? fb.email.split('@')[0] : 'Aspirant'));

      const resolvedEmail = p.email || fb.email || (uid.includes('@') ? uid : '') || '';

        const hasStudyAccess = Boolean(
          p.can_view_study_report === true ||
          prog.can_view_study_report === true ||
          prog.canViewStudyReport === true ||
          fb.canViewStudyReport === true
        );

        return {
          id: uid,
          username: resolvedUsername,
          email: resolvedEmail,
          total_points: typeof p.total_points === 'number' ? p.total_points : (prog.xp ?? fb.xp ?? 0),
          xp: typeof p.xp === 'number' ? p.xp : (prog.xp ?? fb.xp ?? 0),
          merits: typeof p.merits === 'number' ? p.merits : (prog.merits ?? fb.merits ?? 0),
          role: p.role || fb.role || (resolvedEmail === 'opossscar@gmail.com' ? 'admin' : 'aspirant'),
          subscription_status: p.subscription_status || fb.subscriptionStatus || (resolvedEmail === 'opossscar@gmail.com' ? 'unlimited' : 'trial'),
          subscription_expires_at: p.subscription_expires_at || fb.subscriptionExpiresAt || null,
          is_unlimited: Boolean(p.is_unlimited || fb.isUnlimited || resolvedEmail === 'opossscar@gmail.com'),
          created_at: p.created_at || prog.created_at || (fb.createdAt ? new Date(fb.createdAt).toISOString() : new Date().toISOString()),
          failed_questions: prog.failed_questions || fb.failedQuestionIds || [],
          saved_questions: prog.saved_questions || fb.savedQuestionIds || [],
          answered_questions: prog.answered_questions || fb.answeredQuestionIds || [],
          correct_questions: prog.correct_questions || fb.correctQuestionIds || [],
          can_view_study_report: hasStudyAccess,
          board_progress: prog.board_progress || fb.boardProgress || {},
          wildcards_count: prog.wildcards_count ?? p.wildcards_count ?? fb.wildcardsCount ?? 0,
          streakCount: prog.streakCount ?? prog.streak_count ?? fb.streakCount ?? 0,
          streakShieldsCount: prog.streakShieldsCount ?? prog.streak_shields_count ?? fb.streakShieldsCount ?? 0,
          activeTimeSeconds: prog.activeTimeSeconds ?? prog.active_time_seconds ?? fb.activeTimeSeconds ?? 0,
          topicMastery: prog.topicMastery || prog.topic_mastery || fb.topicMastery || {}
        };
    });

    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    console.warn('fetchAllProfiles exception:', err);
    return [];
  }
}

export async function updateUserRole(userId: string, role: 'admin' | 'question_editor' | 'aspirant'): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.warn('Error updating user role:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('updateUserRole exception:', err);
    return false;
  }
}

export async function updateUserStudyReportAccess(userId: string, allowed: boolean): Promise<boolean> {
  try {
    // 1. Guardar a profiles
    const p1 = supabase
      .from('profiles')
      .update({ can_view_study_report: allowed, updated_at: new Date().toISOString() })
      .eq('id', userId);

    // 2. Guardar a user_progression
    const p2 = supabase
      .from('user_progression')
      .upsert({ user_id: userId, can_view_study_report: allowed, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

    // 3. Guardar a matches user_data_${userId}
    const currentData = (await fetchSupabaseUserGameData(userId)) || {};
    const p3 = syncSupabaseUserGameData(userId, {
      ...currentData,
      canViewStudyReport: allowed
    });

    // 4. Guardar a Firestore si està configurat
    try {
      const { syncUserProfileUpdate } = await import('./src/firebase');
      await syncUserProfileUpdate({ uid: userId, canViewStudyReport: allowed });
    } catch {}

    await Promise.allSettled([p1, p2, p3]);

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('study_report_access_updated', {
          detail: { userId, allowed }
        }));
      } catch {}
    }

    return true;
  } catch (err) {
    console.warn('updateUserStudyReportAccess exception:', err);
    return false;
  }
}

export async function updateUserSubscription(params: {
  userId: string;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'unlimited';
  durationDays?: number;
  isUnlimited?: boolean;
  exactExpiryDate?: string;
}): Promise<boolean> {
  try {
    let expiresAt: string | null = null;

    if (params.isUnlimited || params.subscriptionStatus === 'unlimited') {
      expiresAt = null;
    } else if (params.exactExpiryDate) {
      expiresAt = params.exactExpiryDate;
    } else if (params.durationDays && params.durationDays > 0) {
      // Si té una subscripció activa vigent, sumar els dies a la data actual d'expiració
      const current = await fetchSupabaseProfile(params.userId);
      let baseTime = Date.now();
      if (current?.subscription_expires_at) {
        const curExp = new Date(current.subscription_expires_at).getTime();
        if (curExp > baseTime) {
          baseTime = curExp;
        }
      }
      const newExpiry = new Date(baseTime + params.durationDays * 24 * 60 * 60 * 1000);
      expiresAt = newExpiry.toISOString();
    } else if (params.subscriptionStatus === 'expired') {
      expiresAt = new Date(Date.now() - 1000).toISOString();
    }

    const payload: Record<string, any> = {
      subscription_status: params.subscriptionStatus,
      is_unlimited: Boolean(params.isUnlimited || params.subscriptionStatus === 'unlimited'),
      subscription_expires_at: expiresAt,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', params.userId);

    if (error) {
      console.warn('Error updating user subscription:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('updateUserSubscription exception:', err);
    return false;
  }
}

/**
 * =========================================================================
 * P) CODIS D'INVITACIÓ / ACCÉS (Supabase table 'invitation_codes')
 * =========================================================================
 */

export async function fetchInvitationCodes(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('invitation_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching invitation codes:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('fetchInvitationCodes exception:', err);
    return [];
  }
}

export function generateRandomCode(prefix = 'MEDINA'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${rand}`;
}

export async function generateInvitationCodes(params: {
  durationDays: number;
  isUnlimited: boolean;
  count: number;
  batchName?: string;
}): Promise<{ success: boolean; codes: string[]; error?: string }> {
  try {
    const codesToInsert = [];
    const generatedStrings: string[] = [];

    const prefix = params.isUnlimited 
      ? 'MEDINA-VIP' 
      : `MEDINA-${params.durationDays}D`;

    for (let i = 0; i < params.count; i++) {
      const code = generateRandomCode(prefix);
      generatedStrings.push(code);
      codesToInsert.push({
        code,
        duration_days: params.isUnlimited ? 0 : params.durationDays,
        is_unlimited: params.isUnlimited,
        is_used: false,
        batch_name: params.batchName || 'Generació Admin',
        created_at: new Date().toISOString()
      });
    }

    const { error } = await supabase
      .from('invitation_codes')
      .insert(codesToInsert);

    if (error) {
      console.warn('Error inserting invitation codes:', error.message);
      return { success: false, codes: [], error: error.message };
    }

    return { success: true, codes: generatedStrings };
  } catch (err: any) {
    console.warn('generateInvitationCodes exception:', err);
    return { success: false, codes: [], error: err?.message || 'Error desconegut' };
  }
}

export async function redeemInvitationCode(code: string, user: {
  uid: string;
  email: string;
  username: string;
}): Promise<{ success: boolean; message: string; newExpiresAt?: string; isUnlimited?: boolean }> {
  try {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Introdueix un codi d\'invitació.' };
    }

    // 1. Cercar el codi a Supabase
    const { data: codeData, error: codeErr } = await supabase
      .from('invitation_codes')
      .select('*')
      .eq('code', cleanCode)
      .maybeSingle();

    if (codeErr || !codeData) {
      return { success: false, message: 'El codi introduït no existeix o és incorrecte.' };
    }

    if (codeData.is_used) {
      return { success: false, message: 'Aquest codi ja ha estat utilitzat anteriorment.' };
    }

    // 2. Marcar com a usat
    const nowIso = new Date().toISOString();
    const { error: markErr } = await supabase
      .from('invitation_codes')
      .update({
        is_used: true,
        used_by_user_id: user.uid,
        used_by_email: user.email,
        used_by_username: user.username,
        used_at: nowIso
      })
      .eq('id', codeData.id)
      .eq('is_used', false); // Protecció contra concurrència

    if (markErr) {
      return { success: false, message: 'No s\'ha pogut validar el codi. Torna-ho a provar.' };
    }

    // 3. Actualitzar la subscripció de l'usuari a 'profiles'
    let newExpiresAt: string | null = null;
    const isUnlimited = Boolean(codeData.is_unlimited);

    if (isUnlimited) {
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'unlimited',
          is_unlimited: true,
          subscription_expires_at: null,
          updated_at: nowIso
        })
        .eq('id', user.uid);

      return {
        success: true,
        message: '🎉 Codi activat amb èxit! Gaudeixes d\'accés IL·LIMITAT.',
        isUnlimited: true
      };
    } else {
      const days = Number(codeData.duration_days) || 7;
      // Obtenir la subscripció actual
      const currentProfile = await fetchSupabaseProfile(user.uid);
      let baseTime = Date.now();
      if (currentProfile?.subscription_expires_at) {
        const curExp = new Date(currentProfile.subscription_expires_at).getTime();
        if (curExp > baseTime) {
          baseTime = curExp;
        }
      }

      const expiryDate = new Date(baseTime + days * 24 * 60 * 60 * 1000);
      newExpiresAt = expiryDate.toISOString();

      await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          is_unlimited: false,
          subscription_expires_at: newExpiresAt,
          updated_at: nowIso
        })
        .eq('id', user.uid);

      return {
        success: true,
        message: `🎉 Codi activat amb èxit! S'han afegit ${days} dies d'accés a la teva subscripció.`,
        newExpiresAt,
        isUnlimited: false
      };
    }
  } catch (err: any) {
    console.warn('redeemInvitationCode exception:', err);
    return { success: false, message: err?.message || 'Error en activar el codi.' };
  }
}

/**
 * =========================================================================
 * Q) IMPUGNACIONS DE PREGUNTES (Supabase table 'question_reports')
 * =========================================================================
 */

export async function submitQuestionReport(report: {
  questionId: string;
  questionText?: string;
  ambit?: string;
  reportedByUid: string;
  reportedByName: string;
  reportedByEmail?: string;
  reason: string;
  details?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const payload = {
      question_id: report.questionId,
      question_text: report.questionText || '',
      ambit: report.ambit || 'Àmbit A',
      reported_by_uid: report.reportedByUid,
      reported_by_name: report.reportedByName,
      reported_by_email: report.reportedByEmail || '',
      reason: report.reason,
      details: report.details || '',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('question_reports')
      .insert([payload]);

    if (error) {
      console.warn('Error submitting question report:', error.message);
      return { success: false, message: 'No s\'ha pogut registrar la impugnació: ' + error.message };
    }

    return { success: true, message: '✅ Impugnació enviada amb èxit a l\'equip docent de l\'acadèmia.' };
  } catch (err: any) {
    console.warn('submitQuestionReport exception:', err);
    return { success: false, message: 'Error inesperat en enviar la impugnació.' };
  }
}

export async function fetchQuestionReports(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('question_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching question reports:', error.message);
      return [];
    }
    // Filter out subscription renewal requests so they only appear in the renewals tab
    return (data || []).filter((r: any) => r.question_id !== 'SOL_RENOVACIO');
  } catch (err) {
    console.warn('fetchQuestionReports exception:', err);
    return [];
  }
}

export async function updateQuestionReportStatus(
  reportId: string,
  status: 'pending' | 'resolved' | 'dismissed',
  adminNotes?: string
): Promise<boolean> {
  try {
    const payload: Record<string, any> = { status };
    if (adminNotes !== undefined) payload.admin_notes = adminNotes;

    const { error } = await supabase
      .from('question_reports')
      .update(payload)
      .eq('id', reportId);

    if (error) {
      console.warn('Error updating question report status:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('updateQuestionReportStatus exception:', err);
    return false;
  }
}

/**
 * =========================================================================
 * Q2) SOL·LICITUDS DE RENOVACIÓ I ACCÉS (Supabase table 'subscription_requests' o 'question_reports')
 * =========================================================================
 */
export async function submitRenewalRequest(req: {
  userId: string;
  userName: string;
  userEmail: string;
  requestType: string;
  phone?: string;
  message?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    let inserted = false;

    // 1. Intenta inserir a la taula dedicada subscription_requests
    try {
      const { error: subErr } = await supabase
        .from('subscription_requests')
        .insert([{
          user_id: req.userId,
          user_name: req.userName,
          user_email: req.userEmail,
          request_type: req.requestType,
          phone: req.phone || '',
          message: req.message || '',
          status: 'pending',
          created_at: new Date().toISOString()
        }]);

      if (!subErr) {
        inserted = true;
      }
    } catch {
      // Taula no creada encara a Supabase
    }

    // 2. Si no s'ha inserit (la taula no existeix a Supabase), utilitza question_reports com a fallback directe garantit
    if (!inserted) {
      const detailsObj = {
        phone: req.phone || '',
        requestType: req.requestType,
        message: req.message || ''
      };

      const fallbackPayload = {
        question_id: 'SOL_RENOVACIO',
        question_text: `Sol·licitud: ${req.requestType} - Tel: ${req.phone || 'Sense telèfon'}`,
        ambit: 'Sol·licitud Renovació',
        reported_by_uid: req.userId,
        reported_by_name: req.userName,
        reported_by_email: req.userEmail,
        reason: req.requestType,
        details: JSON.stringify(detailsObj),
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('question_reports')
        .insert([fallbackPayload]);

      if (error) {
        console.warn('Error fallback renewal insert:', error.message);
        return { success: false, message: 'No s\'ha pogut enviar la sol·licitud: ' + error.message };
      }
    }

    return { 
      success: true, 
      message: '✅ Sol·licitud enviada amb èxit! L\'Administrador la revisarà al seu panell de control.' 
    };
  } catch (err: any) {
    console.warn('submitRenewalRequest exception:', err);
    return { success: false, message: 'Error inesperat en enviar la sol·licitud.' };
  }
}

export async function fetchRenewalRequests(): Promise<any[]> {
  const list: any[] = [];
  const seenIds = new Set<string>();

  // 1. Cercar a la taula subscription_requests si existeix
  try {
    const { data, error } = await supabase
      .from('subscription_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      for (const item of data) {
        seenIds.add(item.id);
        list.push({
          id: item.id,
          user_id: item.user_id,
          user_name: item.user_name || 'Aspirant',
          user_email: item.user_email || '',
          request_type: item.request_type || 'Renovació',
          phone: item.phone || '',
          message: item.message || '',
          status: item.status || 'pending',
          admin_notes: item.admin_notes || '',
          created_at: item.created_at || new Date().toISOString(),
          source_table: 'subscription_requests'
        });
      }
    }
  } catch (e) {
    // Si no existeix la taula, continua
  }

  // 2. Cercar a la taula question_reports els registres marcats com a SOL_RENOVACIO
  try {
    const { data, error } = await supabase
      .from('question_reports')
      .select('*')
      .eq('question_id', 'SOL_RENOVACIO')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      for (const item of data) {
        if (!seenIds.has(item.id)) {
          let phone = '';
          let reqType = item.reason || 'Renovació';
          let message = item.details || '';

          if (item.details && item.details.startsWith('{')) {
            try {
              const parsed = JSON.parse(item.details);
              phone = parsed.phone || '';
              reqType = parsed.requestType || reqType;
              message = parsed.message || '';
            } catch {}
          }

          list.push({
            id: item.id,
            user_id: item.reported_by_uid,
            user_name: item.reported_by_name || 'Aspirant',
            user_email: item.reported_by_email || '',
            request_type: reqType,
            phone,
            message,
            status: item.status || 'pending',
            admin_notes: item.admin_notes || '',
            created_at: item.created_at || new Date().toISOString(),
            source_table: 'question_reports'
          });
        }
      }
    }
  } catch (e) {
    console.warn('fetchRenewalRequests fallback error:', e);
  }

  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function updateRenewalRequestStatus(
  requestId: string,
  status: 'pending' | 'resolved' | 'dismissed',
  adminNotes?: string,
  sourceTable?: 'subscription_requests' | 'question_reports'
): Promise<boolean> {
  let ok = false;

  // Actualitzar a la taula indicada o a totes dues si cal
  if (!sourceTable || sourceTable === 'subscription_requests') {
    try {
      const payload: any = { status };
      if (adminNotes !== undefined) payload.admin_notes = adminNotes;
      const { error } = await supabase
        .from('subscription_requests')
        .update(payload)
        .eq('id', requestId);
      if (!error) ok = true;
    } catch {}
  }

  if (!ok || sourceTable === 'question_reports') {
    try {
      const payload: any = { status };
      if (adminNotes !== undefined) payload.admin_notes = adminNotes;
      const { error } = await supabase
        .from('question_reports')
        .update(payload)
        .eq('id', requestId);
      if (!error) ok = true;
    } catch {}
  }

  return ok;
}

/**
 * =========================================================================
 * R) INFORMACIÓ I CONTACTE DE L'ACADÈMIA (Supabase table 'academy_contact_info')
 * =========================================================================
 */

export const DEFAULT_ACADEMY_CONTACT = {
  id: 'main_contact',
  whatsapp_number: '',
  telegram_handle: '',
  support_email: 'opossscar@gmail.com',
  payment_instructions: 'Pots contactar per WhatsApp o correu per obtenir o renovar el teu codi d\'accés.'
};

export async function fetchAcademyContactInfo(): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('academy_contact_info')
      .select('*')
      .eq('id', 'main_contact')
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_ACADEMY_CONTACT;
    }
    return { ...DEFAULT_ACADEMY_CONTACT, ...data };
  } catch (err) {
    console.warn('fetchAcademyContactInfo exception:', err);
    return DEFAULT_ACADEMY_CONTACT;
  }
}

export async function updateAcademyContactInfo(info: Partial<typeof DEFAULT_ACADEMY_CONTACT>): Promise<boolean> {
  try {
    const payload = {
      id: 'main_contact',
      whatsapp_number: info.whatsapp_number || '',
      telegram_handle: info.telegram_handle || '',
      support_email: info.support_email || 'opossscar@gmail.com',
      payment_instructions: info.payment_instructions || '',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('academy_contact_info')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Error updating academy contact info:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('updateAcademyContactInfo exception:', err);
    return false;
  }
}

/**
 * =========================================================================
 * R.2) COMUNICATS I MISSATGES GLOBALS DE L'ADMINISTRADOR A TOTS ELS USUARIS
 * =========================================================================
 */
export interface AdminBroadcastMessage {
  id: string;
  title: string;
  message: string;
  createdAt: number;
  priority?: 'normal' | 'urgent' | 'important';
  active: boolean;
  authorName?: string;
  scheduledStart?: string | number | null; // Data i hora d'inici programada (ISO o timestamp)
  expiresAt?: string | number | null;       // Data i hora de fi / caducitat automàtica
}

export async function fetchActiveBroadcastMessage(): Promise<AdminBroadcastMessage | null> {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', 'system_admin_broadcast')
      .maybeSingle();

    if (error || !data || !data.state) {
      return null;
    }
    const b = data.state as AdminBroadcastMessage;
    if (b && b.active && b.message && b.message.trim().length > 0) {
      const now = Date.now();

      // Comprovar si està programat per a una data/hora futura
      if (b.scheduledStart) {
        const startTime = typeof b.scheduledStart === 'number' ? b.scheduledStart : new Date(b.scheduledStart).getTime();
        if (startTime > now) {
          // Encara no ha arribat l'hora programada
          return null;
        }
      }

      // Comprovar si ja ha expirat automàticament
      if (b.expiresAt) {
        const expTime = typeof b.expiresAt === 'number' ? b.expiresAt : new Date(b.expiresAt).getTime();
        if (expTime <= now) {
          // Ja ha caducat, netegem en segon pla per no deixar-lo penjat
          clearAdminBroadcastMessage().catch(() => {});
          return null;
        }
      }

      return b;
    }
    return null;
  } catch (err) {
    console.warn('fetchActiveBroadcastMessage exception:', err);
    return null;
  }
}

export async function sendAdminBroadcastMessage(broadcast: {
  title: string;
  message: string;
  priority?: 'normal' | 'urgent' | 'important';
  authorName?: string;
  scheduledStart?: string | number | null;
  expiresAt?: string | number | null;
}): Promise<boolean> {
  try {
    const broadcastData: AdminBroadcastMessage = {
      id: 'broadcast_' + Date.now(),
      title: broadcast.title.trim() || '📢 Comunicat Oficial de l\'Acadèmia',
      message: broadcast.message.trim(),
      priority: broadcast.priority || 'important',
      active: true,
      createdAt: Date.now(),
      authorName: broadcast.authorName || 'Direcció Pedagògica',
      scheduledStart: broadcast.scheduledStart || null,
      expiresAt: broadcast.expiresAt || null
    };

    const payload = {
      id: 'system_admin_broadcast',
      player1_id: 'admin',
      player2_id: 'all_users',
      current_turn: 'all_users',
      status: 'active',
      score_p1: 1,
      score_p2: 0,
      state: broadcastData
    };

    const { error } = await supabase
      .from('matches')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('sendAdminBroadcastMessage error:', error.message);
      return false;
    }

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('new_admin_broadcast', { detail: broadcastData }));
      } catch {}
    }

    return true;
  } catch (err) {
    console.warn('sendAdminBroadcastMessage exception:', err);
    return false;
  }
}

export async function clearAdminBroadcastMessage(): Promise<boolean> {
  try {
    // 1. Primer intentem esborrar directament la fila per no deixar residus
    const { error: deleteError } = await supabase
      .from('matches')
      .delete()
      .eq('id', 'system_admin_broadcast');

    // 2. Si falla per polítiques RLS de DELETE, fem un update/upsert desactiu
    if (deleteError) {
      const payload = {
        id: 'system_admin_broadcast',
        player1_id: 'admin',
        player2_id: 'all_users',
        current_turn: 'system',
        status: 'finished',
        score_p1: 0,
        score_p2: 0,
        state: { active: false, clearedAt: Date.now(), message: '' }
      };

      const { error: upsertError } = await supabase
        .from('matches')
        .upsert(payload, { onConflict: 'id' });

      if (upsertError) {
        console.warn('clearAdminBroadcastMessage error:', upsertError.message);
        return false;
      }
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('medina_admin_broadcast_cache');
        window.dispatchEvent(new CustomEvent('new_admin_broadcast', { detail: null }));
      } catch {}
    }

    return true;
  } catch (err) {
    console.warn('clearAdminBroadcastMessage exception:', err);
    return false;
  }
}

/**
 * =========================================================================
 * S) GESTIÓ I SINCRONITZACIÓ MASSIVA DE PREGUNTES (Supabase table 'questions')
 * =========================================================================
 */

export async function uploadAllQuestionsToSupabase(
  questions: any[],
  onProgress?: (uploadedCount: number, totalCount: number) => void
): Promise<{ success: boolean; uploadedCount: number; error?: string }> {
  try {
    if (!Array.isArray(questions) || questions.length === 0) {
      return { success: false, uploadedCount: 0, error: 'No hi ha preguntes per pujar.' };
    }

    const total = questions.length;
    let uploadedCount = 0;
    const batchSize = 50;

    for (let i = 0; i < total; i += batchSize) {
      const chunk = questions.slice(i, i + batchSize);
      const rows = chunk.map(q => {
        let opcionsArr: string[] = [];
        if (Array.isArray(q.opcions)) {
          opcionsArr = q.opcions;
        } else if (typeof q.opcions === 'string') {
          try { opcionsArr = JSON.parse(q.opcions); } catch { opcionsArr = []; }
        }

        return {
          id: String(q.id).trim(),
          ambit: q.ambit || 'Àmbit A',
          seccio: q.seccio || '',
          pregunta: q.pregunta || '',
          opcions: opcionsArr,
          resposta: typeof q.resposta === 'number' ? q.resposta : (Number(q.resposta) || 0),
          explicacio: q.explicacio || q.explanation || '',
          guia_pagina: q.guiaPagina || q.guia_pagina || null,
          guia_tema: q.guiaTema || q.guia_tema || null,
          clau_tribunal: q.clauTribunal || q.clau_tribunal || null,
          updated_at: new Date().toISOString()
        };
      });

      const { error } = await supabase
        .from('questions')
        .upsert(rows, { onConflict: 'id' });

      if (error) {
        console.error(`Error uploading batch ${i}-${i + batchSize}:`, error);
        return { success: false, uploadedCount, error: error.message || 'Error a Supabase' };
      }

      uploadedCount += chunk.length;
      if (onProgress) {
        onProgress(uploadedCount, total);
      }
    }

    return { success: true, uploadedCount };
  } catch (err: any) {
    console.error('uploadAllQuestionsToSupabase exception:', err);
    return { success: false, uploadedCount: 0, error: err?.message || 'Error desconegut' };
  }
}

export async function fetchSupabaseQuestionIds(): Promise<string[]> {
  try {
    const allIds: string[] = [];
    let from = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from('questions')
        .select('id')
        .range(from, from + pageSize - 1);

      if (error) {
        console.warn('Error fetching question IDs from Supabase:', error.message);
        break;
      }
      if (!data || data.length === 0) break;

      allIds.push(...data.map((r: any) => r.id));
      if (data.length < pageSize) break;
      from += pageSize;
    }

    return allIds;
  } catch (err) {
    console.warn('fetchSupabaseQuestionIds exception:', err);
    return [];
  }
}

export async function fetchQuestionsFromSupabaseTable(): Promise<any[]> {
  try {
    const allRows: any[] = [];
    let from = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('id', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        console.warn('Error fetching from questions table:', error.message);
        break;
      }
      if (!data || data.length === 0) break;

      allRows.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    if (allRows.length === 0) return [];

    return allRows.map((q: any) => ({
      id: q.id,
      ambit: q.ambit,
      seccio: q.seccio || '',
      pregunta: q.pregunta,
      opcions: Array.isArray(q.opcions) ? q.opcions : (typeof q.opcions === 'string' ? JSON.parse(q.opcions) : []),
      resposta: typeof q.resposta === 'number' ? q.resposta : (Number(q.resposta) || 0),
      explicacio: q.explicacio || '',
      guiaPagina: q.guia_pagina || undefined,
      guiaTema: q.guia_tema || undefined,
      clauTribunal: q.clau_tribunal || undefined
    }));
  } catch (err) {
    console.warn('fetchQuestionsFromSupabaseTable exception:', err);
    return [];
  }
}

export async function saveSingleQuestionToSupabase(q: any): Promise<boolean> {
  try {
    const row = {
      id: q.id,
      ambit: q.ambit || 'Àmbit A',
      seccio: q.seccio || '',
      pregunta: q.pregunta,
      opcions: Array.isArray(q.opcions) ? q.opcions : [],
      resposta: typeof q.resposta === 'number' ? q.resposta : (Number(q.resposta) || 0),
      explicacio: q.explicacio || '',
      guia_pagina: q.guiaPagina || null,
      guia_tema: q.guiaTema || null,
      clau_tribunal: q.clauTribunal || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('questions')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.warn('Error saving single question to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('saveSingleQuestionToSupabase exception:', err);
    return false;
  }
}

export async function deleteQuestionsBulkFromSupabase(ids: string[]): Promise<boolean> {
  try {
    if (!Array.isArray(ids) || ids.length === 0) return true;

    const { error } = await supabase
      .from('questions')
      .delete()
      .in('id', ids);

    if (error) {
      console.warn('Error deleting questions bulk from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('deleteQuestionsBulkFromSupabase exception:', err);
    return false;
  }
}

export async function updateQuestionsAmbitBulkFromSupabase(ids: string[], newAmbit: string, newSeccio?: string): Promise<boolean> {
  try {
    if (!Array.isArray(ids) || ids.length === 0) return true;

    const payload: Record<string, any> = { ambit: newAmbit, updated_at: new Date().toISOString() };
    if (newSeccio) payload.seccio = newSeccio;

    const { error } = await supabase
      .from('questions')
      .update(payload)
      .in('id', ids);

    if (error) {
      console.warn('Error updating questions ambit bulk in Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('updateQuestionsAmbitBulkFromSupabase exception:', err);
    return false;
  }
}



