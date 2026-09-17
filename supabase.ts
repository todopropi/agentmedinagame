// Cliente Supabase conectado a: https://wlavcwifxmtwewhakjqg.supabase.co
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://wlavcwifxmtwewhakjqg.supabase.co';
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsYXZjd2lmeG10d2V3aGFranFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2Mzg3NzEsImV4cCI6MjEwNTIxNDc3MX0.XH246HWdcGZdAlnI-9yOyG8LpWYbSyzAH9K3rHD4Mew';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * A) REGISTRO / LOGIN:
 * Inserta o actualiza el usuario en la tabla 'profiles' (guardando username, etc.)
 */
export async function syncSupabaseProfile(user: {
  uid?: string;
  id?: string;
  username: string;
  total_points?: number;
  xp?: number;
  email?: string;
  avatar_url?: string;
  badge?: string;
}) {
  try {
    const userId = user.uid || user.id || '';
    const points = typeof user.total_points === 'number' 
      ? user.total_points 
      : (typeof user.xp === 'number' ? user.xp : 0);

    const payload = {
      id: userId,
      username: user.username || 'Aspirant',
      total_points: points
    };

    console.log('Sincronizando perfil en Supabase:', payload);

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      console.warn('Supabase sync profile error:', error.message, error);
      return null;
    }
    console.log('Perfil sincronizado con éxito en Supabase:', data);
    return data;
  } catch (err) {
    console.warn('Supabase sync profile exception:', err);
    return null;
  }
}

/**
 * B) LISTA DE RETOS:
 * SELECT de nombres y perfiles en 'profiles' para retar opositores
 */
export async function fetchProfilesForChallenges(currentUserId?: string) {
  try {
    let query = supabase
      .from('profiles')
      .select('id, username, total_points, avatar_url, updated_at');

    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    const { data, error } = await query.order('total_points', { ascending: false }).limit(50);

    if (error) {
      console.warn('Supabase fetch profiles error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase fetch profiles exception:', err);
    return [];
  }
}

/**
 * C) SISTEMA DE DUELOS / TURNOS:
 * 1. Al enviar un reto: INSERT en 'matches'
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

    const { data, error } = await supabase.from('matches').insert([{
      player1_id: challengerId,
      player2_id: opponentId,
      current_turn: challengerId,
      status: 'active',
      score_p1: 0,
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
 * C) SISTEMA DE DUELOS / TURNOS:
 * 2. Al responder o pasar turno: UPDATE en 'matches' actualizando current_turn y puntuación score_p1
 */
export async function updateMatchTurnInSupabase({
  matchId,
  currentTurn,
  scoreP1,
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
    if (state !== undefined) updatePayload.state = state;
    if (status) updatePayload.status = status;

    const { data, error } = await supabase
      .from('matches')
      .update(updatePayload)
      .eq('id', matchId)
      .select(); // Eliminado .single() para evitar excepciones PGRST116 / error 406

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
 * Consulta de partidas activas o concluidas del usuario en 'matches'
 */
export async function fetchUserMatches(userId: string) {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch matches error:', error.message, error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase fetch matches exception:', err);
    return [];
  }
}

/**
 * D) RANKING:
 * Consultar los usuarios de 'profiles' ordenados por total_points descendente
 */
export async function fetchSupabaseRanking(limitCount = 100) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, total_points, avatar_url')
      .order('total_points', { ascending: false })
      .limit(limitCount);

    if (error) {
      console.warn('Supabase ranking fetch error:', error.message, error);
      return [];
    }
    if (!data || data.length === 0) {
      console.warn('Supabase ranking vacío: la consulta a la tabla "profiles" no devolvió ningún registro.');
    } else {
      console.log(`Supabase ranking cargó ${data.length} usuarios desde "profiles":`, data);
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase ranking fetch exception:', err);
    return [];
  }
}