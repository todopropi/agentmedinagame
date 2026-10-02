import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { getAllRegisteredUsers, getStoredLeaderboard } from '../firebase';
import { supabase, fetchSupabaseRanking, subscribeToRankingUpdates } from '../../supabase';
import { calculateRank } from '../data/ranks';
import { ShieldRenderer } from './ShieldRenderer';
import { Trophy, Medal, Crown, Sparkles, Award, RefreshCw } from 'lucide-react';

interface RankingGlobalProps {
  currentUser: UserProfile;
}

const AspirantAvatar: React.FC<{ photoURL?: string; displayName?: string }> = ({ photoURL, displayName }) => {
  const [hasError, setHasError] = useState(false);

  // Considerem una URL potencialment vàlida només si té protocol o és un data-URI o ruta relativa
  const isPlausibleUrl = Boolean(
    photoURL && 
    typeof photoURL === 'string' && 
    (
      photoURL.startsWith('http://') ||
      photoURL.startsWith('https://') ||
      photoURL.startsWith('data:image/') ||
      photoURL.startsWith('/') ||
      photoURL.startsWith('./')
    )
  );

  if (!isPlausibleUrl || hasError) {
    return (
      <span 
        className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs shrink-0 select-none shadow-sm"
        title={displayName || 'Aspirant'}
      >
        👮
      </span>
    );
  }

  return (
    <img 
      src={photoURL} 
      alt={displayName || 'Aspirant'} 
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
      className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0 bg-slate-800" 
    />
  );
};

