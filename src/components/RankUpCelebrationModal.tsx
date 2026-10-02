import React from 'react';
import { PoliceRank } from '../types';
import { ShieldRenderer } from './ShieldRenderer';
import { Award, Sparkles, Star, ChevronRight, CheckCircle, Shield, ArrowUpRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RankUpCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  newRank: PoliceRank;
  oldRank?: PoliceRank | null;
  currentXp: number;
  bonusMeritsAwarded?: number;
}

export const RankUpCelebrationModal: React.FC<RankUpCelebrationModalProps> = ({
  isOpen,
  onClose,
  newRank,
  oldRank,
  currentXp,
  bonusMeritsAwarded = 50
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 text-center shadow-2xl overflow-hidden animate-scaleIn">
        {/* Glow de fons */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Títol superior */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider mb-4 animate-bounce">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Felicitats, Agent! Ascens Oficial</span>
        </div>

        {/* Insígnia del nou rang */}
        <div className="relative my-2 flex justify-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-1 shadow-2xl shadow-amber-500/30 animate-pulse">
            <div className="w-full h-full rounded-[22px] bg-slate-950 flex flex-col items-center justify-center border border-amber-500/40">
              <span className="text-4xl filter drop-shadow-lg">{newRank.icon || '⭐'}</span>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-black text-white mt-3 tracking-tight">
          {newRank.name}
        </h2>
        <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mt-0.5">
          {newRank.categoryName || 'Cos de Mossos d\'Esquadra'}
        </p>

        {/* Descripció del rang */}
        <p className="text-xs text-slate-300 mt-3 leading-relaxed px-2 bg-slate-950/60 py-2.5 rounded-2xl border border-slate-800">
          {newRank.description || 'Has demostrat una constància i preparació exemplar en el domini del temari.'}
        </p>

        {/* Recompenses i Bonificacions Desbloquejades */}
        <div className="mt-5 space-y-2.5 text-left">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1 px-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Bonificacions i Recompenses Desbloquejades:</span>
          </div>

          <div className="p-3 bg-slate-950/80 border border-amber-500/30 rounded-2xl flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg border border-amber-500/30 font-black">
                🛍️
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-100">+50 Mèrits de Bonificació</h4>
                <p className="text-[10px] text-slate-400">Sumats directament al teu saldo per a la tenda</p>
              </div>
            </div>
            <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
              +50 🎖️
            </span>
          </div>

          <div className="p-3 bg-slate-950/80 border border-sky-500/30 rounded-2xl flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-lg border border-sky-500/30 font-black">
                🛡️
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-100">Nou Distintiu de Perfil</h4>
                <p className="text-[10px] text-slate-400">Distintiu oficial visible a Duels 1v1 i Rànquing</p>
              </div>
            </div>
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>

          <div className="p-3 bg-slate-950/80 border border-emerald-500/30 rounded-2xl flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg border border-emerald-500/30 font-black">
                ⚡
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-100">+1 Comodí de Duels Gratuït</h4>
                <p className="text-[10px] text-slate-400">Pots descartar 2 respostes errònies</p>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
              +1 🎫
            </span>
          </div>
        </div>

        {/* Botó de continuar */}
        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Reclamar Recompenses i Continuar</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
