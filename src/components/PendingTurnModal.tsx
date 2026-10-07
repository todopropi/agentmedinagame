import React, { useState, useEffect } from 'react';
import { DuelGame, UserProfile } from '../types';
import { ShieldRenderer } from './ShieldRenderer';
import { AudioEngine } from '../utils/audio';
import { Swords, Clock, AlertTriangle, Play, X, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

interface PendingTurnModalProps {
  isOpen: boolean;
  game: DuelGame | null;
  pendingGames?: DuelGame[];
  currentUser: UserProfile;
  onPlayTurn: (gameId: string) => void;
  onDismiss: () => void;
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 7 dies (1 setmana = 168 hores)

export const PendingTurnModal: React.FC<PendingTurnModalProps> = ({
  isOpen,
  game,
  pendingGames = [],
  currentUser,
  onPlayTurn,
  onDismiss
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Llista unificada de duels pendents
  const gamesList = pendingGames.length > 0 ? pendingGames : (game ? [game] : []);
  const activeDuel = gamesList[currentIndex] || game;

  const isToc = Boolean(activeDuel?.lastTocAt && (Date.now() - (activeDuel.lastTocAt || 0) < 24 * 3600 * 1000));

  useEffect(() => {
    if (currentIndex >= gamesList.length) {
      setCurrentIndex(0);
    }
  }, [gamesList.length, currentIndex]);

  // Reproduir so d'alerta o notificació en obrir la finestra emergent
  useEffect(() => {
    if (isOpen && activeDuel) {
      if (isToc) {
        AudioEngine.playWarningAlarm();
      } else {
        AudioEngine.playNotification();
      }
    }
  }, [isOpen, activeDuel?.id, isToc]);

  if (!isOpen || !activeDuel || activeDuel.currentTurnUid !== currentUser.uid || activeDuel.status !== 'active') return null;

  const isHost = activeDuel.hostPlayerUid === currentUser.uid;
  const rivalName = isHost 
    ? (activeDuel.guestPlayerName || 'Aspirant Opositor') 
    : (activeDuel.hostPlayerName || 'Aspirant Opositor');
  const rivalShield = isHost 
    ? (activeDuel.guestPlayerShieldId || 'generic_pvc') 
    : (activeDuel.hostPlayerShieldId || 'generic_pvc');
  const myStripes = isHost ? activeDuel.hostRedStripes : activeDuel.guestRedStripes;
  const rivalStripes = isHost ? activeDuel.guestRedStripes : activeDuel.hostRedStripes;

  // Càlcul del temps restant d'1 setmana (168 hores màxim)
  const turnStartTime = activeDuel.lastUpdated || Date.now();
  const timeElapsed = Math.max(0, Date.now() - turnStartTime);
  const timeLeftMs = Math.max(0, ONE_WEEK_MS - timeElapsed);

  const totalHoursLeft = Math.floor(timeLeftMs / (3600 * 1000));
  const daysLeft = Math.floor(timeLeftMs / (24 * 3600 * 1000));
  const hoursLeft = Math.floor((timeLeftMs % (24 * 3600 * 1000)) / (3600 * 1000));
  const isUrgent = daysLeft === 0;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        className={`w-full max-w-md bg-slate-900 border-2 rounded-3xl shadow-2xl p-5 sm:p-7 relative overflow-hidden flex flex-col items-center text-center animate-scale-in ${
          isToc ? 'border-red-500 shadow-red-500/20' : 'border-amber-500/80'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow decoratiu superior */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 rounded-full shadow-lg ${
          isToc 
            ? 'bg-gradient-to-r from-red-500 via-rose-400 to-amber-500 shadow-red-500/50' 
            : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 shadow-amber-500/50'
        }`} />

        {/* Botó Tancar a dalt a la dreta */}
        <button
          onClick={() => {
            AudioEngine.playClick();
            onDismiss();
          }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          title="Tancar i contestar més tard"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icona central amb espases animades */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl text-slate-950 mb-3 border-2 border-white/20 ${
          isToc 
            ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/40 text-white' 
            : 'bg-gradient-to-br from-amber-500 to-yellow-600 shadow-amber-500/30 text-slate-950'
        }`}>
          <Swords className="w-8 h-8 animate-pulse" />
        </div>

        {/* Indicador de duels pendents si n'hi ha més d'un */}
        {gamesList.length > 1 && (
          <div className="flex items-center gap-2 mb-2 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700 text-xs text-amber-300">
            <button
              onClick={() => {
                AudioEngine.playClick();
                setCurrentIndex(prev => (prev > 0 ? prev - 1 : gamesList.length - 1));
              }}
              className="p-1 hover:text-white cursor-pointer"
              title="Duel anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-black text-[11px] uppercase tracking-wider">
              Duel {currentIndex + 1} de {gamesList.length} pendents
            </span>
            <button
              onClick={() => {
                AudioEngine.playClick();
                setCurrentIndex(prev => (prev < gamesList.length - 1 ? prev + 1 : 0));
              }}
              className="p-1 hover:text-white cursor-pointer"
              title="Següent duel"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Avís destacat tipus Admin si és un Toc o badge de torn */}
        {isToc ? (
          <div className="w-full mb-3 p-3 rounded-2xl bg-gradient-to-r from-red-600/30 via-rose-600/20 to-amber-600/30 border-2 border-red-500/80 shadow-lg shadow-red-500/20 text-center animate-pulse">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">🚨</span>
              <span className="text-xs sm:text-sm font-black text-rose-300 uppercase tracking-wide">
                AVÍS DIRECTE: TOC D'ATENCIÓ!
              </span>
            </div>
            <p className="text-[11px] text-amber-200/90 font-medium mt-1">
              <strong className="text-white font-bold">{activeDuel.lastTocFrom || rivalName}</strong> t'ha enviat un toc perquè responguis al vostre duel ara mateix.
            </p>
          </div>
        ) : (
          <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-2 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400 animate-bounce" />
            <span>TORN DE DUEL PENDENT</span>
          </span>
        )}

        <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
          ¡Et toca respondre!
        </h3>
        <p className="text-xs text-slate-300 mt-1 max-w-xs">
          El teu oponent <strong className="text-amber-400">{rivalName}</strong> està esperant la teva resposta.
        </p>

        {/* Caixa de cara a cara i marcador */}
        <div className="w-full my-4 p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-around gap-2 shadow-inner">
          {/* Tu */}
          <div className="flex flex-col items-center min-w-0">
            <span className="text-[10px] font-bold text-sky-400 mb-1">Tu</span>
            <div className="p-1 rounded-xl bg-slate-900 border border-sky-500/40 flex items-center justify-center">
              <ShieldRenderer shieldId={currentUser.equippedShieldId || 'generic_pvc'} size={38} />
            </div>
            <span className="text-xs font-black text-white mt-1">
              {myStripes}/4 Ratlles
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-sm font-black text-amber-400">VS</span>
            <span className="text-[10px] font-mono text-slate-500">#{activeDuel.shareCode}</span>
          </div>

          {/* Rival */}
          <div className="flex flex-col items-center min-w-0">
            <span className="text-[10px] font-bold text-amber-400 mb-1 truncate max-w-[85px]">
              {rivalName}
            </span>
            <div className="p-1 rounded-xl bg-slate-900 border border-amber-500/40 flex items-center justify-center">
              <ShieldRenderer shieldId={rivalShield} size={38} />
            </div>
            <span className="text-xs font-black text-white mt-1">
              {rivalStripes}/4 Ratlles
            </span>
          </div>
        </div>

        {/* Caixa de límit de temps / compte enrere */}
        <div className={`w-full p-3.5 rounded-2xl border mb-5 text-left flex items-start gap-3 transition-colors ${
          isUrgent
            ? 'bg-red-950/40 border-red-500/60 text-red-200'
            : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
        }`}>
          <div className={`p-2 rounded-xl shrink-0 ${
            isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            {isUrgent ? <AlertTriangle className="w-5 h-5 animate-bounce" /> : <Clock className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xs font-black tracking-wide flex items-center gap-1.5">
              <span>
                {isUrgent
                  ? `🔥 URGENT: Contesta en menys de ${hoursLeft} hores!`
                  : `⏳ Contesta en menys de ${totalHoursLeft} hores (${daysLeft} dies i ${hoursLeft}h)`}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug mt-1">
              Termini límit d'<strong>1 setmana (168h)</strong> per respondre. Si no contestes abans que s'esgoti el temps, el sistema atorgarà automàticament la <strong>victòria per inactivitat</strong> al teu rival.
            </p>
          </div>
        </div>

        {/* Botons d'acció directes: CONTESTAR ARA o CONTESTAR MÉS TARD */}
        <div className="w-full space-y-2">
          <button
            type="button"
            onClick={() => {
              AudioEngine.playClick();
              onPlayTurn(activeDuel.id);
            }}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>⚔️ CONTESTAR ARA</span>
          </button>

          <button
            type="button"
            onClick={() => {
              AudioEngine.playClick();
              onDismiss();
            }}
            className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            ⏳ Contestar més tard
          </button>
        </div>
      </div>
    </div>
  );
};