export const RankingGlobal: React.FC<RankingGlobalProps> = ({ currentUser }) => {
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>(() => {
    const cached = getStoredLeaderboard();
    return cached.length > 0 ? cached : [currentUser];
  });
  const [loading, setLoading] = useState(false);

  const loadRanking = useCallback(async () => {
    setLoading(true);
    try {
      const [users, spRanking] = await Promise.all([
        getAllRegisteredUsers().catch(() => []),
        fetchSupabaseRanking(200)
      ]);

      if (!spRanking || spRanking.length === 0) {
        console.warn('⚠️ [RankingGlobal] La consulta a Supabase retornó 0 perfils.');
      } else {
        console.log(`✅ [RankingGlobal] Supabase ha retornat ${spRanking.length} perfils d'opositors.`);
      }

      // Carregar dades addicionals de mèrits per cada usuari de Supabase (user_progression i matches user_data_*)
      const userDataMap = new Map<string, { merits?: number; xp?: number; equippedShieldId?: string; username?: string }>();
      
      // 1. Llegir primer de la taula user_progression
      try {
        const { data: progData } = await supabase.from('user_progression').select('*');
        if (progData) {
          progData.forEach((p: any) => {
            if (p.user_id) {
              userDataMap.set(p.user_id, {
                merits: typeof p.merits === 'number' ? p.merits : undefined,
                xp: typeof p.xp === 'number' ? p.xp : undefined,
                equippedShieldId: p.equipped_shield_id,
                username: p.username && p.username !== 'Aspirant' && p.username !== 'Aspirant Medina' ? p.username : undefined
              });
            }
          });
        }
      } catch (err) {}

      // 2. Llegir de matches com a suport addicional
      try {
        const { data: matchData } = await supabase
          .from('matches')
          .select('player1_id, score_p1, score_p2, state')
          .like('id', 'user_data_%');
        if (matchData) {
          matchData.forEach(m => {
            const uid = m.player1_id || m.state?.userId;
            if (uid) {
              const prev = userDataMap.get(uid);
              const merits = typeof m.state?.merits === 'number'
                ? m.state.merits
                : (typeof m.score_p1 === 'number' ? m.score_p1 : undefined);
              const xp = typeof m.state?.xp === 'number'
                ? m.state.xp
                : (typeof m.score_p2 === 'number' ? m.score_p2 : undefined);
              const equippedShieldId = m.state?.equippedShieldId;
              const stateName = m.state?.username || m.state?.displayName || m.state?.userName;
              const username = (stateName && stateName !== 'Aspirant' && stateName !== 'Aspirant Medina')
                ? stateName
                : prev?.username;
              
              userDataMap.set(uid, {
                merits: typeof prev?.merits === 'number' && prev.merits > 0 ? prev.merits : merits,
                xp: typeof prev?.xp === 'number' && prev.xp > 0 ? prev.xp : xp,
                equippedShieldId: prev?.equippedShieldId || equippedShieldId,
                username: username || prev?.username
              });
            }
          });
        }
      } catch (err) {
        console.warn('Could not fetch user game data for ranking:', err);
      }

      // Convertir tots els registres de la taula profiles de Supabase a UserProfile
      const spUsers: UserProfile[] = (spRanking || []).map((p: any) => {
        const points = Number(p.total_points) || 0;
        const isUrl = Boolean(
          p.avatar_url && (
            p.avatar_url.startsWith('http://') || 
            p.avatar_url.startsWith('https://') || 
            p.avatar_url.startsWith('data:image/') ||
            p.avatar_url.startsWith('/') ||
            p.avatar_url.startsWith('./')
          )
        );
        const uData = userDataMap.get(p.id);
        const shieldId = isUrl ? 'generic_pvc' : (p.equipped_shield_id || p.avatar_url || uData?.equippedShieldId || 'generic_pvc');
        const photo = isUrl ? p.avatar_url : undefined;

        const resolvedXp = typeof uData?.xp === 'number' && uData.xp > 0 
          ? Math.max(points, uData.xp) 
          : (typeof p.xp === 'number' && p.xp > 0 ? p.xp : points);

        const resolvedMerits = typeof uData?.merits === 'number' && uData.merits > 0
          ? uData.merits
          : (typeof p.merits === 'number' && p.merits > 0
            ? p.merits
            : Math.max(0, Math.floor(resolvedXp / 10)));

        const resolvedName = 
          (p.username && p.username !== 'Aspirant' && p.username !== 'Aspirant Medina' ? p.username : null) ||
          (uData?.username && uData.username !== 'Aspirant' && uData.username !== 'Aspirant Medina' ? uData.username : null) ||
          p.username || uData?.username || (p.email ? p.email.split('@')[0] : 'Aspirant');

        return {
          uid: p.id,
          displayName: resolvedName,
          email: p.email || '',
          xp: resolvedXp,
          merits: resolvedMerits,
          rank: calculateRank(resolvedXp),
          equippedShieldId: shieldId,
          unlockedShieldIds: [shieldId],
          failedQuestionIds: [],
          savedQuestionIds: [],
          photoURL: photo
        };
      });

      const userMap = new Map<string, UserProfile>();

      // Carregar usuaris previs
      if (Array.isArray(users)) {
        users.forEach(u => userMap.set(u.uid, u));
      }

      // Integrar tots els opositors de Supabase (sense cap filtre per id)
      spUsers.forEach(u => {
        const existing = userMap.get(u.uid);
        if (existing) {
          if (u.uid === currentUser.uid) {
            userMap.set(u.uid, {
              ...existing,
              ...u,
              ...currentUser,
              displayName: currentUser.displayName || u.displayName || existing.displayName,
              xp: currentUser.xp,
              merits: currentUser.merits,
              equippedShieldId: currentUser.equippedShieldId || u.equippedShieldId || existing.equippedShieldId || 'generic_pvc'
            });
          } else {
            const bestXp = Math.max(u.xp, existing.xp || 0);
            const bestMerits = typeof u.merits === 'number' && u.merits > 0 
              ? u.merits 
              : (typeof existing.merits === 'number' && existing.merits > 0 ? existing.merits : u.merits);
            const bestName = 
              (existing.displayName && existing.displayName !== 'Aspirant' && existing.displayName !== 'Aspirant Medina' ? existing.displayName : null) ||
              (u.displayName && u.displayName !== 'Aspirant' && u.displayName !== 'Aspirant Medina' ? u.displayName : null) ||
              existing.displayName || u.displayName || 'Aspirant';

            userMap.set(u.uid, {
              ...existing,
              ...u,
              displayName: bestName,
              xp: bestXp,
              merits: bestMerits,
              rank: calculateRank(bestXp),
              photoURL: u.photoURL || existing.photoURL,
              equippedShieldId: u.equippedShieldId || existing.equippedShieldId || 'generic_pvc'
            });
          }
        } else {
          userMap.set(u.uid, u);
        }
      });

      // Assegurar que l'usuari actual també apareix al rànquing amb els seus mèrits i escut exactes
      if (!userMap.has(currentUser.uid)) {
        userMap.set(currentUser.uid, currentUser);
      } else {
        const currentInMap = userMap.get(currentUser.uid)!;
        userMap.set(currentUser.uid, {
          ...currentInMap,
          ...currentUser,
          displayName: currentUser.displayName || currentInMap.displayName,
          xp: Math.max(currentUser.xp, currentInMap.xp || 0),
          merits: currentUser.merits,
          rank: calculateRank(currentUser.xp),
          equippedShieldId: currentUser.equippedShieldId || currentInMap.equippedShieldId || 'generic_pvc'
        });
      }

      const finalUsers = Array.from(userMap.values());
      setLeaderboard(finalUsers);

      // Comprovar si l'usuari ha pujat posicions al rànquing
      try {
        const sortedList = [...finalUsers].sort((a, b) => b.xp - a.xp);
        const myCurrentIndex = sortedList.findIndex(u => u.uid === currentUser.uid);
        if (myCurrentIndex >= 0) {
          const myCurrentPos = myCurrentIndex + 1;
          const storageKey = `medina_last_rank_pos_${currentUser.uid}`;
          const lastPosStr = localStorage.getItem(storageKey);
          if (lastPosStr) {
            const lastPos = parseInt(lastPosStr, 10);
            if (!isNaN(lastPos) && lastPos > myCurrentPos) {
              // Ha avançat posicions!
              const overtookUser = sortedList[myCurrentPos]; // Usuari al que ha superat
              window.dispatchEvent(new CustomEvent('leaderboard_position_advanced', {
                detail: {
                  previousPos: lastPos,
                  newPos: myCurrentPos,
                  opponentName: overtookUser?.displayName || 'un company'
                }
              }));
            }
          }
          localStorage.setItem(storageKey, myCurrentPos.toString());
        }
      } catch (posErr) {
        console.warn('Error checking leaderboard position rise:', posErr);
      }
    } catch (err) {
      console.warn('❌ [RankingGlobal] Error carregant rànquings des de Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadRanking();
    const unsubscribe = subscribeToRankingUpdates(() => {
      loadRanking();
    });
    const handleProfileSynced = () => {
      loadRanking();
    };
    window.addEventListener('profile_synced', handleProfileSynced);
    return () => {
      unsubscribe();
      window.removeEventListener('profile_synced', handleProfileSynced);
    };
  }, [loadRanking, currentUser.merits, currentUser.xp, currentUser.equippedShieldId]);
  
  // Sort by XP descending
  const sorted = [...leaderboard].sort((a, b) => b.xp - a.xp);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl">
                <Trophy className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Rànquing Policial Global (Escala d'Aspirants)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Classificació oficial de la promoció ordenada per punts d'experiència (XP) acumulats en el Tauler de l'Oca i els Duels 1v1.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadRanking()}
              disabled={loading}
              title="Actualitzar rànquing des de Supabase"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Actualitzar</span>
            </button>

            <div className="text-xs font-bold text-slate-400 px-3 py-1.5 bg-slate-800 rounded-xl border border-slate-700">
              {sorted.length} Opositors actius
            </div>
          </div>
        </div>

        {/* Top 3 Podium Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8">
          {sorted.slice(0, 3).map((player, idx) => {
            let medalColor = "from-amber-500 to-amber-600 text-slate-950";
            let medalLabel = "🥇 1r Lloc";
            let borderColor = "border-amber-500/60 shadow-amber-500/10";

            if (idx === 1) {
              medalColor = "from-slate-300 to-slate-400 text-slate-950";
              medalLabel = "🥈 2n Lloc";
              borderColor = "border-slate-400/60";
            } else if (idx === 2) {
              medalColor = "from-amber-700 to-amber-800 text-white";
              medalLabel = "🥉 3r Lloc";
              borderColor = "border-amber-700/60";
            }

            return (
              <div
                key={player.uid}
                className={`bg-slate-950/70 border rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center relative overflow-hidden shadow-xl ${borderColor}`}
              >
                <div className={`px-2.5 py-0.5 rounded-full bg-gradient-to-r ${medalColor} font-black text-[10px] uppercase mb-3 shadow`}>
                  {medalLabel}
                </div>

                <div className="relative mb-2">
                  <ShieldRenderer shieldId={player.equippedShieldId} size={54} glow={idx === 0} />
                </div>

                <h4 className="text-sm font-extrabold text-white truncate max-w-full">
                  {player.displayName}
                </h4>
                <span className="text-[11px] font-semibold text-sky-400">
                  {player.rank.name}
                </span>

                <div className="mt-3 pt-2 border-t border-slate-800 w-full flex items-center justify-around text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block">XP</span>
                    <b className="text-white font-mono">{player.xp.toLocaleString()}</b>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Mèrits</span>
                    <b className="text-amber-400 font-mono">{player.merits.toLocaleString()}</b>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Posició</th>
                <th className="p-3.5">Aspirant / Agent</th>
                <th className="p-3.5">Ranger Policial</th>
                <th className="p-3.5">Escut Actiu</th>
                <th className="p-3.5 text-right">Punts XP</th>
                <th className="p-3.5 text-right">Mèrits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sorted.map((player, pIdx) => {
                const isCurrent = player.uid === currentUser.uid;

                return (
                  <tr 
                    key={player.uid}
                    className={`transition-colors ${
                      isCurrent 
                        ? 'bg-amber-500/10 font-bold text-white' 
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="p-3.5 font-mono font-bold">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                        pIdx === 0 ? 'bg-amber-500 text-slate-950 font-black' :
                        pIdx === 1 ? 'bg-slate-300 text-slate-950 font-black' :
                        pIdx === 2 ? 'bg-amber-700 text-white font-black' : 'text-slate-500'
                      }`}>
                        {pIdx + 1}
                      </span>
                    </td>

                    <td className="p-3.5 font-extrabold flex items-center gap-2.5">
                      <AspirantAvatar photoURL={player.photoURL} displayName={player.displayName} />
                      <span>{player.displayName}</span>
                      {isCurrent && (
                        <span className="text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-black uppercase">
                          TU
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-sky-300 border border-slate-700">
                        {player.rank.name}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <ShieldRenderer shieldId={player.equippedShieldId} size={28} />
                    </td>

                    <td className="p-3.5 text-right font-mono font-bold text-white text-sm">
                      {player.xp.toLocaleString()}
                    </td>

                    <td className="p-3.5 text-right font-mono font-bold text-amber-400">
                      {player.merits.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
