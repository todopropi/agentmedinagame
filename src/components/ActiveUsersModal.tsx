import React, { useState, useEffect } from 'react';
import { UserProfile, DuelGame } from '../types';
import { getActiveUsers, searchUsers, getAllUsersList, createDirectChallengeGame } from '../firebase';
import { ShieldRenderer } from './ShieldRenderer';
import { AudioEngine } from '../utils/audio';
import { 
  Users, 
  Search, 
  Radio, 
  Swords, 
  X, 
  Shield, 
  Mail, 
  Clock, 
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';

interface ActiveUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onStartDuelWithUser: (game: DuelGame) => void;
}

export const ActiveUsersModal: React.FC<ActiveUsersModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onStartDuelWithUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeUsers, setActiveUsers] = useState<UserProfile[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'search' | 'all'>('active');
  const [loading, setLoading] = useState(false);
  const [challengingUid, setChallengingUid] = useState<string | null>(null);

  // Load active and all users on open
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [active, all] = await Promise.all([
          getActiveUsers(currentUser.uid),
          getAllUsersList()
        ]);
        setActiveUsers(active);
        setAllUsers(all.filter(u => u.uid !== currentUser.uid));
      } catch (err) {
        console.error('Error loading users:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, currentUser.uid]);

  // Handle Search Input
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchUsers(searchTerm, currentUser.uid);
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, currentUser.uid]);

  if (!isOpen) return null;

  const handleChallenge = async (targetUser: UserProfile) => {
    AudioEngine.playClick();
    setChallengingUid(targetUser.uid);
    try {
      const newGame = await createDirectChallengeGame(currentUser, targetUser);
      onStartDuelWithUser(newGame);
      onClose();
    } catch (err) {
      console.error('Failed to create direct challenge:', err);
    } finally {
      setChallengingUid(null);
    }
  };

  const displayedList = searchTerm.trim() 
    ? searchResults 
    : activeTab === 'active' 
      ? activeUsers 
      : allUsers;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Opositors Actius & Cerca de Rivals
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {activeUsers.length} en línia
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Troba companys d'oposició connectats o cerca per correu i TIP policial
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              AudioEngine.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/50 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca per nom, TIP o correu electrònic (Ex: Marc, @gmail.com)..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sub-tabs when not searching */}
          {!searchTerm.trim() && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>En Línia Ara ({activeUsers.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Tots els Registrats ({allUsers.length})</span>
              </button>
            </div>
          )}
        </div>

        {/* Informative Explanation Banner */}
        <div className="px-4 py-2 bg-sky-950/30 border-b border-sky-900/40 flex items-center gap-2 text-[11px] text-sky-300">
          <Info className="w-4 h-4 shrink-0 text-sky-400" />
          <span>
            <b>Com funciona el registre:</b> Cada usuari que entra amb Google o correu es sincronitza al cens d'aspirants. Pots cercar-lo pel seu correu complet o nom per reptar-lo directament.
          </span>
        </div>

        {/* Users List Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 max-h-[420px]">
          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Sincronitzant aspirants...</p>
            </div>
          ) : displayedList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-xs sm:text-sm font-bold text-slate-400">
                {searchTerm ? `No s'ha trobat cap opositor amb "${searchTerm}"` : "No hi ha usuaris disponibles en aquest moment."}
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                {searchTerm ? "Comprova que el correu o nom estigui ben escrit o prova amb una paraula més curta." : "Convida altres aspirants compartint el teu codi de sala!"}
              </p>
            </div>
          ) : (
            displayedList.map((targetUser) => {
              const isOnline = targetUser.isOnline === true || (targetUser.lastActive && (Date.now() - targetUser.lastActive) < 30 * 60 * 1000);
              const isChallenging = challengingUid === targetUser.uid;

              return (
                <div
                  key={targetUser.uid}
                  className="p-3 sm:p-3.5 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 rounded-2xl transition-all flex items-center justify-between gap-3 shadow-md group"
                >
                  {/* Left: Avatar & Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <ShieldRenderer shieldId={targetUser.equippedShieldId} size={42} glow={false} />
                      {isOnline && (
                        <span 
                          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" 
                          title="Connectat ara"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-black text-white truncate max-w-[150px] sm:max-w-[220px]">
                          {targetUser.displayName}
                        </h4>
                        {isOnline ? (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            EN LÍNIA
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            Desconnectat
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-amber-400 font-semibold">{targetUser.rank.name}</span>
                        <span className="text-slate-600">•</span>
                        <span className="font-mono text-slate-300">{targetUser.xp.toLocaleString()} XP</span>
                        {targetUser.email && (
                          <>
                            <span className="text-slate-600 hidden xs:inline">•</span>
                            <span className="text-slate-500 text-[10px] truncate max-w-[140px] hidden xs:inline flex items-center gap-1">
                              <Mail className="w-2.5 h-2.5" />
                              {targetUser.email}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Challenge Action */}
                  <button
                    onClick={() => handleChallenge(targetUser)}
                    disabled={isChallenging}
                    className="py-2 px-3 sm:px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-transform cursor-pointer shrink-0 disabled:opacity-60"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>{isChallenging ? 'Reptant...' : 'Reptar 1v1'}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px]">Sessió activa com a <b>{currentUser.displayName}</b></span>
          </div>

          <button
            onClick={() => {
              AudioEngine.playClick();
              onClose();
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Tancar
          </button>
        </div>

      </div>
    </div>
  );
};
