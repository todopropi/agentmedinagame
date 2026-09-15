import React from 'react';
import { X, Award, CheckCircle2, ChevronRight } from 'lucide-react';
import { OFFICIAL_RANKS_LIST } from '../data/ranks';
import { AudioEngine } from '../utils/audio';

interface RanksModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentXp: number;
}

export const RanksModal: React.FC<RanksModalProps> = ({ isOpen, onClose, currentXp }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-lg">
              👮‍♂️
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">Escales i Rangs Policials</h3>
              <p className="text-[11px] text-slate-400">Guia de progressió oficial segons l'experiència (XP)</p>
            </div>
          </div>
          <button
            onClick={() => {
              AudioEngine.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Tancar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-2.5 divide-y divide-slate-800/40">
          {OFFICIAL_RANKS_LIST.map((rank) => {
            const isUnlocked = currentXp >= rank.minXp;
            const isCurrent = isUnlocked && (
              OFFICIAL_RANKS_LIST.find(
                (r, idx) => r.id === rank.id && (idx === OFFICIAL_RANKS_LIST.length - 1 || currentXp < OFFICIAL_RANKS_LIST[idx + 1].minXp)
              ) !== undefined
            );

            return (
              <div 
                key={rank.id}
                className={`pt-2.5 first:pt-0 p-3 rounded-2xl transition-all ${
                  isCurrent 
                    ? 'bg-amber-500/10 border border-amber-500/40 shadow-md' 
                    : isUnlocked 
                      ? 'bg-slate-800/30 border border-slate-800/60' 
                      : 'bg-slate-950/40 border border-slate-900 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-xl shrink-0">
                      {rank.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {rank.scale}
                        </span>
                        <h4 className="text-sm font-black text-white">{rank.title}</h4>
                        {isCurrent && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                            RANG ACTUAL
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{rank.desc}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-amber-400 block">
                      {rank.minXp.toLocaleString()} XP
                    </span>
                    {isUnlocked ? (
                      <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-0.5 justify-end mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Assolit
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">
                        +{Math.max(0, rank.minXp - currentXp).toLocaleString()} XP
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span>La teva experiència: <b className="text-amber-400">{currentXp.toLocaleString()} XP</b></span>
          <button
            onClick={() => {
              AudioEngine.playClick();
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer text-xs"
          >
            Entesos
          </button>
        </div>
      </div>
    </div>
  );
};
