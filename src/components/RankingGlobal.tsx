import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { getAllRegisteredUsers, getStoredLeaderboard } from '../firebase';
import { fetchSupabaseRanking } from '../../supabase';
import { calculateRank } from '../data/ranks';
import { ShieldRenderer } from './ShieldRenderer';
import { Trophy, Medal, Crown, Sparkles, Award } from 'lucide-react';

interface RankingGlobalProps {
  currentUser: UserProfile;
}

export const RankingGlobal: React.FC<RankingGlobalProps> = ({ currentUser }) => {
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>(() => {
    const cached = getStoredLeaderboard();
    return cached.length > 0 ? cached : [currentUser];
  });

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getAllRegisteredUsers(),
      fetchSupabaseRanking()
    ]).then(([users, spRanking]) => {
      if (!isMounted) return;

      if (!spRanking || spRanking.length === 0) {
        console.warn('⚠️ [RankingGlobal] La consulta a Supabase fetchSupabaseRanking() retornó una lista vacía. Comprueba que la tabla "profiles" tenga registros o revisa si las políticas RLS permiten lectura anónima (SELECT).');
      } else {
        console.log(`✅ [RankingGlobal] Supabase ha retornado ${spRanking.length} perfiles.`);
      }

      const spUsers: UserProfile[] = (spRanking || []).map((p: any) => ({
        uid: p.id,
        displayName: p.username || 'Aspirant',
        email: '',
        xp: p.total_points || 0,
        merits: Math.floor((p.total_points || 0) / 10),
        rank: calculateRank(p.total_points || 0),
        equippedShieldId: 'escut_basico',
        unlockedShieldIds: ['escut_basico'],
        failedQuestionIds: [],
        savedQuestionIds: [],
        photoURL: p.avatar_url
      }));

      const userMap = new Map<string, UserProfile>();
      spUsers.forEach(u => userMap.set(u.uid, u));
      if (Array.isArray(users)) {
        users.forEach(u => userMap.set(u.uid, u));
      }
      if (!userMap.has(currentUser.uid)) {
        userMap.set(currentUser.uid, currentUser);
      }
      setLeaderboard(Array.from(userMap.values()));
    }).catch(err => {
      console.warn('❌ [RankingGlobal] Error cargando rankings desde Supabase / Firebase:', err);
    });
    return () => { isMounted = false; };
  }, [currentUser]);
  
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

          <div className="text-xs font-bold text-slate-400 px-3 py-1.5 bg-slate-800 rounded-xl border border-slate-700">
            {sorted.length} Opositors actius
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
                      {player.photoURL ? (
                        <img src={player.photoURL} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-700" />
                      ) : (
                        <span className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs">👮</span>
                      )}
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
